// Funções para saber quem está logado (o token fica guardado no navegador)

export function pegarToken() {
    return localStorage.getItem('token');
}

// Cabeçalho que vai junto nas requisições que precisam de login
export function cabecalhoAuth() {
    return { headers: { Authorization: `Bearer ${pegarToken()}` } };
}

// Lê as informações de dentro do token (id, nome e tipo de conta).
// Serve só para decidir o que mostrar na tela: quem protege de verdade é o servidor.
export function usuarioLogado() {
    const token = pegarToken();
    if (!token) return null;

    try {
        const parte = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const texto = decodeURIComponent(
            atob(parte).split('').map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
        );
        return JSON.parse(texto);
    } catch {
        return null;
    }
}

export function sair() {
    localStorage.removeItem('token');
}

// Datas no formato brasileiro (dd/mm/aaaa)
export function formatarData(data) {
    if (!data) return null;
    return new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

// Quantos dias faltam até uma data (negativo se já passou)
export function diasAte(data) {
    if (!data) return null;
    const hoje = new Date();
    const inicioDeHoje = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    return Math.round((new Date(data).getTime() - inicioDeHoje) / 86400000);
}

// Texto do contador: "Hoje", "Falta 1 dia", "Faltam 12 dias"
export function textoContador(dias) {
    if (dias === null || dias < 0) return null;
    if (dias === 0) return 'Termina hoje';
    if (dias === 1) return 'Falta 1 dia';
    return `Faltam ${dias} dias`;
}
