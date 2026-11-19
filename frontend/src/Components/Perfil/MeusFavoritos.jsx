import { Link } from "react-router";
import { Star } from "lucide-react";
import Cartao from "../Cartao/Cartao.jsx";
import useFavoritos from "../../utils/useFavoritos.js";

// Seção "Meus favoritos" do perfil: os eventos e publicações salvos com a estrelinha.
// Os que já passaram (ou com prazo encerrado) aparecem em cinza, com "Inscrições fechadas".
const MeusFavoritos = () => {
    const { favoritos, ids, alternar } = useFavoritos();
    const abertos = favoritos.filter((conteudo) => !conteudo.fechado).length;

    return (
        <section className="caixa caixa-perfil amarelo meus-favoritos">
            <p className="sobrancelha"><span className="icone-quadrado"><Star className="icon"/></span>Salvos</p>
            <h2>Meus favoritos</h2>

            {favoritos.length === 0 ? (
                <p className="explicacao">
                    Você ainda não salvou nada. No <Link to="/">catálogo</Link>, clique na estrelinha
                    de um evento ou publicação para guardar aqui.
                </p>
            ) : (
                <>
                    <p className="explicacao">
                        {favoritos.length} {favoritos.length === 1 ? 'salvo' : 'salvos'}
                        {' · '}{abertos} com inscrições abertas.
                        Clique na estrelinha de novo para tirar dos favoritos.
                    </p>
                    <div className="lista-favoritos">
                        {favoritos.map((conteudo) => (
                            <Cartao key={conteudo.id} conteudo={conteudo} favorito={ids.includes(conteudo.id)} aoFavoritar={alternar}/>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
};

export default MeusFavoritos;
