// Tabelas do banco, na ordem em que precisam ser criadas
// (primeiro as que não dependem de ninguém, depois as que apontam para elas).
// "tabela" é o nome no PostgreSQL; "comId" diz se tem número automático (id).
export const TABELAS = [
    { modelo: 'usuario', tabela: 'Usuario', comId: true },
    { modelo: 'area', tabela: 'Area', comId: true },
    { modelo: 'categoria', tabela: 'Categoria', comId: true },
    { modelo: 'tag', tabela: 'Tag', comId: true },
    { modelo: 'conteudo', tabela: 'Conteudo', comId: true },
    { modelo: 'conteudoArea', tabela: 'ConteudoArea', comId: false },
    { modelo: 'conteudoTag', tabela: 'ConteudoTag', comId: false },
    { modelo: 'interesse', tabela: 'Interesse', comId: false },
    { modelo: 'interesseEstado', tabela: 'InteresseEstado', comId: false },
    { modelo: 'interesseTipo', tabela: 'InteresseTipo', comId: false },
    { modelo: 'interesseTag', tabela: 'InteresseTag', comId: false },
    { modelo: 'favorito', tabela: 'Favorito', comId: false },
    { modelo: 'decisao', tabela: 'Decisao', comId: true },
    { modelo: 'relato', tabela: 'Relato', comId: true },
];
