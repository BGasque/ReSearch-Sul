import { Link, NavLink, useNavigate } from "react-router";
import { LogOut } from "lucide-react";
import { usuarioLogado, sair } from "../../utils/auth.js";
import Marca from "../Marca/Marca.jsx";
import "./Cabecalho.css";

// Barra do topo, igual em todas as páginas
const Cabecalho = () => {
    const navigate = useNavigate();
    const usuario = usuarioLogado();

    function clicarSair() {
        sair();
        navigate('/');
    }

    return (
        <header className="cabecalho">
            <nav className="container">
                <Marca/>

                <div className="cabecalho-links">
                    <NavLink to="/" end>Catálogo</NavLink>

                    {usuario ? (
                        <>
                            {usuario.tipo === 'PESSOA' && <NavLink to="/recomendacoes">Recomendados</NavLink>}
                            {usuario.tipo === 'INSTITUICAO' && <NavLink to="/instituicao">Minha instituição</NavLink>}
                            {usuario.tipo === 'ADMIN' && <NavLink to="/admin">Moderação</NavLink>}
                            <NavLink to="/perfil" className="perfil-link">
                                <span className="avatar">{usuario.nome.charAt(0).toUpperCase()}</span>
                                <span className="perfil-texto">Meu perfil</span>
                            </NavLink>
                            <button type="button" className="sair" onClick={clicarSair} aria-label="Sair">
                                <LogOut className="icon"/>
                            </button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login">Entrar</NavLink>
                            <Link to="/register" className="botao-amarelo">Criar conta</Link>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Cabecalho;
