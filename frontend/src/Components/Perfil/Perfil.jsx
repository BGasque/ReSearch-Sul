import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import api from "../../../services/api.js";
import { FileText, GraduationCap, Link2, Building2, ArrowRight, ShieldCheck } from "lucide-react";
import Cabecalho from "../Cabecalho/Cabecalho.jsx";
import Rodape from "../Rodape/Rodape.jsx";
import { cabecalhoAuth, pegarToken, formatarData } from "../../utils/auth.js";
import Interesses from "./Interesses.jsx";
import "./Perfil.css";

const NOMES_TIPO = {
    PESSOA: 'Estudante ou pesquisador',
    INSTITUICAO: 'Instituição',
    ADMIN: 'Administrador',
};

// Página "Meu perfil": dados da conta e associação do Currículo Lattes
const Perfil = () => {
    const navigate = useNavigate();

    const [usuario, setUsuario] = useState(null);
    const [link, setLink] = useState('');
    const [mensagem, setMensagem] = useState({ texto: '', erro: false });
    const [enviando, setEnviando] = useState(false);

    async function carregar() {
        try {
            const resposta = await api.get('/me', cabecalhoAuth());
            setUsuario(resposta.data);
            setLink(resposta.data.lattes || '');
        } catch {
            // Token inválido ou vencido: volta para o login
            navigate('/login');
        }
    }

    useEffect(() => {
        if (!pegarToken()) {
            navigate('/login');
            return;
        }
        carregar();
    }, []);

    function avisar(texto, erro = false) {
        setMensagem({ texto, erro });
    }

    async function salvarLink(e) {
        e.preventDefault();
        try {
            const resposta = await api.put('/perfil/lattes', { lattes: link }, cabecalhoAuth());
            avisar(resposta.data);
            carregar();
        } catch (error) {
            avisar(error.response?.data || 'Não foi possível salvar o link.', true);
        }
    }

    // Lê o arquivo escolhido e manda para o servidor
    function importarArquivo(e) {
        const arquivo = e.target.files[0];
        e.target.value = '';
        if (!arquivo) return;

        const leitor = new FileReader();
        leitor.onload = async () => {
            // O resultado vem como "data:...;base64,XXXX": mandamos só a parte depois da vírgula
            const base64 = leitor.result.split(',')[1];

            setEnviando(true);
            try {
                await api.post('/perfil/lattes/xml', { arquivo: base64 }, cabecalhoAuth());
                avisar('Dados do Lattes importados com sucesso!');
                carregar();
            } catch (error) {
                avisar(error.response?.data || 'Não foi possível importar o arquivo.', true);
            } finally {
                setEnviando(false);
            }
        };
        leitor.readAsDataURL(arquivo);
    }

    if (!usuario) {
        return (
            <>
                <Cabecalho/>
                <main className="mainPerfil container"><p className="aviso">Carregando...</p></main>
            </>
        );
    }

    const dados = usuario.lattesDados;

    return (
        <>
            <Cabecalho/>

            <section className="faixa-topo perfil-topo">
                <div className="container">
                    <span className="perfil-avatar">{usuario.nome.charAt(0).toUpperCase()}</span>
                    <div>
                        <p className="sobrancelha">Meu perfil · {NOMES_TIPO[usuario.tipo]}</p>
                        <h1>{usuario.nome}</h1>
                        <p>{usuario.email}</p>
                        {usuario.lattes && <p className="perfil-selo"><GraduationCap className="icon"/> Perfil acadêmico vinculado ao Lattes</p>}
                    </div>
                </div>
            </section>

            <main className="mainPerfil container">

                {usuario.tipo === 'PESSOA' && <Interesses areasLattes={dados?.areas || []}/>}

                {usuario.tipo === 'ADMIN' && (
                    <section className="caixa caixa-perfil coral">
                        <p className="sobrancelha"><span className="icone-quadrado"><ShieldCheck className="icon"/></span>Administração</p>
                        <h2>Moderação</h2>
                        <p className="explicacao">Aprove, recuse, edite ou exclua os conteúdos enviados pelas instituições e cuide das tags.</p>
                        <Link to="/admin" className="botao-azul botao-pequeno">Ir para a moderação <ArrowRight className="icon"/></Link>
                    </section>
                )}

                {usuario.tipo === 'ADMIN' ? null : usuario.tipo === 'INSTITUICAO' ? (
                    <section className="caixa caixa-perfil verde">
                        <p className="sobrancelha"><span className="icone-quadrado"><Building2 className="icon"/></span>Instituição</p>
                        <h2>Seus eventos e publicações</h2>
                        <p className="explicacao">Cadastre, edite e acompanhe a situação dos conteúdos da sua instituição.</p>
                        <Link to="/instituicao" className="botao-azul botao-pequeno">Ir para Minha instituição <ArrowRight className="icon"/></Link>
                    </section>
                ) : (
                <section className="caixa caixa-perfil verde">
                    <p className="sobrancelha"><span className="icone-quadrado"><Link2 className="icon"/></span>Lattes</p>
                    <h2>Currículo Lattes</h2>
                    <p className="explicacao">
                        Associe seu Currículo Lattes ao perfil. O ReSearch Sul nunca pede nem guarda a sua senha do Lattes.
                    </p>

                    <form onSubmit={salvarLink} className="linha">
                        <label htmlFor="lattes" className="visually-hidden">Link do Lattes</label>
                        <input id="lattes" type="text" className="campo" placeholder="http://lattes.cnpq.br/0000000000000000" value={link} onChange={(e) => setLink(e.target.value)}/>
                        <button type="submit" className="botao-azul">{link ? 'Associar' : 'Remover associação'}</button>
                    </form>

                    {usuario.lattes && (
                        <p>Perfil acadêmico vinculado: <a href={usuario.lattes} target="_blank" rel="noreferrer">{usuario.lattes}</a></p>
                    )}

                    <div className="importar">
                        <h3 className="rotulo">Importar dados públicos do Lattes</h3>
                        <ol>
                            <li>Entre no seu Currículo Lattes e clique em <strong>Atualizar currículo</strong>.</li>
                            <li>No menu, escolha <strong>Exportar</strong> e depois <strong>XML</strong>.</li>
                            <li>Envie aqui o arquivo baixado (pode ser o .zip ou o .xml).</li>
                        </ol>
                        <label className="botao botao-arquivo">
                            {enviando ? 'Importando...' : 'Escolher arquivo do Lattes'}
                            <input type="file" accept=".xml,.zip" onChange={importarArquivo} disabled={enviando}/>
                        </label>
                    </div>

                    {mensagem.texto && <p className={mensagem.erro ? 'mensagem erro' : 'mensagem'}>{mensagem.texto}</p>}
                </section>
                )}

                {dados && (
                    <section className="caixa caixa-perfil coral">
                        <p className="sobrancelha"><span className="icone-quadrado"><FileText className="icon"/></span>Importado</p>
                        <h2>Dados do seu Lattes</h2>
                        <p className="explicacao">Importado em {formatarData(usuario.lattesImportadoEm)}. Nome no currículo: {dados.nome}.</p>

                        <h3 className="rotulo">Áreas de atuação</h3>
                        {dados.areas.length === 0 ? <p className="vazio">Nenhuma área informada.</p> : (
                            <div className="areas">
                                {dados.areas.map((area, i) => (
                                    <span key={i}>{area.grandeArea}{area.area && ` · ${area.area}`}</span>
                                ))}
                            </div>
                        )}

                        <h3 className="rotulo">Artigos publicados ({dados.artigos.length})</h3>
                        {dados.artigos.length === 0 ? <p className="vazio">Nenhum artigo.</p> : (
                            <ul>
                                {dados.artigos.map((artigo, i) => (
                                    <li key={i}>{artigo.titulo} <span className="detalhe">— {artigo.revista}, {artigo.ano}</span></li>
                                ))}
                            </ul>
                        )}

                        <h3 className="rotulo">Trabalhos em eventos ({dados.trabalhosEmEventos.length})</h3>
                        {dados.trabalhosEmEventos.length === 0 ? <p className="vazio">Nenhum trabalho.</p> : (
                            <ul>
                                {dados.trabalhosEmEventos.map((trabalho, i) => (
                                    <li key={i}>{trabalho.titulo} <span className="detalhe">— {trabalho.evento}, {trabalho.ano}</span></li>
                                ))}
                            </ul>
                        )}

                        <h3 className="rotulo">Participação em eventos ({dados.participacoesEmEventos.length})</h3>
                        {dados.participacoesEmEventos.length === 0 ? <p className="vazio">Nenhuma participação.</p> : (
                            <ul>
                                {dados.participacoesEmEventos.map((participacao, i) => (
                                    <li key={i}>{participacao.evento} <span className="detalhe">— {participacao.ano}</span></li>
                                ))}
                            </ul>
                        )}
                    </section>
                )}
            </main>

            <Rodape/>
        </>
    );
};

export default Perfil;
