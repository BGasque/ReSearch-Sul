import { Link } from "react-router";
import { CalendarDays, MapPin, Building2, BookOpen, ArrowRight, Clock, Sparkles } from "lucide-react";
import { formatarData, diasAte, textoContador } from "../../utils/auth.js";
import "./Cartao.css";

const MAX_TAGS_NO_CARTAO = 5;

// Cartão de um evento ou publicação, usado no catálogo e nos recomendados.
// Se "motivos" vier preenchido, mostra por que o conteúdo foi recomendado.
// destacarTags: nomes das tags que devem aparecer em destaque (as escolhidas na busca)
const Cartao = ({ conteudo, destacarTags = [] }) => {
    const ehEvento = conteudo.tipo === 'EVENTO';
    const dias = diasAte(conteudo.prazo);
    const contador = textoContador(dias);

    let classe = ehEvento ? 'cartao caixa evento' : 'cartao caixa publicacao';
    if (conteudo.encerrado) classe += ' encerrado';

    return (
        <article className={classe}>
            <div className="cartao-faixa">
                <span className={ehEvento ? 'chip evento' : 'chip publicacao'}>{ehEvento ? 'Evento' : 'Publicação'}</span>
                <span className="chip"><i className={`cor-estado ${conteudo.estado}`}/>{conteudo.estado}</span>
                {conteudo.encerrado && <span className="chip fechado">Encerrado</span>}
                {!conteudo.encerrado && contador && dias <= 15 && <span className="chip urgente">{contador}</span>}
            </div>

            <div className="cartao-corpo">
                <h2><Link to={`/conteudo/${conteudo.id}`}>{conteudo.titulo}</Link></h2>
                <p className="descricao">{conteudo.descricao}</p>

                <ul className="informacoes">
                    <li><Building2 className="icon"/>{conteudo.instituicao}</li>
                    {conteudo.local && <li><MapPin className="icon"/>{conteudo.local}</li>}
                    {conteudo.autoria && <li><BookOpen className="icon"/>{conteudo.autoria}</li>}
                    {conteudo.dataInicio && (
                        <li>
                            <CalendarDays className="icon"/>
                            {formatarData(conteudo.dataInicio)}
                            {conteudo.dataFim && ` a ${formatarData(conteudo.dataFim)}`}
                        </li>
                    )}
                </ul>

                {conteudo.prazo && !conteudo.encerrado && (
                    <div className="prazo">
                        <Clock className="icon"/>
                        <span>
                            <strong>{ehEvento ? 'Inscrições até ' : 'Envio de artigos até '}{formatarData(conteudo.prazo)}</strong>
                            {contador && <small>{contador}</small>}
                        </span>
                    </div>
                )}

                <div className="areas">
                    {conteudo.areas.map((area) => <span key={area}>{area}</span>)}
                </div>

                {conteudo.tags?.length > 0 && (
                    <p className="tags">
                        {conteudo.tags.slice(0, MAX_TAGS_NO_CARTAO).map((tag) => (
                            <span key={tag} className={destacarTags.includes(tag) || conteudo.tagsEmComum?.includes(tag) ? 'destaque' : ''}>#{tag}</span>
                        ))}
                        {conteudo.tags.length > MAX_TAGS_NO_CARTAO && <span className="mais">+{conteudo.tags.length - MAX_TAGS_NO_CARTAO}</span>}
                    </p>
                )}

                {conteudo.motivos?.length > 0 && (
                    <ul className="motivos">
                        {conteudo.motivos.map((motivo) => <li key={motivo}><Sparkles className="icon"/>{motivo}</li>)}
                    </ul>
                )}
            </div>

            <Link to={`/conteudo/${conteudo.id}`} className="link-detalhes">
                Ver detalhes <ArrowRight className="icon"/>
            </Link>
        </article>
    );
};

export default Cartao;
