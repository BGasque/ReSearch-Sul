import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Hash, Plus, Pencil, Trash2, Eye, EyeOff, Check } from "lucide-react";
import api from "../../../services/api.js";
import Cabecalho from "../Cabecalho/Cabecalho.jsx";
import Rodape from "../Rodape/Rodape.jsx";
import { cabecalhoAuth, usuarioLogado } from "../../utils/auth.js";
import "../Instituicao/Instituicao.css";
import "./Admin.css";

const GRUPOS = ['Eixo', 'Nível de ensino', 'Formato', 'Tema'];

// Página do administrador para criar, renomear, desativar e excluir tags (CU16)
const GerenciarTags = () => {
    const navigate = useNavigate();
    const usuario = usuarioLogado();

    const [tags, setTags] = useState(null);
    const [nome, setNome] = useState('');
    const [grupo, setGrupo] = useState('Tema');
    const [editando, setEditando] = useState(null); // { id, nome }
    const [mensagem, setMensagem] = useState(null);

    async function carregar() {
        try {
            const resposta = await api.get('/admin/tags', cabecalhoAuth());
            setTags(resposta.data);
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

    async function agir(acao, textoSucesso) {
        try {
            await acao();
            setMensagem({ texto: textoSucesso });
            carregar();
            return true;
        } catch (error) {
            setMensagem({ texto: error.response?.data || 'Não foi possível concluir a ação.', erro: true });
            return false;
        }
    }

    async function criar(e) {
        e.preventDefault();
        const ok = await agir(() => api.post('/admin/tags', { nome, grupo }, cabecalhoAuth()), `Tag #${nome.trim()} criada.`);
        if (ok) setNome('');
    }

    async function salvarNome(tag) {
        const ok = await agir(() => api.patch(`/admin/tags/${tag.id}`, { nome: editando.nome }, cabecalhoAuth()), 'Tag renomeada.');
        if (ok) setEditando(null);
    }

    function alternarAtiva(tag) {
        agir(
            () => api.patch(`/admin/tags/${tag.id}`, { ativa: !tag.ativa }, cabecalhoAuth()),
            tag.ativa ? `#${tag.nome} foi desativada e não aparece mais nas escolhas.` : `#${tag.nome} foi reativada.`
        );
    }

    function excluir(tag) {
        if (!window.confirm(`Excluir a tag #${tag.nome}?`)) return;
        agir(() => api.delete(`/admin/tags/${tag.id}`, cabecalhoAuth()), `#${tag.nome} foi excluída.`);
    }

    return (
        <>
            <Cabecalho/>

            <section className="faixa-topo form-topo">
                <div className="container">
                    <Link to="/admin" className="voltar-claro"><ArrowLeft className="icon"/> Voltar para a moderação</Link>
                    <h1>Gerenciar <span className="marca-texto">tags</span></h1>
                    <p>As tags aparecem na busca, no perfil das pessoas e no cadastro de eventos. Tag em uso não pode ser excluída: desative.</p>
                </div>
            </section>

            <main className="mainInstituicao container">
                <form onSubmit={criar} className="nova-tag caixa">
                    <h2><Plus className="icon"/> Nova tag</h2>
                    <div className="nova-tag-campos">
                        <label className="campo-rotulado">
                            <span className="rotulo">Nome</span>
                            <input className="campo" value={nome} maxLength={40} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Astronomia"/>
                        </label>
                        <label className="campo-rotulado">
                            <span className="rotulo">Grupo</span>
                            <select className="campo" value={grupo} onChange={(e) => setGrupo(e.target.value)}>
                                {GRUPOS.map((item) => <option key={item}>{item}</option>)}
                            </select>
                        </label>
                        <button type="submit" className="botao-azul" disabled={nome.trim().length < 2}><Plus className="icon"/> Criar</button>
                    </div>
                </form>

                {mensagem?.texto && <p className={mensagem.erro ? 'mensagem erro' : 'mensagem'}>{mensagem.texto}</p>}

                {!tags && <p className="aviso">Carregando...</p>}

                {tags && GRUPOS.map((grupoAtual) => {
                    const doGrupo = tags.filter((tag) => tag.grupo === grupoAtual);
                    if (doGrupo.length === 0) return null;

                    return (
                        <section key={grupoAtual} className="grupo-admin">
                            <h2>{grupoAtual} <small>({doGrupo.length})</small></h2>
                            <ul className="tabela-tags caixa">
                                {doGrupo.map((tag) => (
                                    <li key={tag.id} className={tag.ativa ? 'tag-linha' : 'tag-linha desativada'}>
                                        {editando?.id === tag.id ? (
                                            <span className="tag-nome-edicao">
                                                <input className="campo" value={editando.nome} maxLength={40} onChange={(e) => setEditando({ ...editando, nome: e.target.value })} aria-label="Novo nome da tag"/>
                                                <button type="button" className="botao-azul botao-pequeno" onClick={() => salvarNome(tag)}><Check className="icon"/> Salvar</button>
                                                <button type="button" className="botao-contorno botao-pequeno" onClick={() => setEditando(null)}>Cancelar</button>
                                            </span>
                                        ) : (
                                            <span className="tag-nome">
                                                <Hash className="icon"/>{tag.nome}
                                                {!tag.ativa && <span className="chip">Desativada</span>}
                                            </span>
                                        )}

                                        <span className="tag-uso">{tag.conteudos} conteúdos · {tag.pessoas} pessoas</span>

                                        <span className="tag-acoes">
                                            <button type="button" className="icone-botao" onClick={() => setEditando({ id: tag.id, nome: tag.nome })} aria-label={`Renomear #${tag.nome}`} title="Renomear"><Pencil className="icon"/></button>
                                            <button type="button" className="icone-botao" onClick={() => alternarAtiva(tag)} aria-label={tag.ativa ? `Desativar #${tag.nome}` : `Reativar #${tag.nome}`} title={tag.ativa ? 'Desativar' : 'Reativar'}>
                                                {tag.ativa ? <EyeOff className="icon"/> : <Eye className="icon"/>}
                                            </button>
                                            <button
                                                type="button"
                                                className="icone-botao perigo"
                                                onClick={() => excluir(tag)}
                                                disabled={tag.conteudos > 0 || tag.pessoas > 0}
                                                aria-label={`Excluir #${tag.nome}`}
                                                title={tag.conteudos > 0 || tag.pessoas > 0 ? 'Em uso: desative em vez de excluir' : 'Excluir'}
                                            >
                                                <Trash2 className="icon"/>
                                            </button>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    );
                })}
            </main>

            <Rodape/>
        </>
    );
};

export default GerenciarTags;
