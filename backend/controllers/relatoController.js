import prisma from '../services/adapter.js';

// Comunicação de problema (RF17): qualquer pessoa logada avisa o administrador
// sobre informação errada, link quebrado, conteúdo duplicado ou fora do tema.

const MOTIVOS = ['INFORMACAO_ERRADA', 'LINK_QUEBRADO', 'DUPLICADO', 'FORA_DO_TEMA', 'OUTRO'];
const SITUACOES = ['ABERTO', 'RESOLVIDO', 'DESCARTADO'];

// Só dá para relatar o que o público consegue ver
const VISIVEL = {
    OR: [
        { situacao: 'APROVADO' },
        { situacao: 'ARQUIVADO', publicadoEm: { not: null } },
    ],
};

function idDaUrl(req) {
    const id = Number(req.params.id);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function formatarRelato(relato) {
    return {
        id: relato.id,
        motivo: relato.motivo,
        detalhe: relato.detalhe,
        situacao: relato.situacao,
        criadoEm: relato.criadoEm,
        resolvidoEm: relato.resolvidoEm,
        resolvidoPor: relato.resolvidoPor,
        conteudo: {
            id: relato.conteudo.id,
            titulo: relato.conteudo.titulo,
            tipo: relato.conteudo.tipo,
            situacao: relato.conteudo.situacao,
            publicado: relato.conteudo.publicadoEm !== null,
            instituicao: relato.conteudo.instituicao.nome,
        },
        usuario: { nome: relato.usuario.nome, email: relato.usuario.email },
    };
}

const incluirRelato = {
    conteudo: { select: { id: true, titulo: true, tipo: true, situacao: true, publicadoEm: true, instituicao: { select: { nome: true } } } },
    usuario: { select: { nome: true, email: true } },
};

function controller() {
    return {
        // Usuário logado comunica um problema num conteúdo
        async relatar(req, res) {
            try {
                const conteudoId = idDaUrl(req);
                const conteudo = conteudoId && await prisma.conteudo.findFirst({ where: { id: conteudoId, ...VISIVEL } });
                if (!conteudo) return res.status(404).json("Conteúdo não encontrado.");

                const motivo = req.body?.motivo;
                if (!MOTIVOS.includes(motivo)) return res.status(400).json("Escolha o motivo do problema.");

                const detalhe = typeof req.body?.detalhe === 'string' ? req.body.detalhe.trim() : '';
                if (detalhe.length > 1000) return res.status(400).json("O detalhe pode ter no máximo 1000 caracteres.");
                if (motivo === 'OUTRO' && detalhe.length < 10) return res.status(400).json("Conte qual é o problema (pelo menos 10 caracteres).");

                // Um relato aberto por pessoa em cada conteúdo (evita mandar repetido)
                const jaTem = await prisma.relato.findFirst({ where: { conteudoId, usuarioId: req.user.id, situacao: 'ABERTO' } });
                if (jaTem) return res.status(409).json("Você já comunicou um problema neste conteúdo. O administrador vai analisar.");

                await prisma.relato.create({ data: { conteudoId, usuarioId: req.user.id, motivo, detalhe: detalhe || null } });
                res.status(201).json("Obrigado! O administrador vai analisar o problema.");
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Administrador: lista de relatos (abertos por padrão)
        async listar(req, res) {
            try {
                const situacao = req.query.situacao || 'ABERTO';
                if (situacao !== 'TODOS' && !SITUACOES.includes(situacao)) return res.status(400).json("Situação inválida.");

                const relatos = await prisma.relato.findMany({
                    where: situacao === 'TODOS' ? {} : { situacao },
                    include: incluirRelato,
                    orderBy: { criadoEm: situacao === 'ABERTO' ? 'asc' : 'desc' },
                });
                res.status(200).json(relatos.map(formatarRelato));
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Administrador marca como resolvido, descartado ou abre de novo
        async tratar(req, res) {
            try {
                const id = idDaUrl(req);
                const relato = id && await prisma.relato.findUnique({ where: { id } });
                if (!relato) return res.status(404).json("Relato não encontrado.");

                const situacao = req.body?.situacao;
                if (!SITUACOES.includes(situacao)) return res.status(400).json("Situação inválida.");
                if (relato.situacao === situacao) return res.status(400).json("O relato já está nessa situação.");

                const aberto = situacao === 'ABERTO';
                const atualizado = await prisma.relato.update({
                    where: { id },
                    data: {
                        situacao,
                        resolvidoEm: aberto ? null : new Date(),
                        resolvidoPor: aberto ? null : req.user.nome,
                    },
                    include: incluirRelato,
                });
                res.status(200).json(formatarRelato(atualizado));
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },
    };
}

export default controller;
