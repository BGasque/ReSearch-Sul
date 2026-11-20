// Nomes que aparecem na tela para os valores guardados no banco

export const MODALIDADES = [
    { valor: 'PRESENCIAL', nome: 'Presencial' },
    { valor: 'ONLINE', nome: 'Online' },
    { valor: 'HIBRIDO', nome: 'Híbrido' },
];

export const TIPOS_PUBLICACAO = [
    { valor: 'REVISTA', nome: 'Revista' },
    { valor: 'EDICAO', nome: 'Edição de revista' },
    { valor: 'CHAMADA', nome: 'Chamada de artigos' },
    { valor: 'ARTIGO', nome: 'Artigo' },
    { valor: 'ANAIS', nome: 'Anais de evento' },
    { valor: 'LIVRO', nome: 'Livro ou capítulo' },
    { valor: 'OUTRA', nome: 'Outra publicação' },
];

// Forma de acesso: o nome muda um pouco entre evento e publicação
export function nomeAcesso(acesso, tipo) {
    if (acesso === 'GRATUITO') return tipo === 'PUBLICACAO' ? 'Acesso aberto (gratuito)' : 'Gratuito';
    if (acesso === 'PAGO') return tipo === 'PUBLICACAO' ? 'Acesso pago' : 'Pago';
    return null;
}

export const nomeModalidade = (valor) => MODALIDADES.find((item) => item.valor === valor)?.nome || null;
export const nomeTipoPublicacao = (valor) => TIPOS_PUBLICACAO.find((item) => item.valor === valor)?.nome || null;
