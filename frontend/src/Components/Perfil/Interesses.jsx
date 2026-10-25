import { useEffect, useState } from "react";
import api from "../../../services/api.js";
import { Sparkles } from "lucide-react";
import { cabecalhoAuth } from "../../utils/auth.js";
import SeletorTags from "../Tags/SeletorTags.jsx";

const ESTADOS = [
    { sigla: 'PR', nome: 'Paraná' },
    { sigla: 'SC', nome: 'Santa Catarina' },
    { sigla: 'RS', nome: 'Rio Grande do Sul' },
];

const MAX_TAGS = 15;

// Seção "Meus interesses" do perfil: tags, áreas e estados usados nas recomendações.
// areasLattes = áreas que vieram do XML do Lattes (para sugerir)
const Interesses = ({ areasLattes }) => {
    const [areas, setAreas] = useState([]);
    const [areasEscolhidas, setAreasEscolhidas] = useState([]);
    const [tags, setTags] = useState([]);
    const [tagsEscolhidas, setTagsEscolhidas] = useState([]);
    const [estadosEscolhidos, setEstadosEscolhidos] = useState([]);
    const [mensagem, setMensagem] = useState({ texto: '', erro: false });

    useEffect(() => {
        api.get('/areas').then((resposta) => setAreas(resposta.data));
        api.get('/tags').then((resposta) => setTags(resposta.data));

        api.get('/perfil/interesses', cabecalhoAuth()).then((resposta) => {
            setAreasEscolhidas(resposta.data.areas);
            setTagsEscolhidas(resposta.data.tags);
            setEstadosEscolhidos(resposta.data.estados);
        });
    }, []);

    // Marca ou desmarca um item da lista
    function alternar(lista, setLista, valor) {
        setMensagem({ texto: '', erro: false });
        setLista(lista.includes(valor) ? lista.filter((item) => item !== valor) : [...lista, valor]);
    }

    // Áreas do Lattes que existem na nossa lista
    const sugestoesLattes = areas
        .filter((area) => areasLattes.some((item) => item.grandeArea === area.nome))
        .map((area) => area.id);

    function usarLattes() {
        setAreasEscolhidas([...new Set([...areasEscolhidas, ...sugestoesLattes])]);
        setMensagem({ texto: 'Marcamos as áreas do seu Lattes. Confira e clique em Salvar.', erro: false });
    }

    async function salvar() {
        try {
            const resposta = await api.put('/perfil/interesses', { areas: areasEscolhidas, tags: tagsEscolhidas, estados: estadosEscolhidos }, cabecalhoAuth());
            setMensagem({ texto: resposta.data, erro: false });
        } catch (error) {
            setMensagem({ texto: error.response?.data || 'Não foi possível salvar.', erro: true });
        }
    }

    return (
        <section className="caixa caixa-perfil amarelo">
            <p className="sobrancelha"><span className="icone-quadrado"><Sparkles className="icon"/></span>Personalização</p>
            <h2>Meus interesses</h2>
            <p className="explicacao">Escolha as tags, as áreas e os estados que você quer acompanhar. Eles são usados para recomendar eventos e publicações para você.</p>

            <h3 className="rotulo">Minhas tags preferidas ({tagsEscolhidas.length}/{MAX_TAGS})</h3>
            <p className="explicacao">São o que mais pesa nas recomendações: cada tag em comum com um evento conta mais pontos.</p>
            <SeletorTags
                tags={tags}
                escolhidas={tagsEscolhidas}
                maximo={MAX_TAGS}
                aoMudar={(alterar) => { setMensagem({ texto: '', erro: false }); setTagsEscolhidas(alterar); }}
            />

            <h3 className="rotulo">Áreas do conhecimento</h3>
            {sugestoesLattes.length > 0 && (
                <button type="button" className="botao-contorno botao-pequeno" onClick={usarLattes}>Usar as áreas do meu Lattes</button>
            )}
            <div className="opcoes">
                {areas.map((area) => (
                    <label key={area.id} className={areasEscolhidas.includes(area.id) ? 'opcao marcada' : 'opcao'}>
                        <input type="checkbox" checked={areasEscolhidas.includes(area.id)} onChange={() => alternar(areasEscolhidas, setAreasEscolhidas, area.id)}/>
                        {area.nome}
                    </label>
                ))}
            </div>

            <h3 className="rotulo">Estados</h3>
            <div className="opcoes">
                {ESTADOS.map((estado) => (
                    <label key={estado.sigla} className={estadosEscolhidos.includes(estado.sigla) ? 'opcao marcada' : 'opcao'}>
                        <input type="checkbox" checked={estadosEscolhidos.includes(estado.sigla)} onChange={() => alternar(estadosEscolhidos, setEstadosEscolhidos, estado.sigla)}/>
                        {estado.nome}
                    </label>
                ))}
            </div>
            <p className="explicacao">Se não marcar nenhum estado, você recebe recomendações dos três.</p>

            <button type="button" className="botao-azul botao-salvar" onClick={salvar}>Salvar interesses</button>

            {mensagem.texto && <p className={mensagem.erro ? 'mensagem erro' : 'mensagem'}>{mensagem.texto}</p>}
        </section>
    );
};

export default Interesses;
