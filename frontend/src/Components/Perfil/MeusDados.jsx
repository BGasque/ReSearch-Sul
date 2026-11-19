import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Download, ShieldCheck, Trash2 } from "lucide-react";
import api from "../../../services/api.js";
import { cabecalhoAuth, sair } from "../../utils/auth.js";

// Seção "Meus dados" do perfil: os direitos da LGPD (art. 18) feitos pelo próprio site.
// Corrigir o nome, baixar uma cópia dos dados e apagar a conta.
const MeusDados = ({ usuario, aoMudarNome }) => {
    const navigate = useNavigate();

    const [nome, setNome] = useState(usuario.nome);
    const [mensagem, setMensagem] = useState({ texto: '', erro: false });
    const [excluindo, setExcluindo] = useState(false);
    const [senha, setSenha] = useState('');

    async function salvarNome(e) {
        e.preventDefault();
        try {
            const resposta = await api.put('/perfil/nome', { nome }, cabecalhoAuth());
            setMensagem({ texto: resposta.data, erro: false });
            aoMudarNome();
        } catch (error) {
            setMensagem({ texto: error.response?.data || 'Não foi possível salvar.', erro: true });
        }
    }

    // Pede os dados ao servidor e baixa como arquivo .json
    async function baixarDados() {
        try {
            const resposta = await api.get('/perfil/meus-dados', cabecalhoAuth());
            const arquivo = new Blob([JSON.stringify(resposta.data, null, 2)], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(arquivo);
            link.download = 'meus-dados-researchsul.json';
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (error) {
            setMensagem({ texto: error.response?.data || 'Não foi possível baixar os dados.', erro: true });
        }
    }

    async function excluirConta(e) {
        e.preventDefault();
        try {
            await api.delete('/perfil/conta', { ...cabecalhoAuth(), data: { senha } });
            sair();
            navigate('/');
        } catch (error) {
            setMensagem({ texto: error.response?.data || 'Não foi possível apagar a conta.', erro: true });
        }
    }

    return (
        <section className="caixa caixa-perfil amarelo meus-dados">
            <p className="sobrancelha"><span className="icone-quadrado"><ShieldCheck className="icon"/></span>LGPD</p>
            <h2>Meus dados</h2>
            <p className="explicacao">
                Pela Lei Geral de Proteção de Dados, você pode corrigir, baixar e apagar seus dados quando quiser.
                Veja a <Link to="/termos#privacidade">Política de privacidade</Link>.
            </p>

            <h3 className="rotulo">Corrigir meu nome</h3>
            <form onSubmit={salvarNome} className="linha">
                <label htmlFor="meu-nome" className="visually-hidden">Nome</label>
                <input id="meu-nome" type="text" className="campo" maxLength={100} required value={nome} onChange={(e) => setNome(e.target.value)}/>
                <button type="submit" className="botao-azul">Salvar nome</button>
            </form>
            <p className="explicacao">Para corrigir o e-mail, escreva para o encarregado dos dados (o contato está na Política de privacidade).</p>

            <h3 className="rotulo">Baixar meus dados</h3>
            <p className="explicacao">Um arquivo com tudo o que o ReSearch Sul guarda sobre você.</p>
            <button type="button" className="botao-contorno botao-pequeno" onClick={baixarDados}>
                <Download className="icon"/> Baixar meus dados
            </button>

            {usuario.tipo !== 'ADMIN' && (
                <>
                    <h3 className="rotulo">Apagar minha conta</h3>
                    {!excluindo ? (
                        <button type="button" className="botao-perigo botao-pequeno" onClick={() => { setExcluindo(true); setMensagem({ texto: '', erro: false }); }}>
                            <Trash2 className="icon"/> Apagar minha conta
                        </button>
                    ) : (
                        <form onSubmit={excluirConta} className="confirmar-exclusao">
                            <p>
                                <strong>Isso não pode ser desfeito.</strong> Sua conta, seu Lattes e seus interesses serão apagados
                                {usuario.tipo === 'INSTITUICAO' && ', junto com todos os eventos e publicações da instituição'}.
                                Digite sua senha para confirmar.
                            </p>
                            <div className="linha">
                                <label htmlFor="senha-exclusao" className="visually-hidden">Senha</label>
                                <input id="senha-exclusao" type="password" className="campo" placeholder="Sua senha" required value={senha} onChange={(e) => setSenha(e.target.value)}/>
                                <button type="submit" className="botao-perigo">Apagar para sempre</button>
                            </div>
                            <button type="button" className="botao-contorno botao-pequeno" onClick={() => { setExcluindo(false); setSenha(''); }}>Cancelar</button>
                        </form>
                    )}
                </>
            )}

            {mensagem.texto && <p className={mensagem.erro ? 'mensagem erro' : 'mensagem'}>{mensagem.texto}</p>}
        </section>
    );
};

export default MeusDados;
