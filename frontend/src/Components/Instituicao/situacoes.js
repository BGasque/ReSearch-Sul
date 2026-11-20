// Nome e cor de cada situação de um conteúdo, como aparecem para a instituição
export const SITUACOES = {
    PENDENTE: { nome: 'Em análise', cor: 'amarelo', explicacao: 'Esperando o administrador conferir. Ainda não aparece no site.' },
    APROVADO: { nome: 'Publicado', cor: 'verde', explicacao: 'Aprovado e visível no catálogo.' },
    RECUSADO: { nome: 'Recusado', cor: 'coral', explicacao: 'O administrador não aprovou. Edite e envie de novo.' },
    ARQUIVADO: { nome: 'Arquivado', cor: 'cinza', explicacao: 'Fora do catálogo.' },
    CORRECAO: { nome: 'Precisa de correção', cor: 'azul', explicacao: 'O administrador pediu uma correção. Edite e envie de novo.' },
    OCULTO: { nome: 'Oculto', cor: 'cinza', explicacao: 'Escondido pelo administrador. Não aparece para ninguém no site.' },
};

// Como cada decisão do administrador aparece no histórico (RF16)
export const NOMES_ACAO = {
    APROVOU: 'Aprovou',
    RECUSOU: 'Recusou',
    PEDIU_CORRECAO: 'Pediu correção',
    EDITOU: 'Editou',
    OCULTOU: 'Ocultou',
    ARQUIVOU: 'Arquivou',
};
