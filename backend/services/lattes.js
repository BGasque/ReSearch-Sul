import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';

// Aceita "http://lattes.cnpq.br/1234567890123456" ou só os 16 números.
// Devolve o número do currículo, ou null se o formato estiver errado.
export function extrairIdLattes(valor) {
    const texto = String(valor || '').trim();
    const resultado = texto.match(/^(?:https?:\/\/(?:www\.)?lattes\.cnpq\.br\/)?(\d{16})\/?$/);
    return resultado ? resultado[1] : null;
}

// Tags que podem aparecer várias vezes no XML: sempre viram lista
const LISTAS = [
    'AREA-DE-ATUACAO',
    'ARTIGO-PUBLICADO',
    'TRABALHO-EM-EVENTOS',
    'PARTICIPACAO-EM-CONGRESSO',
    'PARTICIPACAO-EM-SEMINARIO',
    'PARTICIPACAO-EM-SIMPOSIO',
    'PARTICIPACAO-EM-ENCONTRO',
    'PARTICIPACAO-EM-FEIRA',
    'PARTICIPACAO-EM-OFICINA',
    'OUTRAS-PARTICIPACOES-EM-EVENTOS-CONGRESSOS',
];

const LIMITE = 100; // no máximo 100 itens de cada lista

// Grande área no Lattes vem assim: "CIENCIAS_EXATAS_E_DA_TERRA".
// Transforma no nome usado na tabela de áreas: "Ciências Exatas e da Terra".
const NOMES_AREAS = [
    'Ciências Exatas e da Terra',
    'Ciências Biológicas',
    'Engenharias',
    'Ciências da Saúde',
    'Ciências Agrárias',
    'Ciências Sociais Aplicadas',
    'Ciências Humanas',
    'Linguística, Letras e Artes',
];

function codigoArea(nome) {
    return nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]+/g, '_');
}

function nomeGrandeArea(codigo) {
    if (!codigo) return null;
    return NOMES_AREAS.find((nome) => codigoArea(nome) === codigo) || 'Outras';
}

// O Lattes entrega um .zip com o curriculo.xml dentro; também aceitamos o .xml direto
function abrirArquivo(base64) {
    let bytes = Buffer.from(base64, 'base64');

    const ehZip = bytes[0] === 0x50 && bytes[1] === 0x4b; // arquivos .zip começam com "PK"
    if (ehZip) {
        const xml = new AdmZip(bytes).getEntries().find((entrada) => entrada.entryName.toLowerCase().endsWith('.xml'));
        if (!xml) throw new Error('O arquivo .zip não tem nenhum XML dentro.');
        bytes = xml.getData();
    }

    // O XML do Lattes normalmente usa a codificação ISO-8859-1 (por causa dos acentos)
    const inicio = bytes.subarray(0, 200).toString('latin1');
    const utf8 = /encoding=["']utf-8["']/i.test(inicio);
    return bytes.toString(utf8 ? 'utf8' : 'latin1');
}

// Pega o item de dentro que começa com "DADOS-BASICOS" ou "DETALHAMENTO"
function parte(item, prefixo) {
    const chave = Object.keys(item).find((nome) => nome.startsWith(prefixo));
    return chave ? item[chave] : {};
}

function porAno(a, b) {
    return (Number(b.ano) || 0) - (Number(a.ano) || 0);
}

// Lê o arquivo enviado e devolve o número do currículo e os dados públicos que vamos guardar
export function lerXmlLattes(base64) {
    const texto = abrirArquivo(base64);

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
        parseAttributeValue: false,
        isArray: (nome) => LISTAS.includes(nome),
    });

    let curriculo;
    try {
        curriculo = parser.parse(texto)['CURRICULO-VITAE'];
    } catch {
        curriculo = null;
    }

    if (!curriculo) {
        throw new Error('Este arquivo não parece ser um currículo Lattes.');
    }

    const lattesId = extrairIdLattes(curriculo['NUMERO-IDENTIFICADOR']);
    if (!lattesId) {
        throw new Error('Não encontramos o número do currículo dentro do XML.');
    }

    const gerais = curriculo['DADOS-GERAIS'] || {};
    const producao = curriculo['PRODUCAO-BIBLIOGRAFICA'] || {};
    const complementares = curriculo['DADOS-COMPLEMENTARES'] || {};

    // Áreas de atuação
    const areas = (gerais['AREAS-DE-ATUACAO']?.['AREA-DE-ATUACAO'] || []).map((area) => ({
        grandeArea: nomeGrandeArea(area['NOME-GRANDE-AREA-DO-CONHECIMENTO']),
        area: area['NOME-DA-AREA-DO-CONHECIMENTO'] || null,
    }));

    // Artigos publicados em revistas
    const artigos = (producao['ARTIGOS-PUBLICADOS']?.['ARTIGO-PUBLICADO'] || []).map((artigo) => {
        const basico = parte(artigo, 'DADOS-BASICOS');
        const detalhe = parte(artigo, 'DETALHAMENTO');
        return {
            titulo: basico['TITULO-DO-ARTIGO'],
            ano: basico['ANO-DO-ARTIGO'],
            revista: detalhe['TITULO-DO-PERIODICO-OU-REVISTA'] || null,
            doi: basico['DOI'] || null,
        };
    }).sort(porAno).slice(0, LIMITE);

    // Trabalhos apresentados em eventos
    const trabalhosEmEventos = (producao['TRABALHOS-EM-EVENTOS']?.['TRABALHO-EM-EVENTOS'] || []).map((trabalho) => {
        const basico = parte(trabalho, 'DADOS-BASICOS');
        const detalhe = parte(trabalho, 'DETALHAMENTO');
        return {
            titulo: basico['TITULO-DO-TRABALHO'],
            ano: basico['ANO-DO-TRABALHO'],
            evento: detalhe['NOME-DO-EVENTO'] || null,
        };
    }).sort(porAno).slice(0, LIMITE);

    // Participações em eventos (congressos, seminários, feiras...)
    const grupoEventos = complementares['PARTICIPACAO-EM-EVENTOS-CONGRESSOS'] || {};
    const participacoesEmEventos = Object.values(grupoEventos)
        .filter(Array.isArray)
        .flat()
        .map((participacao) => {
            const basico = parte(participacao, 'DADOS-BASICOS');
            const detalhe = parte(participacao, 'DETALHAMENTO');
            return {
                evento: detalhe['NOME-DO-EVENTO'] || basico['TITULO'] || null,
                ano: basico['ANO'],
            };
        }).sort(porAno).slice(0, LIMITE);

    return {
        lattesId,
        dados: {
            nome: gerais['NOME-COMPLETO'] || null,
            atualizadoNoLattes: curriculo['DATA-ATUALIZACAO'] || null,
            areas,
            artigos,
            trabalhosEmEventos,
            participacoesEmEventos,
        },
    };
}
