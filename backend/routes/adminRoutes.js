import express from 'express';
import controller from '../controllers/adminController.js';
import authUser from '../services/auth.js';
import soAdmin from '../services/soAdmin.js';
import relatos from '../controllers/relatoController.js';

//  Rotas do administrador (precisa de login de administrador)
const routes = express.Router();

const adminController = controller();
const relatoController = relatos();
const protegido = [authUser, soAdmin];

routes.get('/admin/resumo', protegido, adminController.resumo);

//  Moderação de conteúdos
routes.get('/admin/conteudos', protegido, adminController.listar);
routes.get('/admin/conteudos/:id', protegido, adminController.ver);
routes.patch('/admin/conteudos/:id/aprovar', protegido, adminController.aprovar);
routes.patch('/admin/conteudos/:id/recusar', protegido, adminController.recusar);
routes.patch('/admin/conteudos/:id/correcao', protegido, adminController.pedirCorrecao);
routes.patch('/admin/conteudos/:id/ocultar', protegido, adminController.ocultar);
routes.patch('/admin/conteudos/:id/arquivar', protegido, adminController.arquivar);
routes.put('/admin/conteudos/:id', protegido, adminController.editar);
routes.delete('/admin/conteudos/:id', protegido, adminController.excluir);

//  Tags
routes.get('/admin/tags', protegido, adminController.listarTags);
routes.post('/admin/tags', protegido, adminController.criarTag);
routes.patch('/admin/tags/:id', protegido, adminController.editarTag);
routes.delete('/admin/tags/:id', protegido, adminController.excluirTag);
routes.post('/admin/tags/:id/juntar', protegido, adminController.juntarTag);

//  Áreas do conhecimento
routes.get('/admin/categorias', protegido, adminController.listarCategorias);
routes.post('/admin/categorias', protegido, adminController.criarCategoria);
routes.patch('/admin/categorias/:id', protegido, adminController.editarCategoria);
routes.delete('/admin/categorias/:id', protegido, adminController.excluirCategoria);
routes.post('/admin/categorias/:id/juntar', protegido, adminController.juntarCategoria);

routes.get('/admin/areas', protegido, adminController.listarAreas);
routes.post('/admin/areas', protegido, adminController.criarArea);
routes.patch('/admin/areas/:id', protegido, adminController.editarArea);
routes.delete('/admin/areas/:id', protegido, adminController.excluirArea);
routes.post('/admin/areas/:id/juntar', protegido, adminController.juntarArea);

//  Usuários e instituições (CU15)
routes.get('/admin/usuarios', protegido, adminController.listarUsuarios);
routes.patch('/admin/usuarios/:id', protegido, adminController.editarUsuario);
routes.delete('/admin/usuarios/:id', protegido, adminController.excluirUsuario);

// Problemas comunicados pelos usuários (RF17)
routes.get('/admin/relatos', protegido, relatoController.listar);
routes.patch('/admin/relatos/:id', protegido, relatoController.tratar);

export default routes;
