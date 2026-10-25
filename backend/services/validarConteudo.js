import prisma from './adapter.js';

// Confere os dados de um evento ou publicação enviados pela instituição.
// Devolve { erro } se algo estiver errado, ou { dados } pronto para salvar no banco.

const TIPOS = ['EVENTO', 'PUBLICACAO'];
const ESTADOS = ['PR', 'SC', 'RS'];

// Texto sem espaços nas pontas ('' se não for texto)
function texto(valor) {
    return typeof valor === 'string' ? valor.trim() : '';
}

// Data no formato AAAA-MM-DD (o que o campo de data do navegador envia)
function data(valor) {
    const valorTexto = texto(valor);
    if (!valorTexto) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valorTexto)) return undefined;
    const convertida = new Date(`${valorTexto}T00:00:00.000Z`);
    return Number.isNaN(convertida.getTime()) ? undefined : convertida;
}

// tagsAtuais: tags que o conteúdo já tinha (continuam valendo mesmo se o admin desativou)
export default async function validarConteudo(corpo, tagsAtuais = []) {
    const tipo = texto(corpo.tipo);
    const titulo = texto(corpo.titulo);
    const descricao = texto(corpo.descricao);
    const estado = texto(corpo.estado);
    const local = texto(corpo.local);
    const autoria = texto(corpo.autoria);
    const linkOficial = texto(corpo.linkOficial);

    if (!TIPOS.includes(tipo)) return { erro: "Escolha se é um evento ou uma publicação." };
    if (titulo.length < 5 || titulo.length > 150) return { erro: "O título precisa ter entre 5 e 150 caracteres." };
    if (descricao.length < 20 || descricao.length > 3000) return { erro: "A descrição precisa ter entre 20 e 3000 caracteres." };
    if (!ESTADOS.includes(estado)) return { erro: "Escolha o estado: PR, SC ou RS." };
    if (local.length > 150 || autoria.length > 150) return { erro: "Local e autoria podem ter no máximo 150 caracteres." };

    // O link oficial precisa ser um endereço de site de verdade (RNF10: fonte verificável)
    let urlValida = false;
    try {
        const url = new URL(linkOficial);
        urlValida = ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.');
    } catch {
        urlValida = false;
    }
    if (!urlValida || linkOficial.length > 500) {
        return { erro: "Informe o link oficial completo, começando com https://" };
    }

    const dataInicio = data(corpo.dataInicio);
    const dataFim = data(corpo.dataFim);
    const prazo = data(corpo.prazo);
    if ([dataInicio, dataFim, prazo].includes(undefined)) return { erro: "Alguma data está em um formato inválido." };

    if (tipo === 'EVENTO') {
        if (!dataInicio) return { erro: "Informe a data de início do evento." };
        if (!local) return { erro: "Informe o local do evento (cidade ou \"Online\")." };
        if (dataFim && dataFim < dataInicio) return { erro: "A data de fim não pode ser antes da data de início." };
        if (prazo && prazo > (dataFim || dataInicio)) return { erro: "O prazo de inscrição não pode ser depois do fim do evento." };
    } else if (!autoria) {
        return { erro: "Informe a autoria ou o nome da revista." };
    }

    // Áreas: pelo menos 1 e no máximo 4, e todas precisam existir
    const areas = Array.isArray(corpo.areas) ? [...new Set(corpo.areas.map(Number))] : [];
    if (areas.length < 1 || areas.length > 4 || areas.some((id) => !Number.isInteger(id))) {
        return { erro: "Escolha de 1 a 4 áreas do conhecimento." };
    }
    const existentes = await prisma.area.count({ where: { id: { in: areas } } });
    if (existentes !== areas.length) return { erro: "Alguma área escolhida não existe." };

    // Tags: opcionais, no máximo 8, e todas precisam existir e estar ativas
    const tags = Array.isArray(corpo.tags) ? [...new Set(corpo.tags.map(Number))] : [];
    if (tags.length > 8 || tags.some((id) => !Number.isInteger(id))) {
        return { erro: "Escolha no máximo 8 tags." };
    }
    const tagsExistentes = await prisma.tag.count({
        where: { id: { in: tags }, OR: [{ ativa: true }, { id: { in: tagsAtuais } }] },
    });
    if (tagsExistentes !== tags.length) return { erro: "Alguma tag escolhida não existe." };

    return {
        dados: {
            tipo,
            titulo,
            descricao,
            estado,
            local: local || null,
            autoria: autoria || null,
            linkOficial,
            // Publicações não têm data de início e fim, só prazo
            dataInicio: tipo === 'EVENTO' ? dataInicio : null,
            dataFim: tipo === 'EVENTO' ? dataFim : null,
            prazo,
        },
        areas,
        tags,
    };
}
