// Limite de tentativas (RNF05): depois de muitas tentativas erradas seguidas,
// a mesma chave (ex.: e-mail + endereço de quem tenta) espera um tempo antes de tentar de novo.
// Fica guardado na memória do servidor: se ele reiniciar, a contagem recomeça.

const tentativas = new Map(); // chave -> { erros, primeiraEm, bloqueadoAte }

// Cria um limitador: "maximo" erros dentro de "janelaMin" minutos bloqueiam por "esperaMin" minutos
export function criarLimite({ maximo = 5, janelaMin = 15, esperaMin = 15 } = {}) {
    const janela = janelaMin * 60 * 1000;
    const espera = esperaMin * 60 * 1000;

    return {
        // Quantos minutos ainda faltam de bloqueio (0 = pode tentar)
        minutosBloqueado(chave) {
            const registro = tentativas.get(chave);
            if (!registro?.bloqueadoAte) return 0;
            const falta = registro.bloqueadoAte - Date.now();
            if (falta <= 0) {
                tentativas.delete(chave);
                return 0;
            }
            return Math.ceil(falta / 60000);
        },

        // Conta mais um erro; ao chegar no máximo, bloqueia
        errou(chave) {
            const agora = Date.now();
            let registro = tentativas.get(chave);
            if (!registro || agora - registro.primeiraEm > janela) {
                registro = { erros: 0, primeiraEm: agora, bloqueadoAte: null };
            }
            registro.erros += 1;
            if (registro.erros >= maximo) registro.bloqueadoAte = agora + espera;
            tentativas.set(chave, registro);
        },

        // Acertou: zera a contagem
        acertou(chave) {
            tentativas.delete(chave);
        },
    };
}

// Limpa da memória o que já venceu (roda de tempos em tempos)
setInterval(() => {
    const agora = Date.now();
    for (const [chave, registro] of tentativas) {
        const venceu = registro.bloqueadoAte ? registro.bloqueadoAte < agora : agora - registro.primeiraEm > 60 * 60 * 1000;
        if (venceu) tentativas.delete(chave);
    }
}, 10 * 60 * 1000).unref();

// Mensagem padrão de bloqueio
export function textoEspera(minutos) {
    return `Muitas tentativas erradas. Espere ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'} e tente de novo.`;
}
