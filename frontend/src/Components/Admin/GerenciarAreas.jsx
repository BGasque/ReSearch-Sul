import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, BookOpen, Plus, Pencil, Trash2, Check, Merge, Eye, EyeOff } from "lucide-react";
import api from "../../../services/api.js";
import Cabecalho from "../Cabecalho/Cabecalho.jsx";
import Rodape from "../Rodape/Rodape.jsx";
import { cabecalhoAuth, usuarioLogado } from "../../utils/auth.js";
import "../Instituicao/Instituicao.css";
import "./Admin.css";

// Página do administrador para criar, renomear, juntar, desativar e excluir áreas do conhecimento (CU16 e RF18)
const GerenciarAreas = () => {
    const navigate = useNavigate();
    const usuario = usuarioLogado();

    const [areas, setAreas] = useState(null);
    const [nome, setNome] = useState('');
    const [editando, setEditando] = useState(null); // { id, nome }
    const [juntando, setJuntando] = useState(null); // { id, destinoId }
    const [mensagem, setMensagem] = useState(null);

    async function carregar() {
        try {
            const resposta = await api.get('/admin/areas', cabecalhoAuth());
            setAreas(resposta.data);
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
            const resposta = await acao();
            setMensagem({ texto: textoSucesso || resposta.data });
            carregar();
            return true;
        } catch (error) {
            setMensagem({ texto: error.response?.data || 'Não foi possível concluir a ação.', erro: true });
            return false;
        }
    }

    async function criar(e) {
        e.preventDefault();
        const ok = await agir(() => api.post('/admin/areas', { nome }, cabecalhoAuth()), `Área "${nome.trim()}" criada.`);
        if (ok) setNome('');
    }

    async function salvarNome(area) {
        const ok = await agir(() => api.patch(`/admin/areas/${area.id}`, { nome: editando.nome }, cabecalhoAuth()), 'Área renomeada.');
        if (ok) setEditando(null);
    }

    async function juntar(area) {
        const destino = areas.find((item) => item.id === Number(juntando.destinoId));
        if (!destino) return;
        const confirmou = window.confirm(
            `Juntar "${area.nome}" com "${destino.nome}"?\n\n` +
            `Os ${area.conteudos} conteúdos e as ${area.pessoas} pessoas de "${area.nome}" passam para "${destino.nome}", ` +
            `e "${area.nome}" é apagada. Isso não pode ser desfeito.`
        );
        if (!confirmou) return;
        const ok = await agir(() => api.post(`/admin/areas/${area.id}/juntar`, { destinoId: destino.id }, cabecalhoAuth()));
        if (ok) setJuntando(null);
    }

    function alternarAtiva(area) {
        agir(
            () => api.patch(`/admin/areas/${area.id}`, { ativa: !area.ativa }, cabecalhoAuth()),
            area.ativa ? `"${area.nome}" foi desativada e não aparece mais nas escolhas.` : `"${area.nome}" foi reativada.`
        );
    }

    function excluir(area) {
        if (!window.confirm(`Excluir a área "${area.nome}"?`)) return;
        agir(() => api.delete(`/admin/areas/${area.id}`, cabecalhoAuth()), `"${area.nome}" foi excluída.`);
    }

    return (
        <>
            <Cabecalho/>

            <section className="faixa-topo form-topo">
                <div className="container">
                    <Link to="/admin" className="voltar-claro"><ArrowLeft className="icon"/> Voltar para a moderação</Link>
                    <h1>Áreas do <span className="marca-texto">conhecimento</span></h1>
                    <p>As áreas aparecem no filtro do catálogo, nos interesses das pessoas e no cadastro de eventos. Área em uso não pode ser excluída: desative ou junte com outra.</p>
                </div>
            </section>

            <main className="mainInstituicao container">
                <form onSubmit={criar} className="nova-tag caixa">
                    <h2><Plus className="icon"/> Nova área</h2>
                    <div className="nova-area-campos">
                        <label className="campo-rotulado">
                            <span className="rotulo">Nome</span>
                            <input className="campo" value={nome} maxLength={60} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Ciências Agrárias"/>
                        </label>
                        <button type="submit" className="botao-azul" disabled={nome.trim().length < 2}><Plus className="icon"/> Criar</button>
                    </div>
                </form>

                {mensagem?.texto && <p className={mensagem.erro ? 'mensagem erro' : 'mensagem'}>{mensagem.texto}</p>}

                {!areas && <p className="aviso">Carregando...</p>}

                {areas && (
                    <section className="grupo-admin">
                        <h2>Áreas <small>({areas.length})</small></h2>
                        <ul className="tabela-tags caixa">
                            {areas.map((area) => {
                                const emUso = area.conteudos > 0 || area.pessoas > 0;
                                return (
                                    <li key={area.id} className={area.ativa ? 'tag-linha' : 'tag-linha desativada'}>
                                        {editando?.id === area.id ? (
                                            <span className="tag-nome-edicao">
                                                <input className="campo" value={editando.nome} maxLength={60} onChange={(e) => setEditando({ ...editando, nome: e.target.value })} aria-label="Novo nome da área"/>
                                                <button type="button" className="botao-azul botao-pequeno" onClick={() => salvarNome(area)}><Check className="icon"/> Salvar</button>
                                                <button type="button" className="botao-contorno botao-pequeno" onClick={() => setEditando(null)}>Cancelar</button>
                                            </span>
                                        ) : juntando?.id === area.id ? (
                                            <span className="tag-nome-edicao">
                                                <span className="juntar-rotulo">Juntar <strong>{area.nome}</strong> com</span>
                                                <select className="campo" value={juntando.destinoId} onChange={(e) => setJuntando({ ...juntando, destinoId: e.target.value })} aria-label={`Área que vai ficar no lugar de ${area.nome}`}>
                                                    <option value="">Escolha a área que fica</option>
                                                    {areas.filter((item) => item.id !== area.id).map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                                                </select>
                                                <button type="button" className="botao-azul botao-pequeno" disabled={!juntando.destinoId} onClick={() => juntar(area)}><Merge className="icon"/> Juntar</button>
                                                <button type="button" className="botao-contorno botao-pequeno" onClick={() => setJuntando(null)}>Cancelar</button>
                                            </span>
                                        ) : (
                                            <span className="tag-nome"><BookOpen className="icon"/>{area.nome}{!area.ativa && <span className="chip">Desativada</span>}</span>
                                        )}

                                        <span className="tag-uso">{area.conteudos} conteúdos · {area.pessoas} pessoas</span>

                                        <span className="tag-acoes">
                                            <button type="button" className="icone-botao" onClick={() => { setJuntando(null); setEditando({ id: area.id, nome: area.nome }); }} aria-label={`Renomear ${area.nome}`} title="Renomear"><Pencil className="icon"/></button>
                                            <button type="button" className="icone-botao" disabled={areas.length < 2} onClick={() => { setEditando(null); setJuntando({ id: area.id, destinoId: '' }); }} aria-label={`Juntar ${area.nome} com outra área`} title="Juntar com outra área"><Merge className="icon"/></button>
                                            <button type="button" className="icone-botao" onClick={() => alternarAtiva(area)} aria-label={area.ativa ? `Desativar ${area.nome}` : `Reativar ${area.nome}`} title={area.ativa ? 'Desativar' : 'Reativar'}>
                                                {area.ativa ? <EyeOff className="icon"/> : <Eye className="icon"/>}
                                            </button>
                                            <button
                                                type="button"
                                                className="icone-botao perigo"
                                                onClick={() => excluir(area)}
                                                disabled={emUso}
                                                aria-label={`Excluir ${area.nome}`}
                                                title={emUso ? 'Em uso: desative ou junte com outra área em vez de excluir' : 'Excluir'}
                                            >
                                                <Trash2 className="icon"/>
                                            </button>
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                )}
            </main>

            <Rodape/>
        </>
    );
};

export default GerenciarAreas;
