import prisma from '../services/adapter.js';
import validarConteudo from '../services/validarConteudo.js';
import { incluirPainel, formatarPainel } from '../services/formatarPainel.js';

// Área da instituição: cadastrar, listar, editar e arquivar os próprios eventos e publicações.
// Tudo que é criado ou editado vai para "PENDENTE" e só aparece no site depois da aprovação do administrador.

// Procura um conteúdo que seja da instituição logada
async function buscarDaInstituicao(idTexto, instituicaoId) {
    const id = Number(idTexto);
    if (!Number.isInteger(id)) return null;
    return prisma.conteudo.findFirst({ where: { id, instituicaoId }, include: incluirPainel });
}

// Já existe outro conteúdo com o mesmo título? (CU11/CU12: sinalizar possível duplicidade)
async function avisoDuplicado(titulo, ignorarId) {
    const igual = await prisma.conteudo.findFirst({
        where: { titulo, ...(ignorarId && { NOT: { id: ignorarId } }) },
    });
    return igual ? "Atenção: já existe um conteúdo com esse mesmo título. O administrador vai conferir se não é repetido." : null;
}

function controller() {
    return {
        get prisma() {
            return prisma;
        },

        // Lista de todos os conteúdos da instituição, em qualquer situação
        async listar(req, res) {
            try {
                const conteudos = await prisma.conteudo.findMany({
                    where: { instituicaoId: req.user.id },
                    include: incluirPainel,
                    orderBy: { atualizadoEm: 'desc' },
                });
                res.status(200).json(conteudos.map(formatarPainel));
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Um conteúdo da instituição (para preencher o formulário de edição)
        async ver(req, res) {
            try {
                const conteudo = await buscarDaInstituicao(req.params.id, req.user.id);
                if (!conteudo) return res.status(404).json("Conteúdo não encontrado na sua instituição.");
                res.status(200).json(formatarPainel(conteudo));
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Cadastrar um evento ou publicação (CU11 e CU12)
        async criar(req, res) {
            try {
                const validado = await validarConteudo(req.body);
                if (validado.erro) return res.status(400).json(validado.erro);

                const aviso = await avisoDuplicado(validado.dados.titulo);

                const conteudo = await prisma.conteudo.create({
                    data: {
                        ...validado.dados,
                        situacao: 'PENDENTE',
                        instituicaoId: req.user.id,
                        areas: { create: validado.areas.map((areaId) => ({ areaId })) },
                        tags: { create: validado.tags.map((tagId) => ({ tagId })) },
                    },
                    include: incluirPainel,
                });

                res.status(201).json({ conteudo: formatarPainel(conteudo), aviso });
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Editar (CU13). A edição volta para "PENDENTE" para o administrador conferir de novo.
        async editar(req, res) {
            try {
                const atual = await buscarDaInstituicao(req.params.id, req.user.id);
                if (!atual) return res.status(404).json("Conteúdo não encontrado na sua instituição.");

                const validado = await validarConteudo(req.body, atual.tags.map((item) => item.tagId));
                if (validado.erro) return res.status(400).json(validado.erro);

                const aviso = await avisoDuplicado(validado.dados.titulo, atual.id);

                // Troca as áreas e tags antigas pelas novas e salva tudo de uma vez.
                // O motivo de uma recusa antiga é apagado, porque o conteúdo foi corrigido e reenviado.
                const [, , conteudo] = await prisma.$transaction([
                    prisma.conteudoArea.deleteMany({ where: { conteudoId: atual.id } }),
                    prisma.conteudoTag.deleteMany({ where: { conteudoId: atual.id } }),
                    prisma.conteudo.update({
                        where: { id: atual.id },
                        data: {
                            ...validado.dados,
                            situacao: 'PENDENTE',
                            motivoRecusa: null,
                            areas: { create: validado.areas.map((areaId) => ({ areaId })) },
                            tags: { create: validado.tags.map((tagId) => ({ tagId })) },
                        },
                        include: incluirPainel,
                    }),
                ]);

                res.status(200).json({ conteudo: formatarPainel(conteudo), aviso });
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Arquivar: tira do catálogo, mas a página continua como histórico (CU13)
        async arquivar(req, res) {
            try {
                const atual = await buscarDaInstituicao(req.params.id, req.user.id);
                if (!atual) return res.status(404).json("Conteúdo não encontrado na sua instituição.");

                if (atual.situacao === 'ARQUIVADO') return res.status(400).json("Este conteúdo já está arquivado.");

                const conteudo = await prisma.conteudo.update({
                    where: { id: atual.id },
                    data: { situacao: 'ARQUIVADO' },
                    include: incluirPainel,
                });
                res.status(200).json({ conteudo: formatarPainel(conteudo) });
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        }
    }
}

export default controller;
