import 'dotenv/config'
import express from 'express';
import userRoutes from './routes/userRoutes.js';
import conteudoRoutes from './routes/conteudoRoutes.js';
import instituicaoRoutes from './routes/instituicaoRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import cors from 'cors';


//  Inicializando aplicação express
const app = express();

// CORS: diz quais sites podem usar esta API.
// Na nuvem, FRONTEND_URL é o endereço do site (ex.: https://research-sul.vercel.app);
// sem FRONTEND_URL (no computador), qualquer endereço pode.
app.use(cors({ origin: process.env.FRONTEND_URL || true }));

// Limite maior porque o XML do Lattes pode ter alguns megabytes
app.use(express.json({ limit: '15mb' }));

// Importar rotas
app.use(userRoutes);
app.use(conteudoRoutes);
app.use(instituicaoRoutes);
app.use(adminRoutes);

//Porta do servidor
const PORT = process.env.PORT || 3000;

//Definindo rotas utilizadas na aplicação

// No Express 5, se der erro ao ligar (ex.: porta ocupada), o erro chega aqui
app.listen(PORT,(error) => {
    if (error) {
        if (error.code === 'EADDRINUSE') {
            console.log(`A porta ${PORT} já está em uso. Feche o outro servidor e tente de novo.`);
        } else {
            console.log(`Não foi possível ligar o servidor: ${error.message}`);
        }
        process.exit(1);
    }

    console.log(`Server on! http://localhost:${PORT}`);
})