import { useState } from "react";
import { Link } from "react-router";
import { Flag, Send } from "lucide-react";
import api from "../../../services/api.js";
import { cabecalhoAuth, usuarioLogado } from "../../utils/auth.js";
import { MOTIVOS_RELATO } from "../../utils/rotulos.js";

// Botão "Reportar problema" da página do conteúdo (RF17)
const ReportarProblema = ({ conteudoId }) => {
    const usuario = usuarioLogado();

    const [aberto, setAberto] = useState(false);
    const [motivo, setMotivo] = useState('');
    const [detalhe, setDetalhe] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [mensagem, setMensagem] = useState(null);

    if (!usuario) {
        return (
            <p className="reportar-entrar">
                Viu algo errado? <Link to="/login">Entre</Link> para reportar um problema.
            </p>
        );
    }

    const precisaDetalhe = motivo === 'OUTRO';
    const podeEnviar = motivo && (!precisaDetalhe || detalhe.trim().length >= 10) && !enviando;

    async function enviar(e) {
        e.preventDefault();
        setEnviando(true);
        try {
            const resposta = await api.post(`/conteudos/${conteudoId}/relatos`, { motivo, detalhe }, cabecalhoAuth());
            setMensagem({ texto: resposta.data });
            setAberto(false);
            setMotivo('');
            setDetalhe('');
        } catch (error) {
            setMensagem({ texto: error.response?.data || 'Não foi possível enviar.', erro: true });
        }
        setEnviando(false);
    }

    return (
        <div className="reportar">
            {mensagem?.texto && <p className={mensagem.erro ? 'mensagem erro' : 'mensagem'}>{mensagem.texto}</p>}

            {!aberto ? (
                <button type="button" className="reportar-botao" onClick={() => { setAberto(true); setMensagem(null); }}>
                    <Flag className="icon"/> Reportar problema
                </button>
            ) : (
                <form className="reportar-caixa" onSubmit={enviar}>
                    <p className="reportar-titulo"><Flag className="icon"/> Qual é o problema?</p>
                    <div className="reportar-opcoes" role="radiogroup">
                        {MOTIVOS_RELATO.map((item) => (
                            <label key={item.valor} className="reportar-opcao">
                                <input type="radio" name="motivo" value={item.valor} checked={motivo === item.valor} onChange={() => setMotivo(item.valor)}/>
                                {item.nome}
                            </label>
                        ))}
                    </div>
                    <label className="reportar-campo">
                        <span className="rotulo">{precisaDetalhe ? 'Conte o que aconteceu' : 'Detalhes (opcional)'}</span>
                        <textarea className="campo" rows={3} maxLength={1000} value={detalhe} onChange={(e) => setDetalhe(e.target.value)} placeholder="Ex.: A data no site oficial é outra."/>
                    </label>
                    <div className="reportar-acoes">
                        <button type="submit" className="botao-azul" disabled={!podeEnviar}><Send className="icon"/> Enviar</button>
                        <button type="button" className="botao-contorno" onClick={() => setAberto(false)}>Cancelar</button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ReportarProblema;
