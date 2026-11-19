import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Search, BadgeCheck, Lock, LockOpen, Pencil, Trash2, Check, Users } from "lucide-react";
import api from "../../../services/api.js";
import Cabecalho from "../Cabecalho/Cabecalho.jsx";
import Rodape from "../Rodape/Rodape.jsx";
import { cabecalhoAuth, usuarioLogado, formatarData } from "../../utils/auth.js";
import "../Instituicao/Instituicao.css";
import "./Admin.css";

const NOMES_TIPO = { PESSOA: 'Pessoa', INSTITUICAO: 'Instituição', ADMIN: 'Administrador' };

const ABAS = [
    { valor: '', texto: 'Todas' },
    { valor: 'aguardando', texto: 'Aguardando verificação' },
    { valor: 'bloqueados', texto: 'Bloqueadas' },
];

// Página do administrador para gerenciar as contas de pessoas e instituições (CU15)
const GerenciarUsuarios = () => {
    const navigate = useNavigate();
    const usuario = usuarioLogado();

    const [contas, setContas] = useState(null);
    const [busca, setBusca] = useState('');
    const [tipo, setTipo] = useState('');
    const [situacao, setSituacao] = useState('');
    const [editando, setEditando] = useState(null); // { id, nome, email }
    const [mensagem, setMensagem] = useState(null);

    async function carregar(filtros = { busca, tipo, situacao }) {
        try {
            const resposta = await api.get('/admin/usuarios', { ...cabecalhoAuth(), params: filtros });
            setContas(resposta.data);
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) navigate('/login');
            else setMensagem({ texto: error.response?.data || 'Não foi possível carregar as contas.', erro: true });
        }
    }

    useEffect(() => {
        if (usuario?.tipo !== 'ADMIN') {
            navigate(usuario ? '/' : '/login');
            return;
        }
        carregar();
    }, []);

    function trocarAba(valor) {
        setSituacao(valor);
        carregar({ busca, tipo, situacao: valor });
    }

    function trocarTipo(valor) {
        setTipo(valor);
        carregar({ busca, tipo: valor, situacao });
    }

    function buscar(e) {
        e.preventDefault();
        carregar();
    }

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

    const mudar = (conta, dados, texto) => agir(() => api.patch(`/admin/usuarios/${conta.id}`, dados, cabecalhoAuth()), texto);

    function trocarTipoDaConta(conta, novoTipo) {
        if (!window.confirm(`Mudar "${conta.nome}" para ${NOMES_TIPO[novoTipo]}?`)) return;
        mudar(conta, { tipo: novoTipo }, `${conta.nome} agora é ${NOMES_TIPO[novoTipo]}.`);
    }

    function alternarBloqueio(conta) {
        if (!conta.bloqueado && !window.confirm(`Bloquear "${conta.nome}"?\n\nA conta não vai conseguir entrar até você desbloquear.`)) return;
        mudar(conta, { bloqueado: !conta.bloqueado }, conta.bloqueado ? `${conta.nome} foi desbloqueada.` : `${conta.nome} foi bloqueada.`);
    }

    function alternarVerificacao(conta) {
        mudar(conta, { verificado: !conta.verificado },
            conta.verificado ? `${conta.nome} voltou a aguardar verificação.` : `${conta.nome} foi verificada e já pode cadastrar conteúdos.`);
    }

    async function salvarEdicao(conta) {
        const ok = await mudar(conta, { nome: editando.nome, email: editando.email }, 'Dados da conta atualizados.');
        if (ok) setEditando(null);
    }

    function excluir(conta) {
        const extra = conta.conteudos > 0 ? `\nOs ${conta.conteudos} conteúdos dela também serão apagados.` : '';
        if (!window.confirm(`Apagar a conta "${conta.nome}" para sempre?${extra}\n\nIsso não pode ser desfeito.`)) return;
        agir(() => api.delete(`/admin/usuarios/${conta.id}`, cabecalhoAuth()), `A conta de ${conta.nome} foi apagada.`);
    }

    return (
        <>
            <Cabecalho/>

            <section className="faixa-topo form-topo">
                <div className="container">
                    <Link to="/admin" className="voltar-claro"><ArrowLeft className="icon"/> Voltar para a moderação</Link>
                    <h1>Usuários e <span className="marca-texto">instituições</span></h1>
                    <p>Verifique instituições novas, corrija dados, bloqueie ou apague contas. Instituição só cadastra conteúdos depois de verificada.</p>
                </div>
            </section>

            <main className="mainInstituicao container">
                <form onSubmit={buscar} className="filtro-contas caixa">
                    <label className="campo-rotulado">
                        <span className="rotulo">Buscar por nome ou e-mail</span>
                        <input className="campo" value={busca} maxLength={120} onChange={(e) => setBusca(e.target.value)} placeholder="Ex.: IFRS"/>
                    </label>
                    <label className="campo-rotulado">
                        <span className="rotulo">Tipo de conta</span>
                        <select className="campo" value={tipo} onChange={(e) => trocarTipo(e.target.value)}>
                            <option value="">Todos</option>
                            {Object.entries(NOMES_TIPO).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
                        </select>
                    </label>
                    <button type="submit" className="botao-azul"><Search className="icon"/> Buscar</button>
                </form>

                {mensagem?.texto && <p className={mensagem.erro ? 'mensagem erro' : 'mensagem'}>{mensagem.texto}</p>}

                <div className="titulo-lista">
                    <h2>Contas {contas && <small>({contas.length})</small>}</h2>
                    <div className="abas" role="tablist">
                        {ABAS.map((item) => (
                            <button key={item.valor} type="button" role="tab" aria-selected={situacao === item.valor} className={situacao === item.valor ? 'aba ativa' : 'aba'} onClick={() => trocarAba(item.valor)}>
                                {item.texto}
                            </button>
                        ))}
                    </div>
                </div>

                {!contas && <p className="aviso">Carregando...</p>}

                {contas?.length === 0 && (
                    <div className="vazio caixa">
                        <Users className="icon"/>
                        <h3>Nenhuma conta aqui</h3>
                        <p>Tente outra busca ou outra aba.</p>
                    </div>
                )}

                {contas?.length > 0 && (
                    <ul className="lista-contas caixa">
                        {contas.map((conta) => {
                            const voce = conta.id === usuario?.id;
                            return (
                                <li key={conta.id} className={conta.bloqueado ? 'conta-linha bloqueada' : 'conta-linha'}>
                                    <div className="conta-dados">
                                        {editando?.id === conta.id ? (
                                            <span className="conta-edicao">
                                                <input className="campo" value={editando.nome} maxLength={120} onChange={(e) => setEditando({ ...editando, nome: e.target.value })} aria-label="Nome"/>
                                                <input className="campo" type="email" value={editando.email} maxLength={254} onChange={(e) => setEditando({ ...editando, email: e.target.value })} aria-label="E-mail"/>
                                                <button type="button" className="botao-azul botao-pequeno" onClick={() => salvarEdicao(conta)}><Check className="icon"/> Salvar</button>
                                                <button type="button" className="botao-contorno botao-pequeno" onClick={() => setEditando(null)}>Cancelar</button>
                                            </span>
                                        ) : (
                                            <>
                                                <strong className="conta-nome">{conta.nome}{voce && ' (você)'}</strong>
                                                <span className="conta-email">{conta.email}</span>
                                            </>
                                        )}
                                        <span className="conta-chips">
                                            <span className="chip">{NOMES_TIPO[conta.tipo]}</span>
                                            {conta.tipo === 'INSTITUICAO' && (conta.verificado
                                                ? <span className="chip situacao verde">Verificada</span>
                                                : <span className="chip situacao amarelo">Aguardando verificação</span>)}
                                            {conta.bloqueado && <span className="chip situacao coral">Bloqueada</span>}
                                        </span>
                                        <span className="conta-info">
                                            Desde {formatarData(conta.criadoEm)}
                                            {conta.tipo === 'INSTITUICAO' && ` · ${conta.conteudos} conteúdos`}
                                            {` · ${conta.favoritos} favoritos`}
                                        </span>
                                    </div>

                                    <div className="conta-acoes">
                                        {conta.tipo === 'INSTITUICAO' && (
                                            <button type="button" className={conta.verificado ? 'botao-contorno botao-pequeno' : 'botao-azul botao-pequeno'} onClick={() => alternarVerificacao(conta)}>
                                                <BadgeCheck className="icon"/> {conta.verificado ? 'Tirar verificação' : 'Verificar'}
                                            </button>
                                        )}
                                        <select className="campo campo-pequeno" value={conta.tipo} disabled={voce} onChange={(e) => trocarTipoDaConta(conta, e.target.value)} aria-label={`Tipo da conta de ${conta.nome}`}>
                                            {Object.entries(NOMES_TIPO).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
                                        </select>
                                        <button type="button" className="icone-botao" onClick={() => setEditando({ id: conta.id, nome: conta.nome, email: conta.email })} aria-label={`Editar ${conta.nome}`} title="Corrigir nome ou e-mail"><Pencil className="icon"/></button>
                                        <button type="button" className="icone-botao" disabled={voce} onClick={() => alternarBloqueio(conta)} aria-label={conta.bloqueado ? `Desbloquear ${conta.nome}` : `Bloquear ${conta.nome}`} title={conta.bloqueado ? 'Desbloquear' : 'Bloquear'}>
                                            {conta.bloqueado ? <LockOpen className="icon"/> : <Lock className="icon"/>}
                                        </button>
                                        <button type="button" className="icone-botao perigo" disabled={voce} onClick={() => excluir(conta)} aria-label={`Apagar ${conta.nome}`} title="Apagar conta"><Trash2 className="icon"/></button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </main>

            <Rodape/>
        </>
    );
};

export default GerenciarUsuarios;
