import "./SeletorTags.css";

// Ordem em que os grupos aparecem
const ORDEM_GRUPOS = ['Eixo', 'Nível de ensino', 'Formato', 'Tema'];

// Lista de tags separadas por grupo, para marcar e desmarcar.
// tags: [{ id, nome, grupo }]   escolhidas: [ids]
// aoMudar recebe uma função (listaAtual => novaLista), como o setState do React,
// para não perder cliques rápidos
// maximo: quantas dá para escolher (opcional)
const SeletorTags = ({ tags, escolhidas, aoMudar, maximo }) => {
    const grupos = ORDEM_GRUPOS
        .map((grupo) => ({ grupo, tags: tags.filter((tag) => tag.grupo === grupo) }))
        .filter((item) => item.tags.length > 0);

    const cheio = maximo !== undefined && escolhidas.length >= maximo;

    function alternar(id) {
        aoMudar((atual) => {
            if (atual.includes(id)) return atual.filter((item) => item !== id);
            if (maximo !== undefined && atual.length >= maximo) return atual;
            return [...atual, id];
        });
    }

    return (
        <div className="seletor-tags">
            {grupos.map(({ grupo, tags: tagsDoGrupo }) => (
                <div key={grupo} className="grupo-tags">
                    <p className="rotulo">{grupo}</p>
                    <div className="lista-tags">
                        {tagsDoGrupo.map((tag) => {
                            const marcada = escolhidas.includes(tag.id);
                            return (
                                <button
                                    key={tag.id}
                                    type="button"
                                    className={marcada ? 'tag-opcao marcada' : 'tag-opcao'}
                                    aria-pressed={marcada}
                                    disabled={!marcada && cheio}
                                    onClick={() => alternar(tag.id)}
                                >
                                    #{tag.nome}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SeletorTags;
