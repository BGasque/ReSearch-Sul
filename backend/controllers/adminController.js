import prisma from '../services/adapter.js';
import validarConteudo from '../services/validarConteudo.js';
import { incluirPainel, formatarPainel } from '../services/formatarPainel.js';

// Área do administrador (moderação, CU14, e taxonomias, CU16).
// O administrador vê os conteúdos de TODAS as instituições e pode aprovar, recusar, editar e excluir.

const SITUACOES = ['PENDENTE', 'APROVADO', 'RECUSADO', 'ARQUIVADO'];
const GRUPOS_TAG = ['Eixo', 'Nível de ensino', 'Formato', 'Tema'];

// Procura um conteúdo de qualquer instituição pelo id da URL
async function buscarConteudo(idTexto) {
    const id = Number(idTexto);
    if (!Number.isInteger(id)) return null;
    return prisma.conteudo.findUnique({ where: { id }, include: incluirPainel });
}

function texto(valor) {
    return typeof valor === 'string' ? valor.trim() : '';
}

function controller() {
    return {
        get prisma() {
            return prisma;
        },

        // ---------- Resumo ----------

        // Números do topo do painel
        async resumo(req, res) {
            try {
                const [porSituacao, porTipoConta, tags] = await Promise.all([
                    prisma.conteudo.groupBy({ by: ['situacao'], _count: true }),
                    prisma.usuario.groupBy({ by: ['tipo'], _count: true }),
                    prisma.tag.count({ where: { ativa: true } }),
                ]);

                const conteudos = Object.fromEntries(SITUACOES.map((s) => [s, 0]));
                porSituacao.forEach((item) => { conteudos[item.situacao] = item._count; });

                const contas = { PESSOA: 0, INSTITUICAO: 0, ADMIN: 0 };
                porTipoConta.forEach((item) => { contas[item.tipo] = item._count; });

                res.status(200).json({ conteudos, contas, tags });
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // ---------- Moderação de conteúdos ----------

        // Lista de conteúdos de todas as instituições (pode filtrar pela situação)
        async listar(req, res) {
            try {
                const { situacao } = req.query;
                if (situacao && !SITUACOES.includes(situacao)) {
                    return res.status(400).json("Situação inválida.");
                }

                const conteudos = await prisma.conteudo.findMany({
                    where: situacao ? { situacao } : {},
                    include: incluirPainel,
                    // Os mais antigos esperando primeiro (fila de moderação)
                    orderBy: { atualizadoEm: situacao === 'PENDENTE' ? 'asc' : 'desc' },
                });
                res.status(200).json(conteudos.map(formatarPainel));
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        async ver(req, res) {
            try {
                const conteudo = await buscarConteudo(req.params.id);
                if (!conteudo) return res.status(404).json("Conteúdo não encontrado.");
                res.status(200).json(formatarPainel(conteudo));
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Aprovar: passa a aparecer no catálogo
        async aprovar(req, res) {
            try {
                const atual = await buscarConteudo(req.params.id);
                if (!atual) return res.status(404).json("Conteúdo não encontrado.");
                if (atual.situacao === 'APROVADO') return res.status(400).json("Este conteúdo já está publicado.");

                const agora = new Date();
                const conteudo = await prisma.conteudo.update({
                    where: { id: atual.id },
                    data: {
                        situacao: 'APROVADO',
                        motivoRecusa: null,
                        moderadoEm: agora,
                        publicadoEm: atual.publicadoEm || agora,
                    },
                    include: incluirPainel,
                });
                res.status(200).json(formatarPainel(conteudo));
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Recusar: precisa explicar o motivo, que aparece para a instituição
        async recusar(req, res) {
            try {
                const atual = await buscarConteudo(req.params.id);
                if (!atual) return res.status(404).json("Conteúdo não encontrado.");

                const motivo = texto(req.body.motivo);
                if (motivo.length < 10 || motivo.length > 1000) {
                    return res.status(400).json("Explique o motivo da recusa (entre 10 e 1000 caracteres).");
                }

                const conteudo = await prisma.conteudo.update({
                    where: { id: atual.id },
                    data: { situacao: 'RECUSADO', motivoRecusa: motivo, moderadoEm: new Date() },
                    include: incluirPainel,
                });
                res.status(200).json(formatarPainel(conteudo));
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Editar qualquer conteúdo. A situação continua a mesma (o próprio admin está editando).
        async editar(req, res) {
            try {
                const atual = await buscarConteudo(req.params.id);
                if (!atual) return res.status(404).json("Conteúdo não encontrado.");

                const validado = await validarConteudo(req.body, atual.tags.map((item) => item.tag.id));
                if (validado.erro) return res.status(400).json(validado.erro);

                const [, , conteudo] = await prisma.$transaction([
                    prisma.conteudoArea.deleteMany({ where: { conteudoId: atual.id } }),
                    prisma.conteudoTag.deleteMany({ where: { conteudoId: atual.id } }),
                    prisma.conteudo.update({
                        where: { id: atual.id },
                        data: {
                            ...validado.dados,
                            areas: { create: validado.areas.map((areaId) => ({ areaId })) },
                            tags: { create: validado.tags.map((tagId) => ({ tagId })) },
                        },
                        include: incluirPainel,
                    }),
                ]);
                res.status(200).json(formatarPainel(conteudo));
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Excluir de vez (áreas e tags do conteúdo são apagadas junto)
        async excluir(req, res) {
            try {
                const atual = await buscarConteudo(req.params.id);
                if (!atual) return res.status(404).json("Conteúdo não encontrado.");

                await prisma.conteudo.delete({ where: { id: atual.id } });
                res.status(200).json("Conteúdo excluído.");
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // ---------- Tags (CU16) ----------

        // Todas as tags, inclusive as desativadas, com quantos conteúdos e pessoas usam cada uma
        async listarTags(req, res) {
            try {
                const tags = await prisma.tag.findMany({
                    orderBy: [{ grupo: 'asc' }, { nome: 'asc' }],
                    include: { _count: { select: { conteudos: true, interesses: true } } },
                });
                res.status(200).json(tags.map((tag) => ({
                    id: tag.id,
                    nome: tag.nome,
                    grupo: tag.grupo,
                    ativa: tag.ativa,
                    conteudos: tag._count.conteudos,
                    pessoas: tag._count.interesses,
                })));
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        async criarTag(req, res) {
            try {
                const nome = texto(req.body.nome);
                const grupo = texto(req.body.grupo);

                if (nome.length < 2 || nome.length > 40) return res.status(400).json("O nome da tag precisa ter entre 2 e 40 caracteres.");
                if (!GRUPOS_TAG.includes(grupo)) return res.status(400).json(`Escolha um grupo: ${GRUPOS_TAG.join(', ')}.`);

                // Não deixa criar tag repetida (o banco não diferencia maiúsculas de minúsculas)
                const existe = await prisma.tag.findUnique({ where: { nome } });
                if (existe) return res.status(409).json("Já existe uma tag com esse nome.");

                const tag = await prisma.tag.create({ data: { nome, grupo } });
                res.status(201).json(tag);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Renomear, trocar de grupo ou ativar/desativar
        async editarTag(req, res) {
            try {
                const id = Number(req.params.id);
                const atual = Number.isInteger(id) ? await prisma.tag.findUnique({ where: { id } }) : null;
                if (!atual) return res.status(404).json("Tag não encontrada.");

                const dados = {};
                if (req.body.nome !== undefined) {
                    const nome = texto(req.body.nome);
                    if (nome.length < 2 || nome.length > 40) return res.status(400).json("O nome da tag precisa ter entre 2 e 40 caracteres.");
                    const outra = await prisma.tag.findUnique({ where: { nome } });
                    if (outra && outra.id !== id) return res.status(409).json("Já existe uma tag com esse nome.");
                    dados.nome = nome;
                }
                if (req.body.grupo !== undefined) {
                    if (!GRUPOS_TAG.includes(req.body.grupo)) return res.status(400).json(`Escolha um grupo: ${GRUPOS_TAG.join(', ')}.`);
                    dados.grupo = req.body.grupo;
                }
                if (req.body.ativa !== undefined) {
                    if (typeof req.body.ativa !== 'boolean') return res.status(400).json("Valor inválido para ativa.");
                    dados.ativa = req.body.ativa;
                }

                const tag = await prisma.tag.update({ where: { id }, data: dados });
                res.status(200).json(tag);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Só dá para excluir tag que ninguém usa. Se estiver em uso, o certo é desativar (CU16).
        async excluirTag(req, res) {
            try {
                const id = Number(req.params.id);
                const tag = Number.isInteger(id)
                    ? await prisma.tag.findUnique({ where: { id }, include: { _count: { select: { conteudos: true, interesses: true } } } })
                    : null;
                if (!tag) return res.status(404).json("Tag não encontrada.");

                if (tag._count.conteudos > 0 || tag._count.interesses > 0) {
                    return res.status(409).json("Esta tag está em uso. Desative em vez de excluir.");
                }

                await prisma.tag.delete({ where: { id } });
                res.status(200).json("Tag excluída.");
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },
    }
}

export default controller;
