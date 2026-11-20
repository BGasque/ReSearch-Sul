// Formato dos conteúdos nas áreas da instituição e do administrador
// (mostra tudo, inclusive a situação e o motivo da recusa).

// O que buscar junto com o conteúdo
export const incluirPainel = {
    areas: { include: { area: true } },
    tags: { include: { tag: true } },
    instituicao: { select: { id: true, nome: true, email: true } },
    // Histórico da moderação, do mais novo para o mais antigo (RF16)
    decisoes: { orderBy: { criadoEm: 'desc' } },
};

export function formatarPainel(conteudo) {
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
        acesso: conteudo.acesso,
        modalidade: conteudo.modalidade,
        publicoAlvo: conteudo.publicoAlvo,
        tipoPublicacao: conteudo.tipoPublicacao,
        ano: conteudo.ano,
        doi: conteudo.doi,
        issn: conteudo.issn,
        situacao: conteudo.situacao,
        publicado: conteudo.publicadoEm !== null, // já foi aprovado alguma vez
        motivoRecusa: conteudo.motivoRecusa,
        moderadoEm: conteudo.moderadoEm,
        instituicao: conteudo.instituicao ? { id: conteudo.instituicao.id, nome: conteudo.instituicao.nome, email: conteudo.instituicao.email } : null,
        areas: conteudo.areas.map((item) => ({ id: item.area.id, nome: item.area.nome })),
        tags: conteudo.tags.map((item) => ({ id: item.tag.id, nome: item.tag.nome })),
        criadoEm: conteudo.criadoEm,
        atualizadoEm: conteudo.atualizadoEm,
        historico: (conteudo.decisoes || []).map((decisao) => ({
            id: decisao.id,
            acao: decisao.acao,
            motivo: decisao.motivo,
            admin: decisao.adminNome,
            criadoEm: decisao.criadoEm,
        })),
    };
}

// Para a instituição: o mesmo formato, mas sem o nome de qual administrador decidiu
export function formatarParaInstituicao(conteudo) {
    const formatado = formatarPainel(conteudo);
    return { ...formatado, historico: formatado.historico.map(({ admin, ...resto }) => resto) };
}
