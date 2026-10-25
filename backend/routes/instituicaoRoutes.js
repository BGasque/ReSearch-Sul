import express from 'express';
import controller from '../controllers/instituicaoController.js';
import authUser from '../services/auth.js';
import soInstituicao from '../services/soInstituicao.js';

//  Rotas da área da instituição (precisa de login de instituição)
const routes = express.Router();

const instituicaoController = controller();
const protegido = [authUser, soInstituicao];

routes.get('/instituicao/conteudos', protegido, instituicaoController.listar);
routes.get('/instituicao/conteudos/:id', protegido, instituicaoController.ver);
routes.post('/instituicao/conteudos', protegido, instituicaoController.criar);
routes.put('/instituicao/conteudos/:id', protegido, instituicaoController.editar);
routes.patch('/instituicao/conteudos/:id/arquivar', protegido, instituicaoController.arquivar);

export default routes;
