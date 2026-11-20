import prisma from '../services/adapter.js';
import validarConteudo from '../services/validarConteudo.js';
import { incluirPainel, formatarPainel } from '../services/formatarPainel.js';

// Área do administrador (moderação, CU14, e taxonomias, CU16).
// O administrador vê os conteúdos de TODAS as instituições e pode aprovar, recusar, editar e excluir.

const SITUACOES = ['PENDENTE', 'APROVADO', 'RECUSADO', 'ARQUIVADO', 'CORRECAO', 'OCULTO'];
const TIPOS_CONTA = ['PESSOA', 'INSTITUICAO', 'ADMIN'];

// Campos da conta que o administrador vê (nunca a senha)
const CAMPOS_USUARIO = {
    id: true, nome: true, email: true, tipo: true, bloqueado: true, verificado: true,
    criadoEm: true, termosAceitosEm: true,
    _count: { select: { conteudos: true, favoritos: true } },
};

function formatarUsuario({ _count, ...usuario }) {
    return { ...usuario, conteudos: _count.conteudos, favoritos: _count.favoritos };
}

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

// Registro da decisão (RF16): quem decidiu, o quê, por quê e quando
function registrar(req, conteudoId, acao, motivo = null) {
    return prisma.decisao.create({
        data: { conteudoId, adminId: req.user.id, adminNome: req.user.nome, acao, motivo },
    });
}

// Ações que mudam a situação e pedem uma explicação para a instituição
const MUDANCAS = {
    correcao: { situacao: 'CORRECAO', acao: 'PEDIU_CORRECAO', motivoObrigatorio: true, jaEsta: "Já foi pedida uma correção para este conteúdo.", pedido: "Explique o que precisa ser corrigido (entre 10 e 1000 caracteres)." },
    ocultar: { situacao: 'OCULTO', acao: 'OCULTOU', motivoObrigatorio: true, jaEsta: "Este conteúdo já está oculto.", pedido: "Explique por que está ocultando (entre 10 e 1000 caracteres)." },
    arquivar: { situacao: 'ARQUIVADO', acao: 'ARQUIVOU', motivoObrigatorio: false, jaEsta: "Este conteúdo já está arquivado.", pedido: "O motivo pode ter no máximo 1000 caracteres." },
};

// Monta a função de cada ação acima (pedir correção, ocultar, arquivar)
function mudarSituacao(tipo) {
    const regra = MUDANCAS[tipo];
    return async (req, res) => {
        try {
            const atual = await buscarConteudo(req.params.id);
            if (!atual) return res.status(404).json("Conteúdo não encontrado.");
            if (atual.situacao === regra.situacao) return res.status(400).json(regra.jaEsta);

            const motivo = texto(req.body?.motivo);
            const tamanhoErrado = regra.motivoObrigatorio ? (motivo.length < 10 || motivo.length > 1000) : motivo.length > 1000;
            if (tamanhoErrado) return res.status(400).json(regra.pedido);

            await prisma.$transaction([
                prisma.conteudo.update({
                    where: { id: atual.id },
                    data: { situacao: regra.situacao, motivoRecusa: motivo || null, moderadoEm: new Date() },
                }),
                registrar(req, atual.id, regra.acao, motivo || null),
            ]);
            res.status(200).json(formatarPainel(await buscarConteudo(atual.id)));
        } catch (error) {
            console.log(error.message);
            res.status(500).json("Erro no servidor.");
        }
    };
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
                const [porSituacao, porTipoConta, tags, aguardando, relatos] = await Promise.all([
                    prisma.conteudo.groupBy({ by: ['situacao'], _count: true }),
                    prisma.usuario.groupBy({ by: ['tipo'], _count: true }),
                    prisma.tag.count({ where: { ativa: true } }),
                    prisma.usuario.count({ where: { tipo: 'INSTITUICAO', verificado: false } }),
                    prisma.relato.count({ where: { situacao: 'ABERTO' } }),
                ]);

                const conteudos = Object.fromEntries(SITUACOES.map((s) => [s, 0]));
                porSituacao.forEach((item) => { conteudos[item.situacao] = item._count; });

                const contas = { PESSOA: 0, INSTITUICAO: 0, ADMIN: 0 };
                porTipoConta.forEach((item) => { contas[item.tipo] = item._count; });

                res.status(200).json({ conteudos, contas, tags, aguardando, relatos });
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
                await prisma.$transaction([
                    prisma.conteudo.update({
                        where: { id: atual.id },
                        data: {
                            situacao: 'APROVADO',
                            motivoRecusa: null,
                            moderadoEm: agora,
                            publicadoEm: atual.publicadoEm || agora,
                        },
                    }),
                    registrar(req, atual.id, 'APROVOU'),
                ]);
                res.status(200).json(formatarPainel(await buscarConteudo(atual.id)));
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

                if (atual.situacao === 'RECUSADO') return res.status(400).json("Este conteúdo já está recusado.");

                await prisma.$transaction([
                    prisma.conteudo.update({
                        where: { id: atual.id },
                        data: { situacao: 'RECUSADO', motivoRecusa: motivo, moderadoEm: new Date() },
                    }),
                    registrar(req, atual.id, 'RECUSOU', motivo),
                ]);
                res.status(200).json(formatarPainel(await buscarConteudo(atual.id)));
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

                await prisma.$transaction([
                    prisma.conteudoArea.deleteMany({ where: { conteudoId: atual.id } }),
                    prisma.conteudoTag.deleteMany({ where: { conteudoId: atual.id } }),
                    prisma.conteudo.update({
                        where: { id: atual.id },
                        data: {
                            ...validado.dados,
                            areas: { create: validado.areas.map((areaId) => ({ areaId })) },
                            tags: { create: validado.tags.map((tagId) => ({ tagId })) },
                        },
                    }),
                    registrar(req, atual.id, 'EDITOU'),
                ]);
                res.status(200).json(formatarPainel(await buscarConteudo(atual.id)));
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Pedir correção: sai do catálogo até a instituição corrigir e enviar de novo
        pedirCorrecao: mudarSituacao('correcao'),

        // Ocultar: some do site para todo mundo (nem como histórico)
        ocultar: mudarSituacao('ocultar'),

        // Arquivar: sai do catálogo; se já foi publicado, a página fica como histórico
        arquivar: mudarSituacao('arquivar'),

        // Excluir de vez (áreas, tags e histórico do conteúdo são apagados junto)
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

                // Não deixa criar tag repetida, nem com outras maiúsculas/minúsculas (ex.: "robótica" e "Robótica")
                const existe = await prisma.tag.findFirst({ where: { nome: { equals: nome, mode: "insensitive" } } });
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
                    const outra = await prisma.tag.findFirst({ where: { nome: { equals: nome, mode: "insensitive" } } });
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

        // Juntar duas tags repetidas (ex.: "Robótica" e "Robotica"): tudo que usava a tag de origem
        // passa a usar a tag de destino, e a de origem é apagada (CU16).
        async juntarTag(req, res) {
            try {
                const origemId = Number(req.params.id);
                const destinoId = Number(req.body.destinoId);
                if (!Number.isInteger(origemId) || !Number.isInteger(destinoId)) return res.status(400).json("Escolha as duas tags.");
                if (origemId === destinoId) return res.status(400).json("Escolha uma tag diferente para juntar.");

                const [origem, destino] = await Promise.all([
                    prisma.tag.findUnique({ where: { id: origemId } }),
                    prisma.tag.findUnique({ where: { id: destinoId } }),
                ]);
                if (!origem || !destino) return res.status(404).json("Tag não encontrada.");
                if (!destino.ativa) return res.status(400).json("A tag que vai ficar precisa estar ativa.");

                await prisma.$transaction(async (tx) => {
                    const conteudos = await tx.conteudoTag.findMany({ where: { tagId: origemId }, select: { conteudoId: true } });
                    const pessoas = await tx.interesseTag.findMany({ where: { tagId: origemId }, select: { usuarioId: true } });
                    // skipDuplicates: se o conteúdo ou a pessoa já tinha as duas tags, fica só uma
                    await tx.conteudoTag.createMany({ data: conteudos.map(({ conteudoId }) => ({ conteudoId, tagId: destinoId })), skipDuplicates: true });
                    await tx.interesseTag.createMany({ data: pessoas.map(({ usuarioId }) => ({ usuarioId, tagId: destinoId })), skipDuplicates: true });
                    // Apagar a tag de origem apaga junto os vínculos antigos dela
                    await tx.tag.delete({ where: { id: origemId } });
                });

                res.status(200).json(`#${origem.nome} foi juntada com #${destino.nome}.`);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // ---------- Áreas do conhecimento (CU16) ----------

        // Todas as áreas, com quantos conteúdos e pessoas usam cada uma
        async listarAreas(req, res) {
            try {
                const areas = await prisma.area.findMany({
                    orderBy: { nome: 'asc' },
                    include: { _count: { select: { conteudos: true, interesses: true } } },
                });
                res.status(200).json(areas.map((area) => ({
                    id: area.id,
                    nome: area.nome,
                    conteudos: area._count.conteudos,
                    pessoas: area._count.interesses,
                })));
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        async criarArea(req, res) {
            try {
                const nome = texto(req.body.nome);
                if (nome.length < 2 || nome.length > 60) return res.status(400).json("O nome da área precisa ter entre 2 e 60 caracteres.");

                const existe = await prisma.area.findFirst({ where: { nome: { equals: nome, mode: "insensitive" } } });
                if (existe) return res.status(409).json("Já existe uma área com esse nome.");

                const area = await prisma.area.create({ data: { nome } });
                res.status(201).json(area);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        async editarArea(req, res) {
            try {
                const id = Number(req.params.id);
                const atual = Number.isInteger(id) ? await prisma.area.findUnique({ where: { id } }) : null;
                if (!atual) return res.status(404).json("Área não encontrada.");

                const nome = texto(req.body.nome);
                if (nome.length < 2 || nome.length > 60) return res.status(400).json("O nome da área precisa ter entre 2 e 60 caracteres.");
                const outra = await prisma.area.findFirst({ where: { nome: { equals: nome, mode: "insensitive" } } });
                if (outra && outra.id !== id) return res.status(409).json("Já existe uma área com esse nome.");

                const area = await prisma.area.update({ where: { id }, data: { nome } });
                res.status(200).json(area);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Só dá para excluir área que ninguém usa. Se estiver em uso, o certo é juntar com outra.
        async excluirArea(req, res) {
            try {
                const id = Number(req.params.id);
                const area = Number.isInteger(id)
                    ? await prisma.area.findUnique({ where: { id }, include: { _count: { select: { conteudos: true, interesses: true } } } })
                    : null;
                if (!area) return res.status(404).json("Área não encontrada.");

                if (area._count.conteudos > 0 || area._count.interesses > 0) {
                    return res.status(409).json("Esta área está em uso. Junte com outra área em vez de excluir.");
                }

                await prisma.area.delete({ where: { id } });
                res.status(200).json("Área excluída.");
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Juntar duas áreas: conteúdos e pessoas da área de origem passam para a de destino
        async juntarArea(req, res) {
            try {
                const origemId = Number(req.params.id);
                const destinoId = Number(req.body.destinoId);
                if (!Number.isInteger(origemId) || !Number.isInteger(destinoId)) return res.status(400).json("Escolha as duas áreas.");
                if (origemId === destinoId) return res.status(400).json("Escolha uma área diferente para juntar.");

                const [origem, destino] = await Promise.all([
                    prisma.area.findUnique({ where: { id: origemId } }),
                    prisma.area.findUnique({ where: { id: destinoId } }),
                ]);
                if (!origem || !destino) return res.status(404).json("Área não encontrada.");

                await prisma.$transaction(async (tx) => {
                    const conteudos = await tx.conteudoArea.findMany({ where: { areaId: origemId }, select: { conteudoId: true } });
                    const pessoas = await tx.interesse.findMany({ where: { areaId: origemId }, select: { usuarioId: true } });
                    await tx.conteudoArea.createMany({ data: conteudos.map(({ conteudoId }) => ({ conteudoId, areaId: destinoId })), skipDuplicates: true });
                    await tx.interesse.createMany({ data: pessoas.map(({ usuarioId }) => ({ usuarioId, areaId: destinoId })), skipDuplicates: true });
                    await tx.area.delete({ where: { id: origemId } });
                });

                res.status(200).json(`${origem.nome} foi juntada com ${destino.nome}.`);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // ---------- Usuários e instituições (CU15) ----------

        // Lista de contas. Filtros: busca (nome ou e-mail), tipo e situacao (ativos, bloqueados, aguardando)
        async listarUsuarios(req, res) {
            try {
                const busca = texto(req.query.busca);
                const { tipo, situacao } = req.query;
                if (tipo && !TIPOS_CONTA.includes(tipo)) return res.status(400).json("Tipo de conta inválido.");

                const filtros = {};
                if (tipo) filtros.tipo = tipo;
                if (situacao === 'ativos') filtros.bloqueado = false;
                else if (situacao === 'bloqueados') filtros.bloqueado = true;
                else if (situacao === 'aguardando') { filtros.tipo = 'INSTITUICAO'; filtros.verificado = false; }
                else if (situacao) return res.status(400).json("Situação inválida.");

                if (busca) {
                    filtros.OR = [
                        { nome: { contains: busca, mode: 'insensitive' } },
                        { email: { contains: busca, mode: 'insensitive' } },
                    ];
                }

                const usuarios = await prisma.usuario.findMany({
                    where: filtros,
                    select: CAMPOS_USUARIO,
                    orderBy: { criadoEm: 'desc' },
                    take: 200,
                });
                res.status(200).json(usuarios.map(formatarUsuario));
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Mudar nome, e-mail, tipo, bloqueio ou verificação de uma conta
        async editarUsuario(req, res) {
            try {
                const id = Number(req.params.id);
                const usuario = Number.isInteger(id) ? await prisma.usuario.findUnique({ where: { id } }) : null;
                if (!usuario) return res.status(404).json("Conta não encontrada.");

                const ehVoceMesmo = id === req.user.id;
                const { tipo, bloqueado, verificado } = req.body;
                const dados = {};

                if (req.body.nome !== undefined) {
                    const nome = texto(req.body.nome);
                    if (nome.length < 2 || nome.length > 120) return res.status(400).json("O nome precisa ter de 2 a 120 caracteres.");
                    dados.nome = nome;
                }

                if (req.body.email !== undefined) {
                    const email = texto(req.body.email).toLowerCase();
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json("E-mail inválido.");
                    const outra = await prisma.usuario.findUnique({ where: { email } });
                    if (outra && outra.id !== id) return res.status(409).json("Já existe outra conta com este e-mail.");
                    dados.email = email;
                }

                if (tipo !== undefined) {
                    if (!TIPOS_CONTA.includes(tipo)) return res.status(400).json("Tipo de conta inválido.");
                    if (ehVoceMesmo && tipo !== 'ADMIN') return res.status(400).json("Você não pode tirar o seu próprio acesso de administrador.");
                    dados.tipo = tipo;
                }

                if (bloqueado !== undefined) {
                    if (typeof bloqueado !== 'boolean') return res.status(400).json("Valor de bloqueio inválido.");
                    if (ehVoceMesmo && bloqueado) return res.status(400).json("Você não pode bloquear a sua própria conta.");
                    dados.bloqueado = bloqueado;
                }

                if (verificado !== undefined) {
                    if (typeof verificado !== 'boolean') return res.status(400).json("Valor de verificação inválido.");
                    dados.verificado = verificado;
                }

                if (Object.keys(dados).length === 0) return res.status(400).json("Nada para mudar.");

                const atualizado = await prisma.usuario.update({ where: { id }, data: dados, select: CAMPOS_USUARIO });
                res.status(200).json(formatarUsuario(atualizado));
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Apagar uma conta (e os conteúdos dela, se for instituição)
        async excluirUsuario(req, res) {
            try {
                const id = Number(req.params.id);
                const usuario = Number.isInteger(id) ? await prisma.usuario.findUnique({ where: { id } }) : null;
                if (!usuario) return res.status(404).json("Conta não encontrada.");
                if (id === req.user.id) return res.status(400).json("Você não pode apagar a sua própria conta por aqui.");

                await prisma.$transaction([
                    prisma.conteudo.deleteMany({ where: { instituicaoId: id } }),
                    prisma.usuario.delete({ where: { id } }),
                ]);
                res.status(200).json("Conta apagada.");
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },
    }
}

export default controller;
