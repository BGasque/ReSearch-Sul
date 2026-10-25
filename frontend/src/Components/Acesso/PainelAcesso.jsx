import { CalendarCheck, Sparkles, GraduationCap } from "lucide-react";
import Marca from "../Marca/Marca.jsx";

const VANTAGENS = [
    { icone: CalendarCheck, cor: 'amarelo', texto: 'Congressos, mostras e chamadas de artigos num só lugar' },
    { icone: Sparkles, cor: 'coral', texto: 'Sugestões a partir das áreas que você segue' },
    { icone: GraduationCap, cor: 'verde', texto: 'Seu Currículo Lattes ligado ao perfil' },
];

// Painel azul que aparece ao lado dos formulários de login e cadastro
const PainelAcesso = () => (
    <section className="acesso-painel">
        <Marca clara/>

        <div>
            <h2>Sua próxima <span className="marca-texto">oportunidade</span> está aqui.</h2>

            <ul className="vantagens">
                {VANTAGENS.map((vantagem) => (
                    <li key={vantagem.texto} className={vantagem.cor}>
                        <span className="vantagem-icone"><vantagem.icone className="icon"/></span>
                        {vantagem.texto}
                    </li>
                ))}
            </ul>
        </div>

        <p className="acesso-estados">
            <span><i className="cor-estado PR"/> Paraná</span>
            <span><i className="cor-estado SC"/> Santa Catarina</span>
            <span><i className="cor-estado RS"/> Rio Grande do Sul</span>
        </p>
    </section>
);

export default PainelAcesso;
