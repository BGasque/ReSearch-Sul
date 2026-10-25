import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, ArrowUpRight, Building2, BookOpen, MapPin, CalendarDays, Clock, Tags, Info, Hash } from "lucide-react";
import api from "../../../services/api.js";
import Cabecalho from "../Cabecalho/Cabecalho.jsx";
import Rodape from "../Rodape/Rodape.jsx";
import { formatarData, diasAte, textoContador } from "../../utils/auth.js";
import "./Detalhe.css";

const NOMES_ESTADO = { PR: 'Paraná', SC: 'Santa Catarina', RS: 'Rio Grande do Sul' };

// Página com todas as informações de um evento ou de uma publicação
const Detalhe = () => {
    const { id } = useParams();

    const [conteudo, setConteudo] = useState(null);
    const [erro, setErro] = useState('');

    useEffect(() => {
        api.get(`/conteudos/${id}`)
            .then((resposta) => setConteudo(resposta.data))
            .catch((error) => setErro(error.response?.data || 'Não foi possível carregar este conteúdo.'));
    }, [id]);

    const voltar = <Link to="/" className="voltar"><ArrowLeft className="icon"/> Voltar ao catálogo</Link>;

    if (erro || !conteudo) {
        return (
            <>
                <Cabecalho/>
                <main className="mainDetalhe container sem-conteudo">
                    {voltar}
                    <p className="aviso">{erro || 'Carregando...'}</p>
                </main>
            </>
        );
    }

    const ehEvento = conteudo.tipo === 'EVENTO';
    const dias = diasAte(conteudo.prazo);
    const contador = !conteudo.encerrado && textoContador(dias);

    // Linhas da ficha: só aparecem as que têm informação
    const ficha = [
        { icone: Building2, rotulo: 'Instituição', valor: conteudo.instituicao },
        { icone: BookOpen, rotulo: ehEvento ? 'Organização' : 'Autoria', valor: conteudo.autoria },
        { icone: MapPin, rotulo: 'Local', valor: conteudo.local },
        {
            icone: CalendarDays,
            rotulo: 'Data',
            valor: conteudo.dataInicio && `${formatarData(conteudo.dataInicio)}${conteudo.dataFim ? ` a ${formatarData(conteudo.dataFim)}` : ''}`,
        },
        { icone: Tags, rotulo: 'Áreas', valor: conteudo.areas.join(', ') },
        { icone: Hash, rotulo: 'Tags', valor: conteudo.tags.map((tag) => `#${tag}`).join('  ') },
    ].filter((linha) => linha.valor);

    return (
        <>
            <Cabecalho/>

            <section className={ehEvento ? 'faixa-topo detalhe-topo' : 'faixa-topo detalhe-topo publicacao'}>
                <div className="container">
                    {voltar}
                    <div className="detalhe-chips">
                        <span className={ehEvento ? 'chip evento' : 'chip publicacao'}>{ehEvento ? 'Evento' : 'Publicação'}</span>
                        <span className="chip"><i className={`cor-estado ${conteudo.estado}`}/>{NOMES_ESTADO[conteudo.estado]}</span>
                        {conteudo.encerrado && <span className="chip">Encerrado</span>}
                    </div>
                    <h1>{conteudo.titulo}</h1>
                </div>
            </section>

            <main className="mainDetalhe container">
                <div className="detalhe-principal">
                    {conteudo.arquivado && (
                        <p className="faixa-aviso"><Info className="icon"/> Este conteúdo foi arquivado pela instituição e fica aqui apenas como histórico.</p>
                    )}
                    {!conteudo.arquivado && conteudo.encerrado && (
                        <p className="faixa-aviso"><Info className="icon"/> Este evento já terminou e fica aqui apenas como histórico.</p>
                    )}

                    <section className="caixa bloco">
                        <h2>Sobre</h2>
                        <p className="descricao">{conteudo.descricao}</p>
                    </section>

                    <section className="caixa bloco">
                        <h2>Ficha</h2>
                        <dl className="ficha">
                            {ficha.map((linha) => (
                                <div key={linha.rotulo} className="ficha-linha">
                                    <dt><linha.icone className="icon"/>{linha.rotulo}</dt>
                                    <dd>{linha.valor}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                </div>

                {/* Cartão de ação: prazo e link oficial */}
                <aside className="detalhe-acao caixa">
                    {conteudo.prazo ? (
                        <div className="acao-prazo">
                            <p className="rotulo"><Clock className="icon"/>{ehEvento ? 'Inscrições até' : 'Envio de artigos até'}</p>
                            <p className="acao-data">{formatarData(conteudo.prazo)}</p>
                            {contador && <p className="acao-contador">{contador}</p>}
                            {!contador && <p className="acao-contador fechado">Prazo encerrado</p>}
                        </div>
                    ) : (
                        <div className="acao-prazo">
                            <p className="rotulo"><Clock className="icon"/>Prazo</p>
                            <p className="acao-sem-prazo">Confira as datas no site oficial.</p>
                        </div>
                    )}

                    <a href={conteudo.linkOficial} target="_blank" rel="noreferrer" className="botao-azul botao-oficial">
                        Ir para o site oficial <ArrowUpRight className="icon"/>
                    </a>
                    <p className="nota">
                        {ehEvento ? 'A inscrição é feita no site oficial.' : 'O acesso e o envio de artigos são feitos no site oficial.'}
                        {' '}Atualizado em {formatarData(conteudo.atualizadoEm)}.
                    </p>
                </aside>
            </main>

            <Rodape/>
        </>
    );
};

export default Detalhe;
