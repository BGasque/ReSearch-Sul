import prisma from '../services/adapter.js';
import { incluir, formatarConteudo } from './conteudoController.js';

const UM_DIA = 24 * 60 * 60 * 1000;

// Conteúdos que o público pode ver: aprovados, ou arquivados que já foram publicados um dia
const VISIVEL = {
    OR: [
        { situacao: 'APROVADO' },
        { situacao: 'ARQUIVADO', publicadoEm: { not: null } },
    ],
};

// Lê o número do conteúdo na URL (ex.: /favoritos/7)
function idDaUrl(req) {
    const id = Number(req.params.id);
    return Number.isInteger(id) && id > 0 ? id : null;
}

// Favoritos: eventos e publicações que o usuário salvou com a estrelinha
function controller() {
    return {
        // Lista os favoritos do usuário, do salvo mais recente para o mais antigo
        async listar(req, res) {
            try {
                const favoritos = await prisma.favorito.findMany({
                    where: { usuarioId: Number(req.user.id), conteudo: VISIVEL },
                    include: { conteudo: { include: incluir } },
                    orderBy: { criadoEm: 'desc' },
                });

                const hoje = new Date();
                const lista = favoritos.map(({ conteudo, criadoEm }) => {
                    const formatado = formatarConteudo(conteudo, hoje);
                    // O prazo vale até o fim do dia; depois disso as inscrições fecham
                    const prazoPassou = conteudo.prazo !== null && conteudo.prazo.getTime() + UM_DIA <= hoje.getTime();
                    return {
                        ...formatado,
                        salvoEm: criadoEm,
                        // Fechado: o evento já aconteceu, o prazo passou ou a instituição retirou do site
                        fechado: formatado.encerrado || prazoPassou || conteudo.situacao === 'ARQUIVADO',
                    };
                });

                // Os abertos primeiro; os fechados vão para o fim
                lista.sort((a, b) => a.fechado - b.fechado);

                res.status(200).json(lista);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Salva um conteúdo nos favoritos (clicar na estrelinha)
        async salvar(req, res) {
            try {
                const conteudoId = idDaUrl(req);
                const conteudo = conteudoId && await prisma.conteudo.findFirst({ where: { id: conteudoId, situacao: 'APROVADO' } });
                if (!conteudo) return res.status(404).json("Conteúdo não encontrado.");

                const usuarioId = Number(req.user.id);
                await prisma.favorito.upsert({
                    where: { usuarioId_conteudoId: { usuarioId, conteudoId } },
                    create: { usuarioId, conteudoId },
                    update: {},
                });
                res.status(201).json("Salvo nos favoritos.");
            } catch (error) {
                // A conta não existe mais (token antigo de uma conta apagada)
                if (error.code === 'P2003') return res.status(404).json("Usuário não encontrado.");
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Tira um conteúdo dos favoritos (clicar de novo na estrelinha)
        async remover(req, res) {
            try {
                const conteudoId = idDaUrl(req);
                if (!conteudoId) return res.status(404).json("Conteúdo não encontrado.");

                await prisma.favorito.deleteMany({ where: { usuarioId: Number(req.user.id), conteudoId } });
                res.status(200).json("Removido dos favoritos.");
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },
    };
}

export default controller;
