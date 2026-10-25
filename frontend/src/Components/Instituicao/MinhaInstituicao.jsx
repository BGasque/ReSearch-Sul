import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Building2, Plus, Pencil, Archive, Eye, CalendarDays, Clock, Inbox } from "lucide-react";
import api from "../../../services/api.js";
import Cabecalho from "../Cabecalho/Cabecalho.jsx";
import Rodape from "../Rodape/Rodape.jsx";
import { cabecalhoAuth, usuarioLogado, formatarData } from "../../utils/auth.js";
import { SITUACOES } from "./situacoes.js";
import "./Instituicao.css";

const FILTROS = ['TODOS', 'PENDENTE', 'APROVADO', 'RECUSADO', 'ARQUIVADO'];

// Área da instituição: lista dos próprios eventos e publicações, com a situação de cada um
const MinhaInstituicao = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const usuario = usuarioLogado();

    const [conteudos, setConteudos] = useState(null);
    const [filtro, setFiltro] = useState('TODOS');
    // Mensagem que veio do formulário (ex.: "Evento enviado para análise")
    const [mensagem, setMensagem] = useState(location.state || null);

    async function carregar() {
        try {
            const resposta = await api.get('/instituicao/conteudos', cabecalhoAuth());
            setConteudos(resposta.data);
        } catch {
            navigate('/login');
        }
    }

    useEffect(() => {
        if (usuario?.tipo !== 'INSTITUICAO') {
            navigate(usuario ? '/' : '/login');
            return;
        }
        carregar();
    }, []);

    async function arquivar(conteudo) {
        const confirmou = window.confirm(`Arquivar "${conteudo.titulo}"?\n\nEle sai do catálogo. Você pode editar e enviar de novo depois.`);
        if (!confirmou) return;

        try {
            await api.patch(`/instituicao/conteudos/${conteudo.id}/arquivar`, {}, cabecalhoAuth());
            setMensagem({ texto: 'Conteúdo arquivado.' });
            carregar();
        } catch (error) {
            setMensagem({ texto: error.response?.data || 'Não foi possível arquivar.', erro: true });
        }
    }

    const contar = (situacao) => conteudos?.filter((c) => c.situacao === situacao).length || 0;
    const lista = conteudos?.filter((c) => filtro === 'TODOS' || c.situacao === filtro) || [];

    return (
        <>
            <Cabecalho/>

            <section className="faixa-topo instituicao-topo">
                <div className="container">
                    <div>
                        <p className="sobrancelha"><span className="icone-quadrado"><Building2 className="icon"/></span>Área da instituição</p>
                        <h1>{usuario?.nome}</h1>
                        <p>Cadastre seus eventos e publicações. Tudo passa pela análise do administrador antes de aparecer no site.</p>
                    </div>
                    <Link to="/instituicao/novo" className="botao-amarelo botao-grande"><Plus className="icon"/> Novo evento ou publicação</Link>
                </div>
            </section>

            <main className="mainInstituicao container">
                {/* Contadores por situação */}
                <section className="contadores">
                    {['PENDENTE', 'APROVADO', 'RECUSADO', 'ARQUIVADO'].map((situacao) => (
                        <div key={situacao} className={`contador caixa ${SITUACOES[situacao].cor}`}>
                            <strong>{contar(situacao)}</strong>
                            <span>{SITUACOES[situacao].nome}</span>
                        </div>
                    ))}
                </section>

                {mensagem?.texto && <p className={mensagem.erro ? 'mensagem erro' : 'mensagem'}>{mensagem.texto}</p>}
                {mensagem?.aviso && <p className="mensagem aviso-amarelo">{mensagem.aviso}</p>}

                <div className="titulo-lista">
                    <h2>Meus conteúdos</h2>
                    <div className="abas" role="tablist">
                        {FILTROS.map((item) => (
                            <button
                                key={item}
                                type="button"
                                role="tab"
                                aria-selected={filtro === item}
                                className={filtro === item ? 'aba ativa' : 'aba'}
                                onClick={() => setFiltro(item)}
                            >
                                {item === 'TODOS' ? 'Todos' : SITUACOES[item].nome}
                            </button>
                        ))}
                    </div>
                </div>

                {!conteudos && <p className="aviso">Carregando...</p>}

                {conteudos && conteudos.length === 0 && (
                    <div className="vazio caixa">
                        <Inbox className="icon"/>
                        <h3>Nenhum conteúdo ainda</h3>
                        <p>Cadastre o primeiro evento ou publicação da sua instituição.</p>
                        <Link to="/instituicao/novo" className="botao-azul"><Plus className="icon"/> Cadastrar agora</Link>
                    </div>
                )}

                {conteudos && conteudos.length > 0 && lista.length === 0 && (
                    <p className="aviso">Nenhum conteúdo nesta situação.</p>
                )}

                <ul className="linhas">
                    {lista.map((conteudo) => {
                        const situacao = SITUACOES[conteudo.situacao];
                        const ehEvento = conteudo.tipo === 'EVENTO';
                        const temPagina = conteudo.situacao === 'APROVADO' || (conteudo.situacao === 'ARQUIVADO' && conteudo.publicado);

                        return (
                            <li key={conteudo.id} className={`linha caixa ${situacao.cor}`}>
                                <div className="linha-info">
                                    <div className="linha-chips">
                                        <span className={ehEvento ? 'chip evento' : 'chip publicacao'}>{ehEvento ? 'Evento' : 'Publicação'}</span>
                                        <span className="chip"><i className={`cor-estado ${conteudo.estado}`}/>{conteudo.estado}</span>
                                        <span className={`chip situacao ${situacao.cor}`}>{situacao.nome}</span>
                                    </div>
                                    <h3>{conteudo.titulo}</h3>
                                    <p className="linha-datas">
                                        {conteudo.dataInicio && <span><CalendarDays className="icon"/>{formatarData(conteudo.dataInicio)}</span>}
                                        {conteudo.prazo && <span><Clock className="icon"/>Prazo {formatarData(conteudo.prazo)}</span>}
                                        <span>Atualizado em {formatarData(conteudo.atualizadoEm)}</span>
                                    </p>
                                    <p className="linha-explicacao">{situacao.explicacao}</p>
                                    {conteudo.situacao === 'RECUSADO' && conteudo.motivoRecusa && (
                                        <p className="motivo-recusa"><strong>Motivo do administrador:</strong> {conteudo.motivoRecusa}</p>
                                    )}
                                </div>

                                <div className="linha-acoes">
                                    {temPagina && (
                                        <Link to={`/conteudo/${conteudo.id}`} className="botao-contorno"><Eye className="icon"/> Ver</Link>
                                    )}
                                    <Link to={`/instituicao/editar/${conteudo.id}`} className="botao-contorno"><Pencil className="icon"/> Editar</Link>
                                    {conteudo.situacao !== 'ARQUIVADO' && (
                                        <button type="button" className="botao-contorno perigo" onClick={() => arquivar(conteudo)}><Archive className="icon"/> Arquivar</button>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </main>

            <Rodape/>
        </>
    );
};

export default MinhaInstituicao;
