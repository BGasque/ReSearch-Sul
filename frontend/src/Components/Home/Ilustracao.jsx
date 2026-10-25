import { CalendarDays, BookOpen, Mic, MapPin } from "lucide-react";

// Desenho do topo da página inicial: crachás e ingressos de eventos empilhados,
// como num mural de congresso. É só decoração (não são dados reais).
const Ilustracao = () => (
    <div className="ilustracao" aria-hidden="true">
        <div className="ingresso ingresso-1">
            <span className="chip evento">Evento</span>
            <p className="ingresso-titulo">Congresso</p>
            <p className="ingresso-linha"><Mic className="icon"/> Palestras e pôsteres</p>
            <div className="ingresso-picote"/>
            <p className="ingresso-linha"><CalendarDays className="icon"/> Inscrições abertas</p>
        </div>

        <div className="ingresso ingresso-2">
            <span className="chip publicacao">Publicação</span>
            <p className="ingresso-titulo">Chamada de artigos</p>
            <p className="ingresso-linha"><BookOpen className="icon"/> Revista científica</p>
        </div>

        <div className="ingresso ingresso-3">
            <span className="chip"><i className="cor-estado RS"/> Mostra</span>
            <p className="ingresso-titulo">Feira de ciências</p>
        </div>

        <div className="alfinete">
            <MapPin className="icon"/>
            <span>PR · SC · RS</span>
        </div>
    </div>
);

export default Ilustracao;
