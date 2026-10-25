import { Link } from "react-router";
import { Telescope } from "lucide-react";
import "./Marca.css";

// Logo da ReSearch Sul: quadrado azul com luneta + nome.
// clara = true para usar em fundo azul
const Marca = ({ clara = false }) => (
    <Link to="/" className={clara ? 'marca clara' : 'marca'} aria-label="ReSearch Sul, página inicial">
        <span className="marca-simbolo"><Telescope className="icon"/></span>
        <span className="marca-nome">ReSearch<span>Sul</span></span>
    </Link>
);

export default Marca;
