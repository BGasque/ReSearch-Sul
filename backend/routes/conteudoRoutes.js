import express from 'express';
import controller from '../controllers/conteudoController.js';
import authUser from '../services/auth.js';

//  Rotas do catálogo (públicas: não precisam de login)
const routes = express.Router();

const conteudoController = controller();

routes.get('/areas', conteudoController.listarAreas);
routes.get('/tags', conteudoController.listarTags);
routes.get('/instituicoes', conteudoController.listarInstituicoes);
routes.get('/conteudos', conteudoController.listarConteudos);
routes.get('/conteudos/:id', conteudoController.verConteudo);

//  Recomendações (precisa de login)
routes.get('/recomendacoes', authUser, conteudoController.recomendar);

export default routes;
