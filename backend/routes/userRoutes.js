import express from 'express';
import controller from '../controllers/userController.js';
import authUser from '../services/auth.js';
import lattes from '../controllers/lattesController.js';
import interesses from '../controllers/interesseController.js';
import favoritos from '../controllers/favoritoController.js';

//  Inicializando rotas do usuário
const routes = express.Router();

const userController = controller();
const lattesController = lattes();
const interesseController = interesses();
const favoritoController = favoritos();
//  Rotas

//  Cadastrar usuário
routes.post('/registerUser',userController.registerUser);
routes.post('/loginUser',userController.logUser);

//  Esqueci a senha
routes.post('/esqueci-senha',userController.esqueciSenha);
routes.post('/redefinir-senha',userController.redefinirSenha);

routes.get('/auth',authUser, (req,res) => {
    res.status(200).json("Authentication Succeed!")
})

routes.get('/me',authUser, userController.getUser);

//  Direitos da LGPD: corrigir o nome, baixar os dados e apagar a conta
routes.put('/perfil/nome',authUser, userController.editarNome);
routes.get('/perfil/meus-dados',authUser, userController.meusDados);
routes.delete('/perfil/conta',authUser, userController.excluirConta);

//  Currículo Lattes do perfil
routes.put('/perfil/lattes',authUser, lattesController.salvarLink);
routes.post('/perfil/lattes/xml',authUser, lattesController.importarXml);

//  Interesses (áreas e estados)
routes.get('/perfil/interesses',authUser, interesseController.verInteresses);
routes.put('/perfil/interesses',authUser, interesseController.salvarInteresses);

//  Favoritos (estrelinha nos cartões)
routes.get('/favoritos',authUser, favoritoController.listar);
routes.post('/favoritos/:id',authUser, favoritoController.salvar);
routes.delete('/favoritos/:id',authUser, favoritoController.remover);


//  Logar usuário
export default routes;


