import prisma from './adapter.js';
import { filtroTagsAtivas } from './taxonomia.js';

// Confere os dados de um evento ou publicação enviados pela instituição.
// Devolve { erro } se algo estiver errado, ou { dados } pronto para salvar no banco.

const TIPOS = ['EVENTO', 'PUBLICACAO'];
const ESTADOS = ['PR', 'SC', 'RS'];
const MODALIDADES = ['PRESENCIAL', 'ONLINE', 'HIBRIDO'];
const ACESSOS = ['GRATUITO', 'PAGO'];
const TIPOS_PUBLICACAO = ['REVISTA', 'EDICAO', 'CHAMADA', 'ARTIGO', 'ANAIS', 'LIVRO', 'OUTRA'];

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

// DOI: aceita "10.1590/abc" ou o link "https://doi.org/10.1590/abc" e guarda só "10.1590/abc"
function doiLimpo(valor) {
    const limpo = texto(valor).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '');
    if (!limpo) return null;
    return /^10\.\d{4,9}\/\S{1,200}$/.test(limpo) ? limpo : undefined;
}

// ISSN: 8 caracteres (o último pode ser X), guardado como 1234-567X
function issnLimpo(valor) {
    const limpo = texto(valor).toUpperCase().replace(/^ISSN\s*/, '').replace('-', '');
    if (!limpo) return null;
    return /^\d{7}[\dX]$/.test(limpo) ? `${limpo.slice(0, 4)}-${limpo.slice(4)}` : undefined;
}

// tagsAtuais: tags que o conteúdo já tinha (continuam valendo mesmo se o admin desativou)
// areasAtuais: o mesmo para as áreas
export default async function validarConteudo(corpo, tagsAtuais = [], areasAtuais = []) {
    const tipo = texto(corpo.tipo);
    const titulo = texto(corpo.titulo);
    const descricao = texto(corpo.descricao);
    const estado = texto(corpo.estado);
    const local = texto(corpo.local);
    const autoria = texto(corpo.autoria);
    const linkOficial = texto(corpo.linkOficial);
    const acesso = texto(corpo.acesso);
    const modalidade = texto(corpo.modalidade);
    const publicoAlvo = texto(corpo.publicoAlvo);
    const tipoPublicacao = texto(corpo.tipoPublicacao);

    if (!TIPOS.includes(tipo)) return { erro: "Escolha se é um evento ou uma publicação." };
    if (titulo.length < 5 || titulo.length > 150) return { erro: "O título precisa ter entre 5 e 150 caracteres." };
    if (descricao.length < 20 || descricao.length > 3000) return { erro: "A descrição precisa ter entre 20 e 3000 caracteres." };
    if (!ESTADOS.includes(estado)) return { erro: "Escolha o estado: PR, SC ou RS." };
    if (local.length > 150 || autoria.length > 150) return { erro: "Local e autoria podem ter no máximo 150 caracteres." };
    if (acesso && !ACESSOS.includes(acesso)) return { erro: "Forma de acesso inválida. Use gratuito ou pago." };

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

    // Campos que só existem em publicações
    let ano = null;
    let doi = null;
    let issn = null;

    if (tipo === 'EVENTO') {
        if (!MODALIDADES.includes(modalidade)) return { erro: "Escolha a modalidade do evento: presencial, online ou híbrido." };
        if (publicoAlvo.length > 150) return { erro: "O público-alvo pode ter no máximo 150 caracteres." };
        if (!dataInicio) return { erro: "Informe a data de início do evento." };
        if (!local) return { erro: "Informe o local do evento (cidade ou \"Online\")." };
        if (dataFim && dataFim < dataInicio) return { erro: "A data de fim não pode ser antes da data de início." };
        if (prazo && prazo > (dataFim || dataInicio)) return { erro: "O prazo de inscrição não pode ser depois do fim do evento." };
    } else {
        if (!autoria) return { erro: "Informe a autoria ou o nome da revista." };
        if (!TIPOS_PUBLICACAO.includes(tipoPublicacao)) return { erro: "Escolha o tipo de publicação." };

        const anoTexto = texto(String(corpo.ano ?? ''));
        if (anoTexto) {
            ano = Number(anoTexto);
            const limite = new Date().getUTCFullYear() + 2;
            if (!Number.isInteger(ano) || ano < 1900 || ano > limite) return { erro: `O ano precisa estar entre 1900 e ${limite}.` };
        }

        doi = doiLimpo(corpo.doi);
        if (doi === undefined) return { erro: "DOI inválido. Ele começa com 10. (ex.: 10.1590/abc123)." };
        issn = issnLimpo(corpo.issn);
        if (issn === undefined) return { erro: "ISSN inválido. Use o formato 1234-5678." };
    }

    // Áreas: pelo menos 1 e no máximo 4, e todas precisam existir
    const areas = Array.isArray(corpo.areas) ? [...new Set(corpo.areas.map(Number))] : [];
    if (areas.length < 1 || areas.length > 4 || areas.some((id) => !Number.isInteger(id))) {
        return { erro: "Escolha de 1 a 4 áreas do conhecimento." };
    }
    const existentes = await prisma.area.count({
        where: { id: { in: areas }, OR: [{ ativa: true }, { id: { in: areasAtuais } }] },
    });
    if (existentes !== areas.length) return { erro: "Alguma área escolhida não existe." };

    // Tags: opcionais, no máximo 8, e todas precisam existir e estar ativas
    const tags = Array.isArray(corpo.tags) ? [...new Set(corpo.tags.map(Number))] : [];
    if (tags.length > 8 || tags.some((id) => !Number.isInteger(id))) {
        return { erro: "Escolha no máximo 8 tags." };
    }
    const tagsExistentes = await prisma.tag.count({
        where: { id: { in: tags }, OR: [await filtroTagsAtivas(), { id: { in: tagsAtuais } }] },
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
            acesso: acesso || null,
            // Cada tipo guarda só os seus campos; os do outro tipo ficam vazios
            modalidade: tipo === 'EVENTO' ? modalidade : null,
            publicoAlvo: tipo === 'EVENTO' ? (publicoAlvo || null) : null,
            tipoPublicacao: tipo === 'PUBLICACAO' ? tipoPublicacao : null,
            ano,
            doi,
            issn,
            // Publicações não têm data de início e fim, só prazo
            dataInicio: tipo === 'EVENTO' ? dataInicio : null,
            dataFim: tipo === 'EVENTO' ? dataFim : null,
            prazo,
        },
        areas,
        tags,
    };
}
