import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import api from "../../services/api.js";
import { cabecalhoAuth, pegarToken } from "./auth.js";

// Guarda quais conteúdos o usuário salvou com a estrelinha e deixa marcar/desmarcar.
// Quem não entrou na conta é levado para o login ao clicar na estrelinha.
export default function useFavoritos() {
    const navigate = useNavigate();
    const [favoritos, setFavoritos] = useState([]);

    async function carregar() {
        if (!pegarToken()) return;
        try {
            const resposta = await api.get('/favoritos', cabecalhoAuth());
            setFavoritos(resposta.data);
        } catch {
            // Sem favoritos (ex.: login vencido): a estrelinha só aparece vazia
        }
    }

    useEffect(() => {
        carregar();
    }, []);

    const ids = favoritos.map((conteudo) => conteudo.id);

    async function alternar(id) {
        if (!pegarToken()) {
            navigate('/login');
            return;
        }
        try {
            if (ids.includes(id)) {
                await api.delete(`/favoritos/${id}`, cabecalhoAuth());
            } else {
                await api.post(`/favoritos/${id}`, {}, cabecalhoAuth());
            }
            await carregar();
        } catch (error) {
            if (error.response?.status === 401) navigate('/login');
        }
    }

    return { favoritos, ids, alternar };
}
