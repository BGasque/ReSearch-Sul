import prisma from '../services/adapter.js';

// O que buscar junto com cada conteúdo do catálogo
const incluir = {
    instituicao: { select: { id: true, nome: true } },
    areas: { include: { area: true } },
    tags: { include: { tag: true } },
};

// Um evento terminou quando a data de fim (ou de início, se não tiver fim) já passou
function estaEncerrado(conteudo, hoje) {
    const fim = conteudo.dataFim || conteudo.dataInicio;
    return conteudo.tipo === 'EVENTO' && fim !== null && fim < hoje;
}

// Deixa o conteúdo no formato que o front-end usa
function formatarConteudo(conteudo, hoje) {
    return {
        id: conteudo.id,
        tipo: conteudo.tipo,
        titulo: conteudo.titulo,
        descricao: conteudo.descricao,
        estado: conteudo.estado,
        local: conteudo.local,
        autoria: conteudo.autoria,
        dataInicio: conteudo.dataInicio,
        dataFim: conteudo.dataFim,
        prazo: conteudo.prazo,
        linkOficial: conteudo.linkOficial,
        instituicao: conteudo.instituicao.nome,
        instituicaoId: conteudo.instituicao.id,
        areas: conteudo.areas.map((item) => item.area.nome),
        tags: conteudo.tags.map((item) => item.tag.nome),
        encerrado: estaEncerrado(conteudo, hoje),
    };
}

// Lista de ids vinda da URL, como "3,7,12". Devolve null se tiver algo que não é número.
function listaDeIds(valor) {
    if (!valor) return [];
    if (typeof valor !== 'string' || !/^\d+(,\d+)*$/.test(valor)) return null;
    return [...new Set(valor.split(',').map(Number))];
}

function controller() {
    return {
        get prisma() {
            return prisma;
        },

        // Lista de áreas, usada no filtro
        async listarAreas(req, res) {
            try {
                const areas = await prisma.area.findMany({ orderBy: { nome: 'asc' } });
                res.status(200).json(areas);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Lista de tags ativas, usada no filtro, no perfil e no formulário
        async listarTags(req, res) {
            try {
                const tags = await prisma.tag.findMany({
                    where: { ativa: true },
                    orderBy: [{ grupo: 'asc' }, { nome: 'asc' }],
                    select: { id: true, nome: true, grupo: true },
                });
                res.status(200).json(tags);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Instituições que têm pelo menos um conteúdo publicado (para o filtro)
        async listarInstituicoes(req, res) {
            try {
                const instituicoes = await prisma.usuario.findMany({
                    where: { tipo: 'INSTITUICAO', conteudos: { some: { situacao: 'APROVADO' } } },
                    orderBy: { nome: 'asc' },
                    select: { id: true, nome: true },
                });
                res.status(200).json(instituicoes);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Catálogo público: só conteúdos aprovados, com busca e filtros
        async listarConteudos(req, res) {
            try {
                const { tipo, estado, areaId, instituicaoId, esconderEncerrados } = req.query;
                const busca = typeof req.query.busca === 'string' ? req.query.busca.trim() : '';
                const tags = listaDeIds(req.query.tags);

                // Confere os filtros antes de ir ao banco
                if (tipo && !['EVENTO', 'PUBLICACAO'].includes(tipo)) {
                    return res.status(400).json("Tipo inválido. Use EVENTO ou PUBLICACAO.");
                }
                if (estado && !['PR', 'SC', 'RS'].includes(estado)) {
                    return res.status(400).json("Estado inválido. Use PR, SC ou RS.");
                }
                if (areaId && !/^\d+$/.test(areaId)) {
                    return res.status(400).json("Área inválida.");
                }
                if (instituicaoId && !/^\d+$/.test(instituicaoId)) {
                    return res.status(400).json("Instituição inválida.");
                }
                if (tags === null) {
                    return res.status(400).json("Tags inválidas.");
                }

                const filtros = { situacao: 'APROVADO' };

                if (tipo) filtros.tipo = tipo;
                if (estado) filtros.estado = estado;
                if (areaId) filtros.areas = { some: { areaId: parseInt(areaId) } };
                if (instituicaoId) filtros.instituicaoId = parseInt(instituicaoId);

                // Tags escolhidas na busca: basta ter UMA delas (não precisam ser as do perfil)
                if (tags.length > 0) filtros.tags = { some: { tagId: { in: tags } } };

                // Busca pela palavra no nome do evento ou publicação, na descrição, na autoria,
                // no local, no nome da instituição ou no nome de uma tag
                if (busca) {
                    filtros.OR = [
                        { titulo: { contains: busca } },
                        { descricao: { contains: busca } },
                        { autoria: { contains: busca } },
                        { local: { contains: busca } },
                        { instituicao: { nome: { contains: busca } } },
                        { tags: { some: { tag: { nome: { contains: busca } } } } },
                    ];
                }

                const encontrados = await prisma.conteudo.findMany({ where: filtros, include: incluir });

                const hoje = new Date();
                let lista = encontrados.map((conteudo) => formatarConteudo(conteudo, hoje));

                if (esconderEncerrados === 'sim') {
                    lista = lista.filter((conteudo) => !conteudo.encerrado);
                }

                // Os encerrados vão para o fim da lista; o resto fica em ordem de data
                const data = (conteudo) => new Date(conteudo.prazo || conteudo.dataInicio || '9999-12-31');
                lista.sort((a, b) => a.encerrado - b.encerrado || data(a) - data(b));

                res.status(200).json(lista);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Recomendações: compara os interesses do usuário (tags, áreas e estados)
        // com os conteúdos aprovados que ainda não terminaram.
        // Pontos: cada tag em comum vale 3, cada área em comum vale 2 e o estado vale 1.
        async recomendar(req, res) {
            try {
                const { id } = req.user;

                const [interesses, tagsUsuario, estadosUsuario] = await Promise.all([
                    prisma.interesse.findMany({ where: { usuarioId: id }, include: { area: true } }),
                    prisma.interesseTag.findMany({ where: { usuarioId: id }, include: { tag: true } }),
                    prisma.interesseEstado.findMany({ where: { usuarioId: id } }),
                ]);
                const areasInteresse = interesses.map((item) => item.area.nome);
                const tagsInteresse = tagsUsuario.map((item) => item.tag.nome);
                const estados = estadosUsuario.map((item) => item.estado);

                const encontrados = await prisma.conteudo.findMany({ where: { situacao: 'APROVADO' }, include: incluir });

                const hoje = new Date();
                const abertos = encontrados
                    .map((conteudo) => formatarConteudo(conteudo, hoje))
                    .filter((conteudo) => !conteudo.encerrado);

                // Sem tags e sem áreas escolhidas: mostra os conteúdos abertos sem personalizar
                if (areasInteresse.length === 0 && tagsInteresse.length === 0) {
                    return res.status(200).json({ temInteresses: false, conteudos: abertos.slice(0, 6) });
                }

                const recomendados = abertos
                    .map((conteudo) => {
                        const tagsEmComum = conteudo.tags.filter((tag) => tagsInteresse.includes(tag));
                        const areasEmComum = conteudo.areas.filter((area) => areasInteresse.includes(area));
                        const estadoCombina = estados.length === 0 || estados.includes(conteudo.estado);

                        // Os motivos aparecem na tela: "Você segue #Robótica", "Você segue Engenharias"
                        const motivos = [
                            ...tagsEmComum.map((tag) => `Você segue #${tag}`),
                            ...areasEmComum.map((area) => `Você segue ${area}`),
                        ];
                        if (estados.length > 0 && estadoCombina) motivos.push(`É no estado ${conteudo.estado}`);

                        return {
                            ...conteudo,
                            tagsEmComum,
                            pontos: tagsEmComum.length * 3 + areasEmComum.length * 2 + (estados.length > 0 && estadoCombina ? 1 : 0),
                            motivos,
                            combina: tagsEmComum.length > 0 || areasEmComum.length > 0,
                            estadoCombina,
                        };
                    })
                    // Precisa ter pelo menos uma tag ou área em comum e estar num estado escolhido
                    .filter((conteudo) => conteudo.combina && conteudo.estadoCombina)
                    .sort((a, b) => b.pontos - a.pontos);

                res.status(200).json({ temInteresses: true, conteudos: recomendados });
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Detalhes de um conteúdo. Aprovados podem ser vistos, e arquivados também,
        // desde que já tenham sido publicados antes. Pendentes e recusados não aparecem para o público.
        async verConteudo(req, res) {
            try {
                const id = parseInt(req.params.id);

                const conteudo = Number.isNaN(id) ? null : await prisma.conteudo.findFirst({
                    where: {
                        id,
                        OR: [
                            { situacao: 'APROVADO' },
                            { situacao: 'ARQUIVADO', publicadoEm: { not: null } },
                        ],
                    },
                    include: incluir,
                });

                if (!conteudo) {
                    return res.status(404).json("Este conteúdo não está disponível.");
                }

                res.status(200).json({
                    ...formatarConteudo(conteudo, new Date()),
                    arquivado: conteudo.situacao === 'ARQUIVADO',
                    atualizadoEm: conteudo.atualizadoEm,
                });
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        }
    }
}

export default controller;
