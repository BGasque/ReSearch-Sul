import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, CalendarDays, BookOpen, Send, Info, Eye } from "lucide-react";
import api from "../../../services/api.js";
import Cabecalho from "../Cabecalho/Cabecalho.jsx";
import Rodape from "../Rodape/Rodape.jsx";
import Cartao from "../Cartao/Cartao.jsx";
import SeletorTags from "../Tags/SeletorTags.jsx";
import { cabecalhoAuth, usuarioLogado } from "../../utils/auth.js";
import "./Instituicao.css";

const VAZIO = {
    tipo: 'EVENTO',
    titulo: '',
    descricao: '',
    estado: '',
    local: '',
    autoria: '',
    dataInicio: '',
    dataFim: '',
    prazo: '',
    linkOficial: '',
    areas: [],
    tags: [],
};

const MAX_AREAS = 4;
const MAX_TAGS = 8;

// Data do banco (2027-05-10T00:00:00.000Z) para o campo de data (2027-05-10)
const paraCampo = (data) => (data ? data.slice(0, 10) : '');

// Formulário para cadastrar (/instituicao/novo) ou editar (/instituicao/editar/:id) um conteúdo.
// Com modo="admin", o administrador edita conteúdo de qualquer instituição (/admin/editar/:id).
const FormConteudo = ({ modo = 'instituicao' }) => {
    const { id } = useParams();
    const editando = Boolean(id);
    const ehAdmin = modo === 'admin';
    const navigate = useNavigate();
    const usuario = usuarioLogado();

    // Endereços mudam conforme quem está usando
    const rotaApi = ehAdmin ? '/admin/conteudos' : '/instituicao/conteudos';
    const paginaVoltar = ehAdmin ? '/admin' : '/instituicao';

    const [form, setForm] = useState(VAZIO);
    const [areas, setAreas] = useState([]);
    const [tags, setTags] = useState([]);
    // Nome da instituição dona do conteúdo (para a prévia)
    const [nomeInstituicao, setNomeInstituicao] = useState(usuario?.nome);
    const [erro, setErro] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [carregando, setCarregando] = useState(editando);

    useEffect(() => {
        if (usuario?.tipo !== (ehAdmin ? 'ADMIN' : 'INSTITUICAO')) {
            navigate(usuario ? '/' : '/login');
            return;
        }

        api.get('/areas').then((resposta) => setAreas(resposta.data));

        const carregarTags = api.get('/tags').then((resposta) => resposta.data);
        if (!editando) {
            carregarTags.then(setTags);
            return;
        }

        // Na edição, preenche o formulário com os dados atuais
        Promise.all([carregarTags, api.get(`${rotaApi}/${id}`, cabecalhoAuth())])
            .then(([listaTags, { data }]) => {
                if (data.instituicao) setNomeInstituicao(data.instituicao.nome);

                // Tags que o admin desativou continuam aparecendo, para não sumirem da edição
                const desativadas = data.tags.filter((tag) => !listaTags.some((t) => t.id === tag.id));
                setTags([...listaTags, ...desativadas.map((tag) => ({ ...tag, grupo: 'Tema' }))]);

                setForm({
                    tipo: data.tipo,
                    titulo: data.titulo,
                    descricao: data.descricao,
                    estado: data.estado,
                    local: data.local || '',
                    autoria: data.autoria || '',
                    dataInicio: paraCampo(data.dataInicio),
                    dataFim: paraCampo(data.dataFim),
                    prazo: paraCampo(data.prazo),
                    linkOficial: data.linkOficial,
                    areas: data.areas.map((area) => area.id),
                    tags: data.tags.map((tag) => tag.id),
                });
            })
            .catch(() => setErro(ehAdmin ? 'Conteúdo não encontrado.' : 'Conteúdo não encontrado na sua instituição.'))
            .finally(() => setCarregando(false));
    }, [id]);

    // Atualiza um campo do formulário
    function mudar(campo, valor) {
        setErro('');
        setForm((atual) => ({ ...atual, [campo]: valor }));
    }

    function alternarArea(areaId) {
        const marcada = form.areas.includes(areaId);
        if (!marcada && form.areas.length >= MAX_AREAS) return;
        mudar('areas', marcada ? form.areas.filter((item) => item !== areaId) : [...form.areas, areaId]);
    }

    async function enviar(e) {
        e.preventDefault();
        setEnviando(true);
        try {
            const resposta = editando
                ? await api.put(`${rotaApi}/${id}`, form, cabecalhoAuth())
                : await api.post(rotaApi, form, cabecalhoAuth());

            let texto;
            if (ehAdmin) texto = 'Alterações salvas pelo administrador.';
            else if (editando) texto = 'Alterações salvas! O conteúdo voltou para análise do administrador.';
            else texto = `${form.tipo === 'EVENTO' ? 'Evento' : 'Publicação'} enviado para análise! Assim que o administrador aprovar, aparece no catálogo.`;

            navigate(paginaVoltar, { state: { texto, aviso: resposta.data.aviso } });
        } catch (error) {
            setErro(error.response?.data || 'Não foi possível salvar.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setEnviando(false);
        }
    }

    const ehEvento = form.tipo === 'EVENTO';

    // Conteúdo "de mentira" para a prévia do cartão
    const previa = {
        id: 0,
        tipo: form.tipo,
        titulo: form.titulo || (ehEvento ? 'Título do evento' : 'Título da publicação'),
        descricao: form.descricao || 'A descrição aparece aqui.',
        estado: form.estado || 'RS',
        local: ehEvento ? form.local : null,
        autoria: ehEvento ? null : form.autoria,
        dataInicio: ehEvento && form.dataInicio ? `${form.dataInicio}T00:00:00.000Z` : null,
        dataFim: ehEvento && form.dataFim ? `${form.dataFim}T00:00:00.000Z` : null,
        prazo: form.prazo ? `${form.prazo}T00:00:00.000Z` : null,
        instituicao: nomeInstituicao,
        areas: areas.filter((area) => form.areas.includes(area.id)).map((area) => area.nome),
        tags: tags.filter((tag) => form.tags.includes(tag.id)).map((tag) => tag.nome),
        encerrado: false,
    };

    return (
        <>
            <Cabecalho/>

            <section className="faixa-topo form-topo">
                <div className="container">
                    <Link to={paginaVoltar} className="voltar-claro"><ArrowLeft className="icon"/> {ehAdmin ? 'Voltar para a moderação' : 'Voltar para Minha instituição'}</Link>
                    <h1>{editando ? <>Editar <span className="marca-texto">conteúdo</span></> : <>Novo <span className="marca-texto">conteúdo</span></>}</h1>
                    <p>{ehAdmin
                        ? `Você está editando como administrador um conteúdo de ${nomeInstituicao}. A situação dele não muda.`
                        : 'Preencha os dados com atenção. Depois de enviar, o administrador confere antes de publicar.'}</p>
                </div>
            </section>

            <main className="mainForm container">
                {carregando ? <p className="aviso">Carregando...</p> : (
                    <form onSubmit={enviar} className="form-conteudo caixa" noValidate>
                        {erro && <p className="mensagem erro">{erro}</p>}

                        {/* 1. Tipo */}
                        <fieldset>
                            <legend><span className="passo-num">1</span> O que você quer cadastrar?</legend>
                            <div className="escolha-tipo">
                                <button type="button" className={ehEvento ? 'opcao-tipo evento marcada' : 'opcao-tipo evento'} onClick={() => mudar('tipo', 'EVENTO')}>
                                    <CalendarDays className="icon"/>
                                    <strong>Evento</strong>
                                    <span>Congresso, mostra, seminário, feira...</span>
                                </button>
                                <button type="button" className={!ehEvento ? 'opcao-tipo publicacao marcada' : 'opcao-tipo publicacao'} onClick={() => mudar('tipo', 'PUBLICACAO')}>
                                    <BookOpen className="icon"/>
                                    <strong>Publicação</strong>
                                    <span>Revista, chamada de artigos, edição...</span>
                                </button>
                            </div>
                        </fieldset>

                        {/* 2. Informações */}
                        <fieldset>
                            <legend><span className="passo-num">2</span> Informações principais</legend>

                            <label className="campo-rotulado">
                                <span className="rotulo">Título *</span>
                                <input className="campo" value={form.titulo} maxLength={150} onChange={(e) => mudar('titulo', e.target.value)}/>
                            </label>

                            <label className="campo-rotulado">
                                <span className="rotulo">Descrição * <small>{form.descricao.length}/3000</small></span>
                                <textarea className="campo" rows={5} value={form.descricao} maxLength={3000} onChange={(e) => mudar('descricao', e.target.value)} placeholder="Conte do que se trata, para quem é e o que vai acontecer."/>
                            </label>

                            <div className="duas-colunas">
                                <label className="campo-rotulado">
                                    <span className="rotulo">Estado *</span>
                                    <select className="campo" value={form.estado} onChange={(e) => mudar('estado', e.target.value)}>
                                        <option value="">Escolha</option>
                                        <option value="PR">Paraná</option>
                                        <option value="SC">Santa Catarina</option>
                                        <option value="RS">Rio Grande do Sul</option>
                                    </select>
                                </label>

                                {ehEvento ? (
                                    <label className="campo-rotulado">
                                        <span className="rotulo">Local *</span>
                                        <input className="campo" value={form.local} maxLength={150} onChange={(e) => mudar('local', e.target.value)} placeholder='Cidade ou "Online"'/>
                                    </label>
                                ) : (
                                    <label className="campo-rotulado">
                                        <span className="rotulo">Autoria ou revista *</span>
                                        <input className="campo" value={form.autoria} maxLength={150} onChange={(e) => mudar('autoria', e.target.value)}/>
                                    </label>
                                )}
                            </div>
                        </fieldset>

                        {/* 3. Datas */}
                        <fieldset>
                            <legend><span className="passo-num">3</span> Datas</legend>
                            <div className={ehEvento ? 'tres-colunas' : 'duas-colunas'}>
                                {ehEvento && (
                                    <>
                                        <label className="campo-rotulado">
                                            <span className="rotulo">Início *</span>
                                            <input type="date" className="campo" value={form.dataInicio} onChange={(e) => mudar('dataInicio', e.target.value)}/>
                                        </label>
                                        <label className="campo-rotulado">
                                            <span className="rotulo">Fim</span>
                                            <input type="date" className="campo" value={form.dataFim} min={form.dataInicio} onChange={(e) => mudar('dataFim', e.target.value)}/>
                                        </label>
                                    </>
                                )}
                                <label className="campo-rotulado">
                                    <span className="rotulo">{ehEvento ? 'Inscrições até' : 'Envio de artigos até'}</span>
                                    <input type="date" className="campo" value={form.prazo} onChange={(e) => mudar('prazo', e.target.value)}/>
                                </label>
                            </div>
                        </fieldset>

                        {/* 4. Áreas */}
                        <fieldset>
                            <legend><span className="passo-num">4</span> Áreas do conhecimento <small>({form.areas.length}/{MAX_AREAS})</small></legend>
                            <div className="areas-escolha">
                                {areas.map((area) => {
                                    const marcada = form.areas.includes(area.id);
                                    const bloqueada = !marcada && form.areas.length >= MAX_AREAS;
                                    return (
                                        <button key={area.id} type="button" disabled={bloqueada} className={marcada ? 'area-opcao marcada' : 'area-opcao'} onClick={() => alternarArea(area.id)} aria-pressed={marcada}>
                                            {area.nome}
                                        </button>
                                    );
                                })}
                            </div>
                        </fieldset>

                        {/* 5. Tags */}
                        <fieldset>
                            <legend><span className="passo-num">5</span> Tags <small>({form.tags.length}/{MAX_TAGS}, opcional)</small></legend>
                            <p className="dica"><Info className="icon"/> As tags ajudam as pessoas certas a encontrar o seu conteúdo nas buscas e nas recomendações.</p>
                            <SeletorTags tags={tags} escolhidas={form.tags} maximo={MAX_TAGS} aoMudar={(alterar) => setForm((atual) => ({ ...atual, tags: alterar(atual.tags) }))}/>
                        </fieldset>

                        {/* 6. Link */}
                        <fieldset>
                            <legend><span className="passo-num">6</span> Link oficial</legend>
                            <label className="campo-rotulado">
                                <span className="rotulo">Endereço do site oficial *</span>
                                <input type="url" className="campo" value={form.linkOficial} maxLength={500} onChange={(e) => mudar('linkOficial', e.target.value)} placeholder="https://"/>
                            </label>
                            <p className="dica"><Info className="icon"/> É por esse link que as pessoas vão se inscrever ou enviar artigos.</p>
                        </fieldset>

                        <div className="form-botoes">
                            <button type="submit" className="botao-azul botao-grande" disabled={enviando}>
                                <Send className="icon"/> {enviando ? 'Enviando...' : ehAdmin ? 'Salvar alterações' : editando ? 'Salvar e enviar para análise' : 'Enviar para análise'}
                            </button>
                            <Link to={paginaVoltar} className="botao-contorno">Cancelar</Link>
                        </div>
                    </form>
                )}

                {/* Prévia ao vivo */}
                {!carregando && (
                    <aside className="previa">
                        <p className="sobrancelha"><span className="icone-quadrado"><Eye className="icon"/></span>Prévia no catálogo</p>
                        <div className="previa-cartao" aria-hidden="true">
                            <Cartao conteudo={previa}/>
                        </div>
                    </aside>
                )}
            </main>

            <Rodape/>
        </>
    );
};

export default FormConteudo;
