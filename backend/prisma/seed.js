// Dados de exemplo para testar o site: npm run seed
// Pode rodar mais de uma vez: o que já existe não é criado de novo.
import 'dotenv/config';
import bcrypt from 'bcrypt';
import prisma from '../services/adapter.js';

// Grandes áreas do conhecimento (as mesmas usadas pelo CNPq e pelo Lattes)
const areas = [
    'Ciências Exatas e da Terra',
    'Ciências Biológicas',
    'Engenharias',
    'Ciências da Saúde',
    'Ciências Agrárias',
    'Ciências Sociais Aplicadas',
    'Ciências Humanas',
    'Linguística, Letras e Artes',
    'Outras',
];

// Tags: assuntos mais específicos, separados em grupos
const tags = {
    'Eixo': ['Ensino', 'Pesquisa', 'Extensão', 'Inovação'],
    'Nível de ensino': ['Ensino médio', 'Ensino técnico', 'Graduação', 'Pós-graduação', 'Formação de professores'],
    'Formato': ['Congresso', 'Seminário', 'Mostra científica', 'Feira de ciências', 'Oficina', 'Olimpíada científica', 'Hackathon', 'Chamada de artigos', 'Revista científica', 'Curso de extensão'],
    'Tema': [
        'Iniciação científica', 'Divulgação científica', 'Tecnologia', 'Programação', 'Robótica', 'Inteligência artificial',
        'Sustentabilidade', 'Meio ambiente', 'Saúde pública', 'Educação', 'Educação inclusiva', 'Empreendedorismo',
        'Cultura', 'Artes', 'Direitos humanos', 'Mulheres na ciência', 'Agricultura familiar', 'Bolsas e editais',
    ],
};

// Tags de cada conteúdo de exemplo (pelo título)
const tagsDosExemplos = {
    'Mostra de Iniciação Científica do Ensino Médio (exemplo)': ['Mostra científica', 'Iniciação científica', 'Ensino médio', 'Pesquisa', 'Extensão'],
    'Seminário Sul de Computação Aplicada (exemplo)': ['Seminário', 'Tecnologia', 'Programação', 'Inteligência artificial', 'Graduação'],
    'Congresso Regional de Ciências da Saúde (exemplo)': ['Congresso', 'Saúde pública', 'Pós-graduação', 'Pesquisa'],
    'Encontro Online de Extensão Universitária (exemplo)': ['Extensão', 'Seminário', 'Graduação'],
    'Revista Sul de Iniciação Científica (exemplo)': ['Revista científica', 'Iniciação científica', 'Ensino médio', 'Graduação'],
    'Chamada de artigos: Agricultura Sustentável (exemplo)': ['Chamada de artigos', 'Sustentabilidade', 'Agricultura familiar', 'Meio ambiente', 'Pós-graduação'],
    'Escrita científica no ensino médio integrado (exemplo)': ['Revista científica', 'Educação', 'Ensino médio', 'Ensino técnico', 'Divulgação científica'],
};

// Eventos e publicações fictícios, só para testar
const conteudos = [
    {
        tipo: 'EVENTO',
        titulo: 'Mostra de Iniciação Científica do Ensino Médio (exemplo)',
        descricao: 'Mostra para estudantes do ensino médio apresentarem projetos de pesquisa e extensão.',
        estado: 'RS',
        local: 'Rio Grande - RS',
        dataInicio: '2026-11-18',
        dataFim: '2026-11-20',
        prazo: '2026-11-05',
        areas: ['Outras', 'Ciências Humanas'],
    },
    {
        tipo: 'EVENTO',
        titulo: 'Seminário Sul de Computação Aplicada (exemplo)',
        descricao: 'Palestras e apresentação de trabalhos sobre computação e inovação.',
        estado: 'SC',
        local: 'Florianópolis - SC',
        dataInicio: '2027-03-10',
        dataFim: '2027-03-12',
        prazo: '2027-02-20',
        areas: ['Ciências Exatas e da Terra', 'Engenharias'],
    },
    {
        tipo: 'EVENTO',
        titulo: 'Congresso Regional de Ciências da Saúde (exemplo)',
        descricao: 'Congresso com sessões de pôsteres e mesas-redondas. Este evento já terminou.',
        estado: 'PR',
        local: 'Curitiba - PR',
        dataInicio: '2026-08-12',
        dataFim: '2026-08-14',
        prazo: '2026-07-15',
        areas: ['Ciências da Saúde'],
    },
    {
        tipo: 'EVENTO',
        titulo: 'Encontro Online de Extensão Universitária (exemplo)',
        descricao: 'Evento enviado pela instituição e ainda esperando a aprovação do administrador.',
        estado: 'RS',
        local: 'Online',
        dataInicio: '2027-04-22',
        situacao: 'PENDENTE',
        areas: ['Ciências Humanas'],
    },
    {
        tipo: 'PUBLICACAO',
        titulo: 'Revista Sul de Iniciação Científica (exemplo)',
        descricao: 'Revista que publica trabalhos de iniciação científica de estudantes do ensino médio e da graduação.',
        estado: 'RS',
        autoria: 'Instituto Exemplo do Sul',
        areas: ['Outras'],
    },
    {
        tipo: 'PUBLICACAO',
        titulo: 'Chamada de artigos: Agricultura Sustentável (exemplo)',
        descricao: 'Chamada aberta para artigos sobre práticas agrícolas sustentáveis na Região Sul.',
        estado: 'SC',
        autoria: 'Revista Exemplo de Agrárias',
        prazo: '2027-01-31',
        areas: ['Ciências Agrárias', 'Ciências Biológicas'],
    },
    {
        tipo: 'PUBLICACAO',
        titulo: 'Escrita científica no ensino médio integrado (exemplo)',
        descricao: 'Artigo fictício sobre como estudantes de cursos técnicos aprendem a escrever textos científicos.',
        estado: 'PR',
        autoria: 'Autora Exemplo; Autor Exemplo',
        areas: ['Linguística, Letras e Artes', 'Ciências Humanas'],
    },
];

async function criarConta(nome, email, senha, tipo) {
    if (!email || !senha) {
        throw new Error(`Faltam o e-mail ou a senha da conta "${nome}" no .env (variáveis SEED_...)`);
    }

    return prisma.usuario.upsert({
        where: { email },
        update: {},
        create: { nome, email, senha: await bcrypt.hash(senha, 10), tipo },
    });
}

async function main() {
    // Áreas
    for (const nome of areas) {
        await prisma.area.upsert({ where: { nome }, update: {}, create: { nome } });
    }

    // Tags
    for (const [grupo, nomes] of Object.entries(tags)) {
        for (const nome of nomes) {
            await prisma.tag.upsert({ where: { nome }, update: {}, create: { nome, grupo } });
        }
    }

    // Contas de teste
    await criarConta('Administrador', process.env.SEED_ADMIN_EMAIL, process.env.SEED_ADMIN_SENHA, 'ADMIN');
    const instituicao = await criarConta('Instituto Exemplo do Sul', process.env.SEED_INSTITUICAO_EMAIL, process.env.SEED_INSTITUICAO_SENHA, 'INSTITUICAO');

    // Conteúdos (só cria se ainda não houver nenhum)
    if (await prisma.conteudo.count() === 0) {
        for (const [i, item] of conteudos.entries()) {
            const listaAreas = await prisma.area.findMany({ where: { nome: { in: item.areas } } });

            await prisma.conteudo.create({
                data: {
                    tipo: item.tipo,
                    titulo: item.titulo,
                    descricao: item.descricao,
                    estado: item.estado,
                    local: item.local,
                    autoria: item.autoria,
                    dataInicio: item.dataInicio ? new Date(item.dataInicio) : null,
                    dataFim: item.dataFim ? new Date(item.dataFim) : null,
                    prazo: item.prazo ? new Date(item.prazo) : null,
                    linkOficial: `https://example.org/exemplo-${i + 1}`,
                    situacao: item.situacao || 'APROVADO',
                    publicadoEm: item.situacao ? null : new Date(),
                    instituicaoId: instituicao.id,
                    areas: { create: listaAreas.map((area) => ({ areaId: area.id })) },
                },
            });
        }
        console.log(`${conteudos.length} conteúdos criados.`);
    }

    // Liga as tags aos conteúdos de exemplo que ainda não têm tags
    for (const [titulo, nomesTags] of Object.entries(tagsDosExemplos)) {
        const conteudo = await prisma.conteudo.findFirst({ where: { titulo }, include: { tags: true } });
        if (!conteudo || conteudo.tags.length > 0) continue;

        const lista = await prisma.tag.findMany({ where: { nome: { in: nomesTags } } });
        await prisma.conteudoTag.createMany({ data: lista.map((tag) => ({ conteudoId: conteudo.id, tagId: tag.id })) });
    }

    console.log('Dados de exemplo prontos.');
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
