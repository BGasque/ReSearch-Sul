import { useState } from "react";
import { Link } from "react-router";
import api from "../../../services/api.js";
import PainelAcesso from "./PainelAcesso.jsx";
import "./Acesso.css";

// Página "Esqueci a senha": a pessoa informa o e-mail e recebe um link para criar uma senha nova
const EsqueciSenha = () => {
    const [email, setEmail] = useState('');
    const [mensagem, setMensagem] = useState({ texto: '', erro: false });
    const [enviando, setEnviando] = useState(false);

    async function pedirLink(e) {
        e.preventDefault();
        setEnviando(true);
        try {
            const resposta = await api.post('/esqueci-senha', { email });
            setMensagem({ texto: resposta.data, erro: false });
        } catch (error) {
            setMensagem({ texto: error.response?.data || 'Não foi possível enviar agora.', erro: true });
        } finally {
            setEnviando(false);
        }
    }

    return (
        <main className="acesso">
            <PainelAcesso/>

            <section className="acesso-formulario">
                <form onSubmit={pedirLink}>
                    <h1>Esqueci a senha</h1>
                    <p className="subtitulo">Digite o e-mail da sua conta. Vamos mandar um link para você criar uma senha nova.</p>

                    <label className="campo-rotulado">
                        <span className="rotulo">E-mail</span>
                        <input type="email" className="campo" value={email} required onChange={(e) => setEmail(e.target.value)}/>
                    </label>

                    {mensagem.texto && <p className={mensagem.erro ? 'mensagem erro' : 'mensagem'}>{mensagem.texto}</p>}

                    <button type="submit" className="botao-azul" disabled={enviando}>
                        {enviando ? 'Enviando...' : 'Enviar link'}
                    </button>

                    <div className="rodape">
                        <p>Lembrou a senha? <Link to="/login">Entrar</Link></p>
                    </div>
                </form>
            </section>
        </main>
    );
};

export default EsqueciSenha;
