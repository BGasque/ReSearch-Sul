import axios from 'axios';

const api = axios.create({
    // Endereço do servidor (back-end). Pode ser trocado pela variável VITE_API_URL.
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',

    headers: {
        'Content-Type': 'application/json',
    }
})

export default api;