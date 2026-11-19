// Envio de e-mails pelo Brevo (serviço gratuito de e-mail), usando a internet comum (HTTPS).
// Precisa de duas variáveis no .env:
//   BREVO_API_KEY   -> chave criada no painel do Brevo
//   EMAIL_REMETENTE -> e-mail confirmado no Brevo, que aparece como remetente
// Sem elas (no computador, por exemplo), o e-mail não é enviado: o conteúdo aparece no terminal do servidor.
export default async function enviarEmail({ para, nome, assunto, texto, html }) {
    const chave = process.env.BREVO_API_KEY;
    const remetente = process.env.EMAIL_REMETENTE;

    if (!chave || !remetente) {
        console.log(`\n[E-mail não enviado: falta BREVO_API_KEY ou EMAIL_REMETENTE no .env]\nPara: ${para}\nAssunto: ${assunto}\n${texto}\n`);
        return;
    }

    const resposta = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': chave, 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
            sender: { name: 'ReSearch Sul', email: remetente },
            to: [{ email: para, name: nome }],
            subject: assunto,
            textContent: texto,
            htmlContent: html,
        }),
    });

    if (!resposta.ok) {
        throw new Error(`Brevo respondeu ${resposta.status}: ${await resposta.text()}`);
    }
}
