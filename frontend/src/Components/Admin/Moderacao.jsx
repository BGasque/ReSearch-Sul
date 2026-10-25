import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ShieldCheck, Check, X, Pencil, Trash2, Eye, ChevronDown, ChevronUp, Hash, Users, Building2, ExternalLink, Inbox } from "lucide-react";
import api from "../../../services/api.js";
import Cabecalho from "../Cabecalho/Cabecalho.jsx";
import Rodape from "../Rodape/Rodape.jsx";
import { cabecalhoAuth, usuarioLogado, formatarData } from "../../utils/auth.js";
import { SITUACOES } from "../Instituicao/situacoes.js";
import "../Instituicao/Instituicao.css";
import "./Admin.css";

const ABAS = ['PENDENTE', 'APROVADO', 'RECUSADO', 'ARQUIVADO', 'TODOS'];

// Painel de moderação do administrador: conteúdos de todas as instituições
const Moderacao = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const usuario = usuarioLogado();

    const [resumo, setResumo] = useState(null);
    const [conteudos, setConteudos] = useState(null);
    const [aba, setAba] = useState('PENDENTE');
    const [aberto, setAberto] = useState(null); // id do conteúdo com os detalhes abertos
    const [recusando, setRecusando] = useState(null); // id do conteúdo que está sendo recusado
    const [motivo, setMotivo] = useState('');
    const [mensagem, setMensagem] = useState(location.state || null);

    async function carregar(abaEscolhida = aba) {
        try {
            const params = abaEscolhida === 'TODOS' ? {} : { situacao: abaEscolhida };
            const [respostaResumo, respostaLista] = await Promise.all([
                api.get('/admin/resumo', cabecalhoAuth()),
                api.get('/admin/conteudos', { ...cabecalhoAuth(), params }),
            ]);
            setResumo(respostaResumo.data);
            setConteudos(respostaLista.data);
        } catch {
            navigate('/login');
        }
    }

    useEffect(() => {
        if (usuario?.tipo !== 'ADMIN') {
            navigate(usuario ? '/' : '/login');
            return;
        }
        carregar();
    }, []);

    function trocarAba(novaAba) {
        setAba(novaAba);
        setAberto(null);
        setRecusando(null);
        setConteudos(null);
        carregar(novaAba);
    }

    // Faz uma ação (aprovar, recusar, excluir) e recarrega a lista
    async function agir(acao, textoSucesso) {
        try {
            await acao();
            setMensagem({ texto: textoSucesso });
            setRecusando(null);
            setMotivo('');
            carregar();
        } catch (error) {
            setMensagem({ texto: error.response?.data || 'Não foi possível concluir a ação.', erro: true });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function aprovar(conteudo) {
        agir(() => api.patch(`/admin/conteudos/${conteudo.id}/aprovar`, {}, cabecalhoAuth()), `"${conteudo.titulo}" foi aprovado e já aparece no catálogo.`);
    }

    function recusar(conteudo) {
        agir(() => api.patch(`/admin/conteudos/${conteudo.id}/recusar`, { motivo }, cabecalhoAuth()), `"${conteudo.titulo}" foi recusado. A instituição vai ver o motivo.`);
    }

    function excluir(conteudo) {
        const confirmou = window.confirm(`Excluir DE VEZ "${conteudo.titulo}", de ${conteudo.instituicao.nome}?\n\nIsso não pode ser desfeito.`);
        if (!confirmou) return;
        agir(() => api.delete(`/admin/conteudos/${conteudo.id}`, cabecalhoAuth()), `"${conteudo.titulo}" foi excluído.`);
    }

    const numeros = resumo ? [
        { valor: resumo.conteudos.PENDENTE, texto: 'Em análise', cor: 'amarelo' },
        { valor: resumo.conteudos.APROVADO, texto: 'Publicados', cor: 'verde' },
        { valor: resumo.conteudos.RECUSADO, texto: 'Recusados', cor: 'coral' },
        { valor: resumo.contas.PESSOA, texto: 'Pessoas', cor: 'azul', icone: Users },
        { valor: resumo.contas.INSTITUICAO, texto: 'Instituições', cor: 'azul', icone: Building2 },
        { valor: resumo.tags, texto: 'Tags ativas', cor: 'cinza', icone: Hash },
    ] : [];

    return (
        <>
            <Cabecalho/>

            <section className="faixa-topo admin-topo">
                <div className="container">
                    <div>
                        <p className="sobrancelha"><span className="icone-quadrado"><ShieldCheck className="icon"/></span>Administração</p>
                        <h1>Moderação de <span className="marca-texto">conteúdos</span></h1>
                        <p>Confira o que as instituições enviaram. Só o que você aprovar aparece no catálogo.</p>
                    </div>
                    <Link to="/admin/tags" className="botao-amarelo botao-grande"><Hash className="icon"/> Gerenciar tags</Link>
                </div>
            </section>

            <main className="mainInstituicao container">
                <section className="contadores admin-contadores">
                    {numeros.map((numero) => (
                        <div key={numero.texto} className={`contador caixa ${numero.cor}`}>
                            <strong>{numero.valor}</strong>
                            <span>{numero.texto}</span>
                        </div>
                    ))}
                </section>

                {mensagem?.texto && <p className={mensagem.erro ? 'mensagem erro' : 'mensagem'}>{mensagem.texto}</p>}

                <div className="titulo-lista">
                    <h2>{aba === 'PENDENTE' ? 'Fila de análise' : 'Conteúdos'}</h2>
                    <div className="abas" role="tablist">
                        {ABAS.map((item) => (
                            <button key={item} type="button" role="tab" aria-selected={aba === item} className={aba === item ? 'aba ativa' : 'aba'} onClick={() => trocarAba(item)}>
                                {item === 'TODOS' ? 'Todos' : SITUACOES[item].nome}
                                {item === 'PENDENTE' && resumo?.conteudos.PENDENTE > 0 && <span className="aba-contagem">{resumo.conteudos.PENDENTE}</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {!conteudos && <p className="aviso">Carregando...</p>}

                {conteudos?.length === 0 && (
                    <div className="vazio caixa">
                        <Inbox className="icon"/>
                        <h3>{aba === 'PENDENTE' ? 'Nada esperando análise' : 'Nenhum conteúdo aqui'}</h3>
                        <p>{aba === 'PENDENTE' ? 'Tudo em dia! Quando uma instituição enviar algo, aparece aqui.' : 'Escolha outra aba para ver mais conteúdos.'}</p>
                    </div>
                )}

                <ul className="linhas">
                    {conteudos?.map((conteudo) => {
                        const situacao = SITUACOES[conteudo.situacao];
                        const ehEvento = conteudo.tipo === 'EVENTO';
                        const estaAberto = aberto === conteudo.id;

                        return (
                            <li key={conteudo.id} className={`moderar caixa ${situacao.cor}`}>
                                <div className="moderar-topo">
                                    <div className="linha-info">
                                        <div className="linha-chips">
                                            <span className={ehEvento ? 'chip evento' : 'chip publicacao'}>{ehEvento ? 'Evento' : 'Publicação'}</span>
                                            <span className="chip"><i className={`cor-estado ${conteudo.estado}`}/>{conteudo.estado}</span>
                                            <span className={`chip situacao ${situacao.cor}`}>{situacao.nome}</span>
                                        </div>
                                        <h3>{conteudo.titulo}</h3>
                                        <p className="linha-datas">
                                            <span><Building2 className="icon"/>{conteudo.instituicao.nome}</span>
                                            <span>Enviado em {formatarData(conteudo.atualizadoEm)}</span>
                                        </p>
                                    </div>
                                    <button type="button" className="botao-contorno botao-pequeno" onClick={() => setAberto(estaAberto ? null : conteudo.id)} aria-expanded={estaAberto}>
                                        {estaAberto ? <><ChevronUp className="icon"/> Fechar</> : <><ChevronDown className="icon"/> Conferir</>}
                                    </button>
                                </div>

                                {/* Tudo o que o administrador precisa conferir (CU14) */}
                                {estaAberto && (
                                    <div className="moderar-detalhes">
                                        <p className="moderar-descricao">{conteudo.descricao}</p>
                                        <dl className="moderar-ficha">
                                            {conteudo.local && <><dt>Local</dt><dd>{conteudo.local}</dd></>}
                                            {conteudo.autoria && <><dt>Autoria</dt><dd>{conteudo.autoria}</dd></>}
                                            {conteudo.dataInicio && <><dt>Data</dt><dd>{formatarData(conteudo.dataInicio)}{conteudo.dataFim && ` a ${formatarData(conteudo.dataFim)}`}</dd></>}
                                            {conteudo.prazo && <><dt>Prazo</dt><dd>{formatarData(conteudo.prazo)}</dd></>}
                                            <dt>Áreas</dt><dd>{conteudo.areas.map((area) => area.nome).join(', ')}</dd>
                                            <dt>Tags</dt><dd>{conteudo.tags.length ? conteudo.tags.map((tag) => `#${tag.nome}`).join('  ') : 'Nenhuma'}</dd>
                                            <dt>Link oficial</dt>
                                            <dd><a href={conteudo.linkOficial} target="_blank" rel="noreferrer">{conteudo.linkOficial} <ExternalLink className="icon"/></a></dd>
                                            <dt>Contato</dt><dd>{conteudo.instituicao.email}</dd>
                                        </dl>
                                        {conteudo.motivoRecusa && <p className="motivo-recusa"><strong>Motivo da recusa:</strong> {conteudo.motivoRecusa}</p>}
                                    </div>
                                )}

                                {/* Caixa para escrever o motivo da recusa */}
                                {recusando === conteudo.id && (
                                    <div className="caixa-recusa">
                                        <label className="campo-rotulado">
                                            <span className="rotulo">Por que está recusando? (a instituição vai ler)</span>
                                            <textarea className="campo" rows={3} value={motivo} maxLength={1000} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: O link oficial não abre. Confira o endereço e envie de novo."/>
                                        </label>
                                        <div className="moderar-acoes">
                                            <button type="button" className="botao botao-pequeno recusar" onClick={() => recusar(conteudo)} disabled={motivo.trim().length < 10}>
                                                <X className="icon"/> Confirmar recusa
                                            </button>
                                            <button type="button" className="botao-contorno botao-pequeno" onClick={() => { setRecusando(null); setMotivo(''); }}>Cancelar</button>
                                        </div>
                                    </div>
                                )}

                                <div className="moderar-acoes">
                                    {conteudo.situacao !== 'APROVADO' && (
                                        <button type="button" className="botao botao-pequeno aprovar" onClick={() => aprovar(conteudo)}><Check className="icon"/> Aprovar</button>
                                    )}
                                    {conteudo.situacao !== 'RECUSADO' && recusando !== conteudo.id && (
                                        <button type="button" className="botao-contorno botao-pequeno" onClick={() => { setRecusando(conteudo.id); setMotivo(''); setAberto(conteudo.id); }}><X className="icon"/> Recusar</button>
                                    )}
                                    <Link to={`/admin/editar/${conteudo.id}`} className="botao-contorno botao-pequeno"><Pencil className="icon"/> Editar</Link>
                                    {(conteudo.situacao === 'APROVADO' || (conteudo.situacao === 'ARQUIVADO' && conteudo.publicado)) && (
                                        <Link to={`/conteudo/${conteudo.id}`} className="botao-contorno botao-pequeno"><Eye className="icon"/> Ver no site</Link>
                                    )}
                                    <button type="button" className="botao-contorno botao-pequeno perigo" onClick={() => excluir(conteudo)}><Trash2 className="icon"/> Excluir</button>
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

export default Moderacao;
