import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Hash, Plus, Pencil, Trash2, Eye, EyeOff, Check, Merge, FolderOpen } from "lucide-react";
import api from "../../../services/api.js";
import Cabecalho from "../Cabecalho/Cabecalho.jsx";
import Rodape from "../Rodape/Rodape.jsx";
import { cabecalhoAuth, usuarioLogado } from "../../utils/auth.js";
import "../Instituicao/Instituicao.css";
import "./Admin.css";

// Página do administrador para gerenciar as categorias e as tags (CU16 e RF18)
const GerenciarTags = () => {
    const navigate = useNavigate();
    const usuario = usuarioLogado();

    const [tags, setTags] = useState(null);
    const [categorias, setCategorias] = useState([]);
    const [nome, setNome] = useState('');
    const [grupo, setGrupo] = useState('');
    const [nomeCategoria, setNomeCategoria] = useState('');
    const [editando, setEditando] = useState(null); // { id, nome } da tag
    const [juntando, setJuntando] = useState(null); // { id, destinoId } da tag
    const [editandoCat, setEditandoCat] = useState(null); // { id, nome } da categoria
    const [juntandoCat, setJuntandoCat] = useState(null); // { id, destinoId } da categoria
    const [mensagem, setMensagem] = useState(null);

    async function carregar() {
        try {
            const [respostaTags, respostaCategorias] = await Promise.all([
                api.get('/admin/tags', cabecalhoAuth()),
                api.get('/admin/categorias', cabecalhoAuth()),
            ]);
            setTags(respostaTags.data);
            setCategorias(respostaCategorias.data);
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

    const categoriasAtivas = categorias.filter((categoria) => categoria.ativa);
    const grupoEscolhido = categoriasAtivas.some((categoria) => categoria.nome === grupo) ? grupo : (categoriasAtivas[0]?.nome || '');

    async function agir(acao, textoSucesso) {
        try {
            const resposta = await acao();
            setMensagem({ texto: textoSucesso || resposta.data });
            carregar();
            return true;
        } catch (error) {
            setMensagem({ texto: error.response?.data || 'Não foi possível concluir a ação.', erro: true });
            return false;
        }
    }

    // ----- Categorias -----
    async function criarCategoria(e) {
        e.preventDefault();
        const ok = await agir(() => api.post('/admin/categorias', { nome: nomeCategoria }, cabecalhoAuth()), `Categoria "${nomeCategoria.trim()}" criada.`);
        if (ok) setNomeCategoria('');
    }

    async function salvarNomeCategoria(categoria) {
        const ok = await agir(() => api.patch(`/admin/categorias/${categoria.id}`, { nome: editandoCat.nome }, cabecalhoAuth()), 'Categoria renomeada.');
        if (ok) setEditandoCat(null);
    }

    function alternarCategoria(categoria) {
        agir(
            () => api.patch(`/admin/categorias/${categoria.id}`, { ativa: !categoria.ativa }, cabecalhoAuth()),
            categoria.ativa ? `"${categoria.nome}" foi desativada: as tags dela saem das escolhas.` : `"${categoria.nome}" foi reativada.`
        );
    }

    async function juntarCategoria(categoria) {
        const destino = categorias.find((item) => item.id === Number(juntandoCat.destinoId));
        if (!destino) return;
        const confirmou = window.confirm(
            `Juntar "${categoria.nome}" com "${destino.nome}"?\n\n` +
            `As ${categoria.tags} tags de "${categoria.nome}" passam para "${destino.nome}", e "${categoria.nome}" é apagada.`
        );
        if (!confirmou) return;
        const ok = await agir(() => api.post(`/admin/categorias/${categoria.id}/juntar`, { destinoId: destino.id }, cabecalhoAuth()));
        if (ok) setJuntandoCat(null);
    }

    function excluirCategoria(categoria) {
        if (!window.confirm(`Excluir a categoria "${categoria.nome}"?`)) return;
        agir(() => api.delete(`/admin/categorias/${categoria.id}`, cabecalhoAuth()), `"${categoria.nome}" foi excluída.`);
    }

    // ----- Tags -----
    async function criar(e) {
        e.preventDefault();
        const ok = await agir(() => api.post('/admin/tags', { nome, grupo: grupoEscolhido }, cabecalhoAuth()), `Tag #${nome.trim()} criada.`);
        if (ok) setNome('');
    }

    async function salvarNome(tag) {
        const ok = await agir(() => api.patch(`/admin/tags/${tag.id}`, { nome: editando.nome }, cabecalhoAuth()), 'Tag renomeada.');
        if (ok) setEditando(null);
    }

    function trocarCategoria(tag, novoGrupo) {
        agir(() => api.patch(`/admin/tags/${tag.id}`, { grupo: novoGrupo }, cabecalhoAuth()), `#${tag.nome} agora está em "${novoGrupo}".`);
    }

    function alternarAtiva(tag) {
        agir(
            () => api.patch(`/admin/tags/${tag.id}`, { ativa: !tag.ativa }, cabecalhoAuth()),
            tag.ativa ? `#${tag.nome} foi desativada e não aparece mais nas escolhas.` : `#${tag.nome} foi reativada.`
        );
    }

    // Juntar tag repetida: quem usava esta passa a usar a outra, e esta é apagada
    async function juntar(tag) {
        const destino = tags.find((item) => item.id === Number(juntando.destinoId));
        if (!destino) return;
        const confirmou = window.confirm(
            `Juntar #${tag.nome} com #${destino.nome}?\n\n` +
            `Os ${tag.conteudos} conteúdos e as ${tag.pessoas} pessoas de #${tag.nome} passam para #${destino.nome}, ` +
            `e #${tag.nome} é apagada. Isso não pode ser desfeito.`
        );
        if (!confirmou) return;
        const ok = await agir(() => api.post(`/admin/tags/${tag.id}/juntar`, { destinoId: destino.id }, cabecalhoAuth()));
        if (ok) setJuntando(null);
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
                    <p>As tags ficam separadas em categorias e aparecem na busca, no perfil das pessoas e no cadastro de eventos. O que está em uso não pode ser excluído: desative ou junte com outro.</p>
                </div>
            </section>

            <main className="mainInstituicao container">
                {mensagem?.texto && <p className={mensagem.erro ? 'mensagem erro' : 'mensagem'}>{mensagem.texto}</p>}

                {/* Categorias (RF18) */}
                <section className="grupo-admin">
                    <h2>Categorias <small>({categorias.length})</small></h2>
                    <form onSubmit={criarCategoria} className="nova-categoria">
                        <label className="campo-rotulado">
                            <span className="rotulo">Nova categoria</span>
                            <input className="campo" value={nomeCategoria} maxLength={40} onChange={(e) => setNomeCategoria(e.target.value)} placeholder="Ex.: Público"/>
                        </label>
                        <button type="submit" className="botao-azul" disabled={nomeCategoria.trim().length < 2}><Plus className="icon"/> Criar categoria</button>
                    </form>
                    <ul className="tabela-tags caixa">
                        {categorias.map((categoria) => (
                            <li key={categoria.id} className={categoria.ativa ? 'tag-linha' : 'tag-linha desativada'}>
                                {editandoCat?.id === categoria.id ? (
                                    <span className="tag-nome-edicao">
                                        <input className="campo" value={editandoCat.nome} maxLength={40} onChange={(e) => setEditandoCat({ ...editandoCat, nome: e.target.value })} aria-label="Novo nome da categoria"/>
                                        <button type="button" className="botao-azul botao-pequeno" onClick={() => salvarNomeCategoria(categoria)}><Check className="icon"/> Salvar</button>
                                        <button type="button" className="botao-contorno botao-pequeno" onClick={() => setEditandoCat(null)}>Cancelar</button>
                                    </span>
                                ) : juntandoCat?.id === categoria.id ? (
                                    <span className="tag-nome-edicao">
                                        <span className="juntar-rotulo">Juntar <strong>{categoria.nome}</strong> com</span>
                                        <select className="campo" value={juntandoCat.destinoId} onChange={(e) => setJuntandoCat({ ...juntandoCat, destinoId: e.target.value })} aria-label={`Categoria que vai ficar no lugar de ${categoria.nome}`}>
                                            <option value="">Escolha a categoria que fica</option>
                                            {categorias.filter((item) => item.id !== categoria.id).map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                                        </select>
                                        <button type="button" className="botao-azul botao-pequeno" disabled={!juntandoCat.destinoId} onClick={() => juntarCategoria(categoria)}><Merge className="icon"/> Juntar</button>
                                        <button type="button" className="botao-contorno botao-pequeno" onClick={() => setJuntandoCat(null)}>Cancelar</button>
                                    </span>
                                ) : (
                                    <span className="tag-nome">
                                        <FolderOpen className="icon"/>{categoria.nome}
                                        {!categoria.ativa && <span className="chip">Desativada</span>}
                                    </span>
                                )}

                                <span className="tag-uso">{categoria.tags} tags</span>

                                <span className="tag-acoes">
                                    <button type="button" className="icone-botao" onClick={() => { setJuntandoCat(null); setEditandoCat({ id: categoria.id, nome: categoria.nome }); }} aria-label={`Renomear ${categoria.nome}`} title="Renomear"><Pencil className="icon"/></button>
                                    <button type="button" className="icone-botao" disabled={categorias.length < 2} onClick={() => { setEditandoCat(null); setJuntandoCat({ id: categoria.id, destinoId: '' }); }} aria-label={`Juntar ${categoria.nome} com outra categoria`} title="Juntar com outra categoria"><Merge className="icon"/></button>
                                    <button type="button" className="icone-botao" onClick={() => alternarCategoria(categoria)} aria-label={categoria.ativa ? `Desativar ${categoria.nome}` : `Reativar ${categoria.nome}`} title={categoria.ativa ? 'Desativar' : 'Reativar'}>
                                        {categoria.ativa ? <EyeOff className="icon"/> : <Eye className="icon"/>}
                                    </button>
                                    <button
                                        type="button"
                                        className="icone-botao perigo"
                                        onClick={() => excluirCategoria(categoria)}
                                        disabled={categoria.tags > 0}
                                        aria-label={`Excluir ${categoria.nome}`}
                                        title={categoria.tags > 0 ? 'Tem tags: junte com outra ou desative' : 'Excluir'}
                                    >
                                        <Trash2 className="icon"/>
                                    </button>
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>

                <form onSubmit={criar} className="nova-tag caixa">
                    <h2><Plus className="icon"/> Nova tag</h2>
                    <div className="nova-tag-campos">
                        <label className="campo-rotulado">
                            <span className="rotulo">Nome</span>
                            <input className="campo" value={nome} maxLength={40} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Astronomia"/>
                        </label>
                        <label className="campo-rotulado">
                            <span className="rotulo">Categoria</span>
                            <select className="campo" value={grupoEscolhido} onChange={(e) => setGrupo(e.target.value)}>
                                {categoriasAtivas.map((item) => <option key={item.id}>{item.nome}</option>)}
                            </select>
                        </label>
                        <button type="submit" className="botao-azul" disabled={nome.trim().length < 2 || !grupoEscolhido}><Plus className="icon"/> Criar</button>
                    </div>
                </form>

                {!tags && <p className="aviso">Carregando...</p>}

                {tags && categorias.map((categoria) => {
                    const doGrupo = tags.filter((tag) => tag.grupo === categoria.nome);
                    if (doGrupo.length === 0) return null;

                    return (
                        <section key={categoria.id} className="grupo-admin">
                            <h2>{categoria.nome} <small>({doGrupo.length}{!categoria.ativa && ', categoria desativada'})</small></h2>
                            <ul className="tabela-tags caixa">
                                {doGrupo.map((tag) => (
                                    <li key={tag.id} className={tag.ativa && categoria.ativa ? 'tag-linha' : 'tag-linha desativada'}>
                                        {editando?.id === tag.id ? (
                                            <span className="tag-nome-edicao">
                                                <input className="campo" value={editando.nome} maxLength={40} onChange={(e) => setEditando({ ...editando, nome: e.target.value })} aria-label="Novo nome da tag"/>
                                                <button type="button" className="botao-azul botao-pequeno" onClick={() => salvarNome(tag)}><Check className="icon"/> Salvar</button>
                                                <button type="button" className="botao-contorno botao-pequeno" onClick={() => setEditando(null)}>Cancelar</button>
                                            </span>
                                        ) : juntando?.id === tag.id ? (
                                            <span className="tag-nome-edicao">
                                                <span className="juntar-rotulo">Juntar <strong>#{tag.nome}</strong> com</span>
                                                <select className="campo" value={juntando.destinoId} onChange={(e) => setJuntando({ ...juntando, destinoId: e.target.value })} aria-label={`Tag que vai ficar no lugar de #${tag.nome}`}>
                                                    <option value="">Escolha a tag que fica</option>
                                                    {tags.filter((item) => item.id !== tag.id && item.ativa).map((item) => <option key={item.id} value={item.id}>#{item.nome} ({item.grupo})</option>)}
                                                </select>
                                                <button type="button" className="botao-azul botao-pequeno" disabled={!juntando.destinoId} onClick={() => juntar(tag)}><Merge className="icon"/> Juntar</button>
                                                <button type="button" className="botao-contorno botao-pequeno" onClick={() => setJuntando(null)}>Cancelar</button>
                                            </span>
                                        ) : (
                                            <span className="tag-nome">
                                                <Hash className="icon"/>{tag.nome}
                                                {!tag.ativa && <span className="chip">Desativada</span>}
                                            </span>
                                        )}

                                        <span className="tag-uso">{tag.conteudos} conteúdos · {tag.pessoas} pessoas</span>

                                        <span className="tag-acoes">
                                            <select className="campo campo-categoria" value={tag.grupo} onChange={(e) => trocarCategoria(tag, e.target.value)} aria-label={`Categoria de #${tag.nome}`} title="Mudar de categoria">
                                                {categorias.map((item) => <option key={item.id} value={item.nome} disabled={!item.ativa && item.nome !== tag.grupo}>{item.nome}</option>)}
                                            </select>
                                            <button type="button" className="icone-botao" onClick={() => { setJuntando(null); setEditando({ id: tag.id, nome: tag.nome }); }} aria-label={`Renomear #${tag.nome}`} title="Renomear"><Pencil className="icon"/></button>
                                            <button type="button" className="icone-botao" onClick={() => { setEditando(null); setJuntando({ id: tag.id, destinoId: '' }); }} aria-label={`Juntar #${tag.nome} com outra tag`} title="Juntar com outra tag (repetida)"><Merge className="icon"/></button>
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
