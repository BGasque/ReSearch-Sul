import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Search, SlidersHorizontal, Compass, Sparkles, UserPlus, ExternalLink, Telescope, Hash, X, ChevronDown, ChevronUp } from "lucide-react";
import api from "../../../services/api.js";
import Cabecalho from "../Cabecalho/Cabecalho.jsx";
import Rodape from "../Rodape/Rodape.jsx";
import Cartao from "../Cartao/Cartao.jsx";
import Ilustracao from "./Ilustracao.jsx";
import SeletorTags from "../Tags/SeletorTags.jsx";
import { usuarioLogado } from "../../utils/auth.js";
import "./Home.css"

// Passos da seção "Como funciona"
const PASSOS = [
    { icone: Search, cor: 'azul', titulo: 'Encontre', texto: 'Busque por palavra ou filtre por tipo, estado e área do conhecimento.' },
    { icone: UserPlus, cor: 'coral', titulo: 'Crie sua conta', texto: 'Associe seu Currículo Lattes e escolha as áreas que você quer acompanhar.' },
    { icone: Sparkles, cor: 'amarelo', titulo: 'Receba sugestões', texto: 'Veja eventos e publicações recomendados a partir dos seus interesses.' },
    { icone: ExternalLink, cor: 'verde', titulo: 'Participe', texto: 'Faça a inscrição ou envie seu artigo direto no site oficial.' },
];

// Página inicial: catálogo público de eventos e publicações (não precisa de login)
const Home = () => {
    const [conteudos, setConteudos] = useState([]);
    const [todos, setTodos] = useState([]);
    const [areas, setAreas] = useState([]);
    const [tags, setTags] = useState([]);
    const [instituicoes, setInstituicoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    // Texto digitado e filtros escolhidos
    const [texto, setTexto] = useState('');
    const [busca, setBusca] = useState('');
    const [tipo, setTipo] = useState('');
    const [estado, setEstado] = useState('');
    const [areaId, setAreaId] = useState('');
    const [esconderEncerrados, setEsconderEncerrados] = useState(false);
    const [instituicaoId, setInstituicaoId] = useState('');
    // Tags escolhidas na busca (não precisam ser as mesmas do perfil)
    const [tagsEscolhidas, setTagsEscolhidas] = useState([]);
    const [mostrarTags, setMostrarTags] = useState(false);

    const usuario = usuarioLogado();

    // Carrega as áreas (para o filtro) e o catálogo inteiro (para os números do topo)
    useEffect(() => {
        api.get('/areas')
            .then((resposta) => setAreas(resposta.data))
            .catch(() => setAreas([]));

        api.get('/conteudos')
            .then((resposta) => setTodos(resposta.data))
            .catch(() => setTodos([]));

        api.get('/tags')
            .then((resposta) => setTags(resposta.data))
            .catch(() => setTags([]));

        api.get('/instituicoes')
            .then((resposta) => setInstituicoes(resposta.data))
            .catch(() => setInstituicoes([]));
    }, []);

    // Busca os conteúdos sempre que a busca ou um filtro muda
    useEffect(() => {
        const params = { busca, tipo, estado, areaId, instituicaoId };
        if (esconderEncerrados) params.esconderEncerrados = 'sim';
        if (tagsEscolhidas.length > 0) params.tags = tagsEscolhidas.join(',');

        setCarregando(true);
        api.get('/conteudos', { params })
            .then((resposta) => {
                setConteudos(resposta.data);
                setErro('');
            })
            .catch(() => setErro('Não foi possível carregar o catálogo. O servidor está ligado?'))
            .finally(() => setCarregando(false));
    }, [busca, tipo, estado, areaId, instituicaoId, tagsEscolhidas, esconderEncerrados]);

    function pesquisar(e) {
        e.preventDefault();
        setBusca(texto);
    }

    function limparFiltros() {
        setTexto('');
        setBusca('');
        setTipo('');
        setEstado('');
        setAreaId('');
        setInstituicaoId('');
        setTagsEscolhidas([]);
        setEsconderEncerrados(false);
    }

    const temFiltro = busca || tipo || estado || areaId || instituicaoId || tagsEscolhidas.length > 0 || esconderEncerrados;

    // Nomes das tags escolhidas (para mostrar e destacar nos cartões)
    const nomesTagsEscolhidas = tags.filter((tag) => tagsEscolhidas.includes(tag.id)).map((tag) => tag.nome);

    // Números da faixa
    const numeros = [
        { valor: todos.filter((c) => c.tipo === 'EVENTO' && !c.encerrado).length, texto: 'eventos com data marcada', cor: 'azul' },
        { valor: todos.filter((c) => c.tipo === 'PUBLICACAO').length, texto: 'revistas e chamadas de artigos', cor: 'coral' },
        { valor: new Set(todos.map((c) => c.instituicao)).size, texto: 'instituições participando', cor: 'verde' },
        { valor: 3, texto: 'estados da Região Sul', cor: 'amarelo' },
    ];

    return (
        <>
            <Cabecalho/>

            <section className="faixa-topo home-topo">
                <div className="container">
                    <div className="home-topo-texto">
                        <p className="sobrancelha">
                            <span className="icone-quadrado"><Telescope className="icon"/></span>
                            Para estudantes e pesquisadores
                        </p>
                        <h1>Sua próxima <span className="marca-texto">pesquisa</span> começa num evento.</h1>
                        <p>Congressos, mostras, revistas e chamadas de artigos do Paraná, de Santa Catarina e do Rio Grande do Sul, reunidos num só lugar.</p>

                        <form onSubmit={pesquisar} className="busca">
                            <label htmlFor="pesquisar" className="visually-hidden">Pesquisar</label>
                            <Search className="icon lupa"/>
                            <input type="search" id="pesquisar" className="campo" placeholder="Busque por evento, instituição, autor ou tag" value={texto} onChange={(e) => setTexto(e.target.value)}/>
                            <button type="submit" className="botao-amarelo">Buscar</button>
                        </form>
                    </div>

                    <Ilustracao/>
                </div>
            </section>

            {/* Faixa de números */}
            <section className="numeros">
                <div className="container">
                    {numeros.map((numero) => (
                        <div key={numero.texto} className="numero">
                            <strong>{numero.valor}</strong>
                            <span className={`traco ${numero.cor}`}/>
                            <p>{numero.texto}</p>
                        </div>
                    ))}
                </div>
            </section>

            <main className="mainHome container">
                <div className="titulo-secao">
                    <p className="sobrancelha">
                        <span className="icone-quadrado"><Compass className="icon"/></span>
                        Catálogo
                    </p>
                    <h2>Explore as <span className="marca-texto">oportunidades</span></h2>
                </div>

                <section className="filtros caixa">
                    <p className="filtros-titulo rotulo"><SlidersHorizontal className="icon"/> Filtrar</p>

                    <label>
                        <span className="rotulo">Tipo</span>
                        <select className="campo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                            <option value="">Todos</option>
                            <option value="EVENTO">Eventos</option>
                            <option value="PUBLICACAO">Publicações</option>
                        </select>
                    </label>

                    <label>
                        <span className="rotulo">Estado</span>
                        <select className="campo" value={estado} onChange={(e) => setEstado(e.target.value)}>
                            <option value="">Todos</option>
                            <option value="PR">Paraná</option>
                            <option value="SC">Santa Catarina</option>
                            <option value="RS">Rio Grande do Sul</option>
                        </select>
                    </label>

                    <label>
                        <span className="rotulo">Área</span>
                        <select className="campo" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                            <option value="">Todas</option>
                            {areas.map((area) => (
                                <option key={area.id} value={area.id}>{area.nome}</option>
                            ))}
                        </select>
                    </label>

                    <label>
                        <span className="rotulo">Instituição</span>
                        <select className="campo" value={instituicaoId} onChange={(e) => setInstituicaoId(e.target.value)}>
                            <option value="">Todas</option>
                            {instituicoes.map((instituicao) => (
                                <option key={instituicao.id} value={instituicao.id}>{instituicao.nome}</option>
                            ))}
                        </select>
                    </label>

                    <button type="button" className={mostrarTags ? 'botao-tags aberto' : 'botao-tags'} onClick={() => setMostrarTags(!mostrarTags)} aria-expanded={mostrarTags}>
                        <Hash className="icon"/> Tags {tagsEscolhidas.length > 0 && <span className="contagem">{tagsEscolhidas.length}</span>}
                        {mostrarTags ? <ChevronUp className="icon"/> : <ChevronDown className="icon"/>}
                    </button>

                    <label className="caixa-marcar">
                        <input type="checkbox" checked={esconderEncerrados} onChange={(e) => setEsconderEncerrados(e.target.checked)}/>
                        Esconder encerrados
                    </label>

                    {temFiltro && <button type="button" className="limpar" onClick={limparFiltros}>Limpar filtros</button>}

                    {/* Painel de tags: basta o conteúdo ter UMA das tags escolhidas */}
                    {mostrarTags && (
                        <div className="painel-tags">
                            <p className="painel-tags-dica">Escolha uma ou mais tags. Aparecem os conteúdos que tenham pelo menos uma delas.</p>
                            <SeletorTags tags={tags} escolhidas={tagsEscolhidas} aoMudar={setTagsEscolhidas}/>
                        </div>
                    )}

                    {tagsEscolhidas.length > 0 && (
                        <div className="tags-ativas">
                            {tags.filter((tag) => tagsEscolhidas.includes(tag.id)).map((tag) => (
                                <button key={tag.id} type="button" className="tag-ativa" onClick={() => setTagsEscolhidas(tagsEscolhidas.filter((id) => id !== tag.id))} aria-label={`Remover a tag ${tag.nome}`}>
                                    #{tag.nome} <X className="icon"/>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                {busca && <p className="buscando">Resultados para <strong>“{busca}”</strong></p>}

                {erro && <p className="aviso">{erro}</p>}

                {!erro && !carregando && conteudos.length === 0 && (
                    <p className="aviso">Nenhum resultado encontrado. Tente remover alguns filtros ou buscar outra palavra.</p>
                )}

                {!erro && conteudos.length > 0 && (
                    <p className="quantidade rotulo">{conteudos.length} {conteudos.length === 1 ? 'resultado' : 'resultados'}</p>
                )}

                <section className="lista">
                    {conteudos.map((conteudo) => <Cartao key={conteudo.id} conteudo={conteudo} destacarTags={nomesTagsEscolhidas}/>)}
                </section>

                {/* Como funciona */}
                <section className="como-funciona">
                    <div className="titulo-secao">
                        <p className="sobrancelha">
                            <span className="icone-quadrado"><Sparkles className="icon"/></span>
                            Passo a passo
                        </p>
                        <h2>Como <span className="marca-texto coral">funciona</span></h2>
                    </div>

                    <ol className="passos">
                        {PASSOS.map((passo, i) => (
                            <li key={passo.titulo} className={`passo caixa ${passo.cor}`}>
                                <span className="passo-numero">0{i + 1}</span>
                                <span className="passo-icone"><passo.icone className="icon"/></span>
                                <h3>{passo.titulo}</h3>
                                <p>{passo.texto}</p>
                            </li>
                        ))}
                    </ol>

                    {!usuario && (
                        <div className="chamada caixa">
                            <div>
                                <h3>Quer receber sugestões feitas para você?</h3>
                                <p>Crie sua conta grátis e escolha as áreas que você quer acompanhar.</p>
                            </div>
                            <Link to="/register" className="botao-azul">Criar minha conta</Link>
                        </div>
                    )}
                </section>
            </main>

            <Rodape/>
        </>
    )
}

export default Home;
