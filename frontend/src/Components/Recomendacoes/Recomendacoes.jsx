import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Sparkles, Target } from "lucide-react";
import api from "../../../services/api.js";
import Cabecalho from "../Cabecalho/Cabecalho.jsx";
import Cartao from "../Cartao/Cartao.jsx";
import Rodape from "../Rodape/Rodape.jsx";
import { cabecalhoAuth, pegarToken } from "../../utils/auth.js";
import "../Home/Home.css";
import "./Recomendacoes.css";

// Página "Recomendados para você": conteúdos que combinam com os interesses do usuário
const Recomendacoes = () => {
    const navigate = useNavigate();
    const [resultado, setResultado] = useState(null);

    useEffect(() => {
        if (!pegarToken()) {
            navigate('/login');
            return;
        }

        api.get('/recomendacoes', cabecalhoAuth())
            .then((resposta) => setResultado(resposta.data))
            .catch(() => navigate('/login'));
    }, []);

    return (
        <>
            <Cabecalho/>

            <section className="faixa-topo">
                <div className="container">
                    <p className="sobrancelha"><span className="icone-quadrado"><Sparkles className="icon"/></span>Feito para o seu perfil</p>
                    <h1>Recomendados <span className="marca-texto">para você</span></h1>
                    <p>Eventos e publicações escolhidos a partir das áreas e dos estados que você segue.</p>
                </div>
            </section>

            <main className="mainHome container">

                {!resultado && <p className="aviso">Carregando...</p>}

                {resultado && !resultado.temInteresses && (
                    <div className="aviso-interesses caixa">
                        <span className="aviso-icone"><Target className="icon"/></span>
                        <p>Você ainda não escolheu suas áreas de interesse, então ainda não dá para personalizar.</p>
                        <Link to="/perfil" className="botao-azul">Escolher meus interesses</Link>
                        {resultado.conteudos.length > 0 && <p className="subtitulo">Enquanto isso, veja algumas oportunidades abertas:</p>}
                    </div>
                )}

                {resultado?.temInteresses && resultado.conteudos.length === 0 && (
                    <div className="aviso-interesses caixa">
                        <span className="aviso-icone"><Target className="icon"/></span>
                        <p>Nenhuma oportunidade aberta combina com seus interesses agora.</p>
                        <p className="subtitulo">
                            Você pode <Link to="/perfil">mudar seus interesses</Link> ou <Link to="/">ver o catálogo completo</Link>.
                        </p>
                    </div>
                )}

                {resultado?.temInteresses && resultado.conteudos.length > 0 && (
                    <p className="quantidade rotulo">
                        {resultado.conteudos.length} {resultado.conteudos.length === 1 ? 'oportunidade combina' : 'oportunidades combinam'} com você.
                        {' '}<Link to="/">Ver o catálogo completo</Link>
                    </p>
                )}

                <section className="lista">
                    {resultado?.conteudos.map((conteudo) => <Cartao key={conteudo.id} conteudo={conteudo}/>)}
                </section>
            </main>

            <Rodape/>
        </>
    );
};

export default Recomendacoes;
