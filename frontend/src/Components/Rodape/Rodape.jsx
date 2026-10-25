import { Link } from "react-router";
import Marca from "../Marca/Marca.jsx";
import "./Rodape.css";

// Rodapé, no fim das páginas
const Rodape = () => (
    <footer className="rodape-site">
        <div className="container">
            <div className="rodape-sobre">
                <Marca clara/>
                <p>Eventos e publicações acadêmicas do Paraná, de Santa Catarina e do Rio Grande do Sul, num lugar só.</p>
                <div className="rodape-estados">
                    <span><i className="cor-estado PR"/> PR</span>
                    <span><i className="cor-estado SC"/> SC</span>
                    <span><i className="cor-estado RS"/> RS</span>
                </div>
            </div>

            <nav className="rodape-links" aria-label="Links do rodapé">
                <p className="rotulo">Navegar</p>
                <Link to="/">Catálogo</Link>
                <Link to="/recomendacoes">Recomendados</Link>
                <Link to="/perfil">Meu perfil</Link>
                <Link to="/register">Criar conta</Link>
            </nav>

            <div className="rodape-links">
                <p className="rotulo">Sobre o projeto</p>
                <p>Trabalho de Conclusão de Curso do Técnico em Informática para Internet integrado ao Ensino Médio.</p>
                <p>As inscrições e os envios de artigos acontecem sempre no site oficial de cada oportunidade.</p>
            </div>
        </div>
    </footer>
);

export default Rodape;
