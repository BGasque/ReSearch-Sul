import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import api from "../../../services/api.js";
import PainelAcesso from "./PainelAcesso.jsx";
import "./Acesso.css";

// Página aberta pelo link do e-mail: cria a senha nova.
// O código vem no endereço: /redefinir-senha?codigo=...
const RedefinirSenha = () => {
    const navigate = useNavigate();
    const [parametros] = useSearchParams();
    const codigo = parametros.get('codigo') || '';

    const [senha, setSenha] = useState('');
    const [confirmacao, setConfirmacao] = useState('');
    const [mensagem, setMensagem] = useState({ texto: '', erro: false });
    const [pronto, setPronto] = useState(false);

    async function salvar(e) {
        e.preventDefault();
        if (senha !== confirmacao) {
            setMensagem({ texto: 'As duas senhas não são iguais.', erro: true });
            return;
        }
        try {
            const resposta = await api.post('/redefinir-senha', { codigo, senha });
            setMensagem({ texto: resposta.data, erro: false });
            setPronto(true);
        } catch (error) {
            setMensagem({ texto: error.response?.data || 'Não foi possível trocar a senha.', erro: true });
        }
    }

    return (
        <main className="acesso">
            <PainelAcesso/>

            <section className="acesso-formulario">
                <form onSubmit={salvar}>
                    <h1>Nova senha</h1>

                    {!codigo ? (
                        <p className="mensagem erro">
                            Este link está incompleto. Peça um novo em <Link to="/esqueci-senha">Esqueci a senha</Link>.
                        </p>
                    ) : (
                        <>
                            <p className="subtitulo">Crie uma senha nova para a sua conta do ReSearch Sul.</p>

                            <label className="campo-rotulado">
                                <span className="rotulo">Nova senha (mínimo 6 caracteres)</span>
                                <input type="password" className="campo" minLength={6} maxLength={72} value={senha} required disabled={pronto} onChange={(e) => setSenha(e.target.value)}/>
                            </label>

                            <label className="campo-rotulado">
                                <span className="rotulo">Repita a nova senha</span>
                                <input type="password" className="campo" minLength={6} maxLength={72} value={confirmacao} required disabled={pronto} onChange={(e) => setConfirmacao(e.target.value)}/>
                            </label>

                            {mensagem.texto && <p className={mensagem.erro ? 'mensagem erro' : 'mensagem'}>{mensagem.texto}</p>}

                            {pronto
                                ? <button type="button" className="botao-azul" onClick={() => navigate('/login')}>Ir para o login</button>
                                : <button type="submit" className="botao-azul">Salvar nova senha</button>}
                        </>
                    )}

                    <div className="rodape">
                        <p><Link to="/login">Voltar para o login</Link></p>
                    </div>
                </form>
            </section>
        </main>
    );
};

export default RedefinirSenha;
