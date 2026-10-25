import prisma from '../services/adapter.js';

const ESTADOS = ['PR', 'SC', 'RS'];
const MAX_TAGS = 15;

// Transforma a lista recebida em ids numéricos (ou null se tiver algo estranho)
function ids(lista) {
    if (!Array.isArray(lista)) return [];
    const numeros = lista.map(Number);
    return numeros.some((id) => !Number.isInteger(id)) ? null : [...new Set(numeros)];
}

// Interesses do usuário: tags, áreas e estados usados nas recomendações
function controller() {
    return {
        get prisma() {
            return prisma;
        },

        async verInteresses(req, res) {
            try {
                const { id } = req.user;

                const [areas, tags, estados] = await Promise.all([
                    prisma.interesse.findMany({ where: { usuarioId: id } }),
                    prisma.interesseTag.findMany({ where: { usuarioId: id } }),
                    prisma.interesseEstado.findMany({ where: { usuarioId: id } }),
                ]);

                res.status(200).json({
                    areas: areas.map((item) => item.areaId),
                    tags: tags.map((item) => item.tagId),
                    estados: estados.map((item) => item.estado)
                });
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Troca todos os interesses do usuário pelos que foram enviados
        async salvarInteresses(req, res) {
            try {
                const { id, tipo } = req.user;

                if (tipo !== 'PESSOA') {
                    return res.status(403).json("Só contas de estudante ou pesquisador escolhem interesses.");
                }

                const areas = ids(req.body.areas);
                const tags = ids(req.body.tags);
                const estados = Array.isArray(req.body.estados) ? [...new Set(req.body.estados)] : [];

                if (areas === null) return res.status(400).json("Alguma área escolhida não existe.");
                if (tags === null) return res.status(400).json("Alguma tag escolhida não existe.");
                if (tags.length > MAX_TAGS) return res.status(400).json(`Escolha no máximo ${MAX_TAGS} tags.`);
                if (estados.some((estado) => !ESTADOS.includes(estado))) {
                    return res.status(400).json("Escolha apenas PR, SC ou RS.");
                }

                // Confere se as áreas e as tags existem
                const [areasExistentes, tagsExistentes] = await Promise.all([
                    prisma.area.count({ where: { id: { in: areas } } }),
                    prisma.tag.count({ where: { id: { in: tags }, ativa: true } }),
                ]);
                if (areasExistentes !== areas.length) return res.status(400).json("Alguma área escolhida não existe.");
                if (tagsExistentes !== tags.length) return res.status(400).json("Alguma tag escolhida não existe.");

                // Apaga os interesses antigos e grava os novos de uma vez só
                await prisma.$transaction([
                    prisma.interesse.deleteMany({ where: { usuarioId: id } }),
                    prisma.interesseTag.deleteMany({ where: { usuarioId: id } }),
                    prisma.interesseEstado.deleteMany({ where: { usuarioId: id } }),
                    prisma.interesse.createMany({ data: areas.map((areaId) => ({ usuarioId: id, areaId })) }),
                    prisma.interesseTag.createMany({ data: tags.map((tagId) => ({ usuarioId: id, tagId })) }),
                    prisma.interesseEstado.createMany({ data: estados.map((estado) => ({ usuarioId: id, estado })) }),
                ]);

                res.status(200).json("Interesses salvos.");
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        }
    }
}

export default controller;
