import express from 'express';
import controller from '../controllers/conteudoController.js';
import authUser from '../services/auth.js';
import relatos from '../controllers/relatoController.js';

//  Rotas do catálogo (públicas: não precisam de login)
const routes = express.Router();

const conteudoController = controller();
const relatoController = relatos();

routes.get('/areas', conteudoController.listarAreas);
routes.get('/tags', conteudoController.listarTags);
routes.get('/instituicoes', conteudoController.listarInstituicoes);
routes.get('/conteudos', conteudoController.listarConteudos);
routes.get('/conteudos/:id', conteudoController.verConteudo);

//  Recomendações (precisa de login)
routes.get('/recomendacoes', authUser, conteudoController.recomendar);

//  Comunicar um problema num conteúdo (RF17, precisa de login)
routes.post('/conteudos/:id/relatos', authUser, relatoController.relatar);

export default routes;
