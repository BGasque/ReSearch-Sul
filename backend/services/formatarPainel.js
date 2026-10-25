// Formato dos conteúdos nas áreas da instituição e do administrador
// (mostra tudo, inclusive a situação e o motivo da recusa).

// O que buscar junto com o conteúdo
export const incluirPainel = {
    areas: { include: { area: true } },
    tags: { include: { tag: true } },
    instituicao: { select: { id: true, nome: true, email: true } },
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
        situacao: conteudo.situacao,
        publicado: conteudo.publicadoEm !== null, // já foi aprovado alguma vez
        motivoRecusa: conteudo.motivoRecusa,
        moderadoEm: conteudo.moderadoEm,
        instituicao: conteudo.instituicao ? { id: conteudo.instituicao.id, nome: conteudo.instituicao.nome, email: conteudo.instituicao.email } : null,
        areas: conteudo.areas.map((item) => ({ id: item.area.id, nome: item.area.nome })),
        tags: conteudo.tags.map((item) => ({ id: item.tag.id, nome: item.tag.nome })),
        criadoEm: conteudo.criadoEm,
        atualizadoEm: conteudo.atualizadoEm,
    };
}
