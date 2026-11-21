import prisma from './adapter.js';

// Taxonomia (RF18): áreas, categorias de tags e tags podem ser desativadas pelo administrador.
// O que está desativado some das escolhas (filtros, interesses, cadastro), mas os vínculos antigos continuam.

// Nomes das categorias ativas (ex.: "Tema", "Formato")
export async function categoriasAtivas() {
    const categorias = await prisma.categoria.findMany({ where: { ativa: true }, select: { nome: true } });
    return categorias.map((categoria) => categoria.nome);
}

// Filtro do Prisma para "tag que pode ser escolhida": ativa e de uma categoria ativa
export async function filtroTagsAtivas() {
    return { ativa: true, grupo: { in: await categoriasAtivas() } };
}
