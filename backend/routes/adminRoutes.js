import express from 'express';
import controller from '../controllers/adminController.js';
import authUser from '../services/auth.js';
import soAdmin from '../services/soAdmin.js';

//  Rotas do administrador (precisa de login de administrador)
const routes = express.Router();

const adminController = controller();
const protegido = [authUser, soAdmin];

routes.get('/admin/resumo', protegido, adminController.resumo);

//  Moderação de conteúdos
routes.get('/admin/conteudos', protegido, adminController.listar);
routes.get('/admin/conteudos/:id', protegido, adminController.ver);
routes.patch('/admin/conteudos/:id/aprovar', protegido, adminController.aprovar);
routes.patch('/admin/conteudos/:id/recusar', protegido, adminController.recusar);
routes.put('/admin/conteudos/:id', protegido, adminController.editar);
routes.delete('/admin/conteudos/:id', protegido, adminController.excluir);

//  Tags
routes.get('/admin/tags', protegido, adminController.listarTags);
routes.post('/admin/tags', protegido, adminController.criarTag);
routes.patch('/admin/tags/:id', protegido, adminController.editarTag);
routes.delete('/admin/tags/:id', protegido, adminController.excluirTag);

export default routes;
