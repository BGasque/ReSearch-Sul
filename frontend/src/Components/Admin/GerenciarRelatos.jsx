import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Flag, Check, X, RotateCcw, Eye, Pencil, Building2, User, Inbox } from "lucide-react";
import api from "../../../services/api.js";
import Cabecalho from "../Cabecalho/Cabecalho.jsx";
import Rodape from "../Rodape/Rodape.jsx";
import { cabecalhoAuth, usuarioLogado, formatarData } from "../../utils/auth.js";
import { nomeMotivoRelato } from "../../utils/rotulos.js";
import { SITUACOES } from "../Instituicao/situacoes.js";
import "../Instituicao/Instituicao.css";
import "./Admin.css";

const ABAS = [
    { valor: 'ABERTO', nome: 'Abertos' },
    { valor: 'RESOLVIDO', nome: 'Resolvidos' },
    { valor: 'DESCARTADO', nome: 'Descartados' },
    { valor: 'TODOS', nome: 'Todos' },
];
const CORES = { ABERTO: 'coral', RESOLVIDO: 'verde', DESCARTADO: 'cinza' };
const NOMES = { ABERTO: 'Aberto', RESOLVIDO: 'Resolvido', DESCARTADO: 'Descartado' };

// Página do administrador com os problemas que os usuários comunicaram (RF17)
const GerenciarRelatos = () => {
    const navigate = useNavigate();
    const usuario = usuarioLogado();

    const [relatos, setRelatos] = useState(null);
    const [aba, setAba] = useState('ABERTO');
    const [mensagem, setMensagem] = useState(null);

    async function carregar(abaEscolhida = aba) {
        try {
            const resposta = await api.get('/admin/relatos', { ...cabecalhoAuth(), params: { situacao: abaEscolhida } });
            setRelatos(resposta.data);
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
        setRelatos(null);
        carregar(novaAba);
    }

    async function tratar(relato, situacao, texto) {
        try {
            await api.patch(`/admin/relatos/${relato.id}`, { situacao }, cabecalhoAuth());
            setMensagem({ texto });
            carregar();
        } catch (error) {
            setMensagem({ texto: error.response?.data || 'Não foi possível concluir a ação.', erro: true });
        }
    }

    return (
        <>
            <Cabecalho/>

            <section className="faixa-topo form-topo">
                <div className="container">
                    <Link to="/admin" className="voltar-claro"><ArrowLeft className="icon"/> Voltar para a moderação</Link>
                    <h1>Problemas <span className="marca-texto">relatados</span></h1>
                    <p>Avisos dos usuários sobre informação errada, link quebrado, conteúdo duplicado ou fora do tema. Corrija o conteúdo (editar, ocultar, pedir correção) e depois marque como resolvido.</p>
                </div>
            </section>

            <main className="mainInstituicao container">
                {mensagem?.texto && <p className={mensagem.erro ? 'mensagem erro' : 'mensagem'}>{mensagem.texto}</p>}

                <div className="titulo-lista">
                    <h2>Relatos</h2>
                    <div className="abas" role="tablist">
                        {ABAS.map((item) => (
                            <button key={item.valor} type="button" role="tab" aria-selected={aba === item.valor} className={aba === item.valor ? 'aba ativa' : 'aba'} onClick={() => trocarAba(item.valor)}>
                                {item.nome}
                            </button>
                        ))}
                    </div>
                </div>

                {!relatos && <p className="aviso">Carregando...</p>}

                {relatos?.length === 0 && (
                    <div className="vazio caixa">
                        <Inbox className="icon"/>
                        <h3>{aba === 'ABERTO' ? 'Nenhum problema esperando' : 'Nenhum relato aqui'}</h3>
                        <p>{aba === 'ABERTO' ? 'Tudo em dia! Quando alguém relatar um problema, aparece aqui.' : 'Escolha outra aba para ver mais relatos.'}</p>
                    </div>
                )}

                <ul className="linhas">
                    {relatos?.map((relato) => {
                        const { conteudo } = relato;
                        const temPagina = conteudo.situacao === 'APROVADO' || (conteudo.situacao === 'ARQUIVADO' && conteudo.publicado);
                        return (
                            <li key={relato.id} className={`moderar caixa ${CORES[relato.situacao]}`}>
                                <div className="linha-info">
                                    <div className="linha-chips">
                                        <span className="chip situacao coral"><Flag className="icon"/>{nomeMotivoRelato(relato.motivo)}</span>
                                        <span className={`chip situacao ${CORES[relato.situacao]}`}>{NOMES[relato.situacao]}</span>
                                        <span className="chip">Conteúdo: {SITUACOES[conteudo.situacao].nome}</span>
                                    </div>
                                    <h3>{conteudo.titulo}</h3>
                                    {relato.detalhe && <p className="motivo-recusa"><strong>O que a pessoa disse:</strong> {relato.detalhe}</p>}
                                    <p className="linha-datas">
                                        <span><Building2 className="icon"/>{conteudo.instituicao}</span>
                                        <span><User className="icon"/>Relatado por {relato.usuario.nome} ({relato.usuario.email})</span>
                                        <span>em {formatarData(relato.criadoEm)}</span>
                                        {relato.resolvidoPor && <span>{NOMES[relato.situacao]} por {relato.resolvidoPor} em {formatarData(relato.resolvidoEm)}</span>}
                                    </p>
                                </div>

                                <div className="moderar-acoes">
                                    {temPagina && <Link to={`/conteudo/${conteudo.id}`} className="botao-contorno botao-pequeno"><Eye className="icon"/> Ver no site</Link>}
                                    <Link to={`/admin/editar/${conteudo.id}`} className="botao-contorno botao-pequeno"><Pencil className="icon"/> Editar conteúdo</Link>
                                    {relato.situacao === 'ABERTO' ? (
                                        <>
                                            <button type="button" className="botao botao-pequeno aprovar" onClick={() => tratar(relato, 'RESOLVIDO', 'Relato marcado como resolvido.')}><Check className="icon"/> Resolvido</button>
                                            <button type="button" className="botao-contorno botao-pequeno" onClick={() => tratar(relato, 'DESCARTADO', 'Relato descartado.')}><X className="icon"/> Descartar</button>
                                        </>
                                    ) : (
                                        <button type="button" className="botao-contorno botao-pequeno" onClick={() => tratar(relato, 'ABERTO', 'Relato aberto de novo.')}><RotateCcw className="icon"/> Abrir de novo</button>
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

export default GerenciarRelatos;
