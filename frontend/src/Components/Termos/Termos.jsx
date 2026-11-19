import { FileText, ShieldCheck } from "lucide-react";
import Cabecalho from "../Cabecalho/Cabecalho.jsx";
import Rodape from "../Rodape/Rodape.jsx";
import "./Termos.css";

// Data da última mudança nos textos (trocar sempre que mudar algo importante)
const ATUALIZADO_EM = "18/11/2026";

// Contato do encarregado dos dados (LGPD art. 41)
const EMAIL_CONTATO = "2023302463@aluno.riogrande.ifrs.edu.br";

// Página com os Termos de Uso e a Política de Privacidade (LGPD)
const Termos = () => (
    <>
        <Cabecalho/>

        <section className="faixa-topo">
            <div className="container">
                <p className="sobrancelha"><span className="icone-quadrado"><FileText className="icon"/></span>Regras e privacidade</p>
                <h1>Termos de uso e <span className="marca-texto">privacidade</span></h1>
                <p>Como o ReSearch Sul funciona, o que você pode fazer nele e como cuidamos dos seus dados, de acordo com a Lei Geral de Proteção de Dados (LGPD).</p>
            </div>
        </section>

        <main className="termos container">
            <nav className="termos-indice caixa" aria-label="Partes desta página">
                <p className="rotulo">Nesta página</p>
                <a href="#termos">Termos de uso</a>
                <a href="#privacidade">Política de privacidade</a>
                <p className="termos-data">Atualizado em {ATUALIZADO_EM}</p>
            </nav>

            <div className="termos-texto">
                <section id="termos" className="caixa">
                    <p className="sobrancelha"><span className="icone-quadrado"><FileText className="icon"/></span>Parte 1</p>
                    <h2>Termos de uso</h2>

                    <h3>1. O que é o ReSearch Sul</h3>
                    <p>
                        O ReSearch Sul é um site gratuito que reúne eventos e publicações acadêmicas do Paraná,
                        de Santa Catarina e do Rio Grande do Sul. Ele foi feito como Trabalho de Conclusão de Curso
                        do Técnico em Informática para Internet integrado ao Ensino Médio do IFRS, Campus Rio Grande.
                    </p>
                    <p>
                        O site só divulga as oportunidades. As inscrições e os envios de artigos acontecem sempre
                        no site oficial de cada evento ou revista, e o ReSearch Sul não se responsabiliza pelo que
                        acontece nesses sites.
                    </p>

                    <h3>2. Quem pode usar</h3>
                    <ul>
                        <li>Qualquer pessoa pode ver o catálogo, sem criar conta.</li>
                        <li>Para criar uma conta, é preciso ter <strong>12 anos ou mais</strong>.</li>
                        <li>Quem tem menos de 18 anos deve usar o site com o conhecimento dos pais ou responsáveis.</li>
                    </ul>

                    <h3>3. Sua conta</h3>
                    <ul>
                        <li>Use dados verdadeiros e um e-mail que seja seu.</li>
                        <li>A senha é pessoal: não passe para outras pessoas.</li>
                        <li>Você é responsável pelo que for feito com a sua conta.</li>
                    </ul>

                    <h3>4. Regras para instituições</h3>
                    <ul>
                        <li>Só cadastre eventos e publicações verdadeiros, com o link oficial correto.</li>
                        <li>Todo conteúdo passa pela moderação antes de aparecer no site.</li>
                        <li>O administrador pode recusar, corrigir ou retirar conteúdos que não sigam estas regras.</li>
                    </ul>

                    <h3>5. O que não é permitido</h3>
                    <ul>
                        <li>Publicar informações falsas, ofensivas, preconceituosas ou propaganda sem relação com o site.</li>
                        <li>Usar dados de outras pessoas ou se passar por alguém.</li>
                        <li>Tentar invadir, sobrecarregar ou atrapalhar o funcionamento do site.</li>
                    </ul>

                    <h3>6. Encerrar a conta</h3>
                    <p>
                        Você pode apagar sua conta quando quiser, na parte <strong>Meus dados</strong> do seu perfil.
                        Seus dados são apagados junto. Se for uma instituição, os eventos e publicações dela também saem do site.
                        Veja mais na <a href="#direitos">parte sobre os seus direitos</a>.
                    </p>

                    <h3>7. Mudanças nestes termos</h3>
                    <p>
                        Se estes termos mudarem, a data no começo da página é atualizada. Mudanças importantes
                        são avisadas no site.
                    </p>

                    <h3>8. Leis que valem</h3>
                    <p>
                        Estes termos seguem as leis do Brasil, principalmente a Lei Geral de Proteção de Dados
                        (Lei nº 13.709/2018) e o Marco Civil da Internet (Lei nº 12.965/2014).
                    </p>
                </section>

                <section id="privacidade" className="caixa">
                    <p className="sobrancelha"><span className="icone-quadrado verde"><ShieldCheck className="icon"/></span>Parte 2</p>
                    <h2>Política de privacidade</h2>

                    <h3>1. Quem cuida dos seus dados</h3>
                    <p>
                        Quem cuida dos dados (o <strong>controlador</strong>, como a LGPD chama) é a equipe do
                        ReSearch Sul. A pessoa responsável por atender os pedidos sobre dados (o <strong>encarregado</strong>)
                        é o administrador do site. É com ele que você fala para usar os direitos da parte 7.
                    </p>
                    <p className="termos-contato">
                        Contato do encarregado: <a href={`mailto:${EMAIL_CONTATO}`}>{EMAIL_CONTATO}</a>
                    </p>

                    <h3>2. Quais dados guardamos</h3>
                    <table className="termos-tabela">
                        <thead>
                            <tr><th>Dado</th><th>Quando</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>Nome, e-mail e tipo de conta</td><td>No cadastro (obrigatório)</td></tr>
                            <tr><td>Senha</td><td>No cadastro, guardada <strong>criptografada</strong>: nem a equipe consegue ler</td></tr>
                            <tr><td>Data em que você aceitou estes termos</td><td>No cadastro</td></tr>
                            <tr><td>Link do Currículo Lattes</td><td>Só se você quiser informar</td></tr>
                            <tr><td>Dados do arquivo XML do Lattes (nome, áreas, artigos e trabalhos em eventos)</td><td>Só se você enviar o arquivo</td></tr>
                            <tr><td>Tags, áreas e estados de interesse</td><td>Só se você escolher</td></tr>
                            <tr><td>Eventos e publicações salvos nos favoritos</td><td>Só se você clicar na estrelinha</td></tr>
                            <tr><td>Eventos e publicações cadastrados</td><td>Contas de instituição</td></tr>
                        </tbody>
                    </table>
                    <p>
                        Não pedimos documentos, endereço, telefone nem dados sensíveis (como religião, saúde ou opinião política).
                    </p>

                    <h3>3. Para que usamos e com qual permissão da lei</h3>
                    <ul>
                        <li>
                            <strong>Nome, e-mail e senha:</strong> para criar a conta e deixar você entrar. A LGPD permite
                            isso porque é necessário para o serviço que você pediu (art. 7º, inciso V).
                        </li>
                        <li>
                            <strong>Lattes, interesses e favoritos:</strong> para mostrar no seu perfil e recomendar eventos.
                            Isso depende do seu <strong>consentimento</strong> (art. 7º, inciso I): você escolhe se
                            informa ou não, e pode apagar quando quiser.
                        </li>
                        <li>
                            <strong>Conteúdos das instituições:</strong> ficam públicos no catálogo depois de aprovados,
                            junto com o nome da instituição.
                        </li>
                    </ul>
                    <p>Não usamos seus dados para propaganda, não vendemos e não fazemos perfis para outras empresas.</p>

                    <h3>4. Com quem os dados ficam</h3>
                    <p>
                        Para o site funcionar na internet, os dados ficam guardados em serviços de hospedagem:
                        o <strong>Neon</strong> (banco de dados), o <strong>Render</strong> (servidor) e
                        a <strong>Vercel</strong> (páginas do site). Quando você usa "Esqueci a senha", seu nome e
                        seu e-mail passam pelo <strong>Brevo</strong>, o serviço que envia o e-mail com o link. Alguns desses serviços podem ficar fora do Brasil,
                        por exemplo nos Estados Unidos. Eles só guardam e processam os dados para o site funcionar,
                        e não podem usá-los para outras coisas.
                    </p>
                    <p>Fora isso, só compartilhamos dados se uma lei ou a Justiça mandar.</p>

                    <h3>5. Por quanto tempo</h3>
                    <p>
                        Os dados ficam guardados enquanto a sua conta existir. Quando você apaga a conta,
                        os seus dados pessoais, o Lattes e os interesses são apagados na hora.
                    </p>

                    <h3>6. Como protegemos</h3>
                    <ul>
                        <li>A senha é criptografada antes de ser guardada.</li>
                        <li>O site e o servidor usam conexão segura (HTTPS), e o banco de dados também.</li>
                        <li>As áreas da instituição e do administrador só abrem com login do tipo certo.</li>
                    </ul>
                    <p>
                        Se acontecer algum vazamento que possa prejudicar você, avisamos você e a
                        Autoridade Nacional de Proteção de Dados (art. 48 da LGPD).
                    </p>

                    <h3 id="direitos">7. Seus direitos</h3>
                    <p>Pela LGPD (art. 18), você pode pedir, a qualquer momento e sem pagar nada:</p>
                    <ul>
                        <li>para saber se temos dados seus e quais são;</li>
                        <li>para corrigir dados errados ou desatualizados;</li>
                        <li>para receber uma cópia dos seus dados;</li>
                        <li>para apagar seus dados e a sua conta;</li>
                        <li>para saber com quem os dados são compartilhados;</li>
                        <li>para retirar o consentimento (por exemplo, tirar o Lattes, os interesses ou os favoritos do perfil).</li>
                    </ul>
                    <p>
                        Quase tudo dá para fazer sozinho, na parte <strong>Meus dados</strong> do seu perfil:
                        corrigir o nome, baixar uma cópia dos dados e apagar a conta. Para o resto (como corrigir o e-mail),
                        escreva para <a href={`mailto:${EMAIL_CONTATO}`}>{EMAIL_CONTATO}</a>. Respondemos em até 15 dias.
                    </p>
                    <p>
                        Se achar que seu pedido não foi atendido,
                        você também pode reclamar na <strong>Autoridade Nacional de Proteção de Dados (ANPD)</strong>.
                    </p>

                    <h3>8. Crianças e adolescentes</h3>
                    <p>
                        O site não aceita contas de menores de 12 anos. Para adolescentes, guardamos só o mínimo
                        necessário, sempre pensando no melhor interesse deles (art. 14 da LGPD).
                    </p>

                    <h3>9. Cookies</h3>
                    <p>
                        Não usamos cookies de propaganda nem de rastreamento. O navegador só guarda uma "chave"
                        que mantém você conectado depois do login. Ela é apagada quando você clica em Sair.
                    </p>
                </section>
            </div>
        </main>

        <Rodape/>
    </>
);

export default Termos;
