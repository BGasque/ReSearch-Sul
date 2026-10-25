import express from 'express';
import controller from '../controllers/userController.js';
import authUser from '../services/auth.js';
import lattes from '../controllers/lattesController.js';
import interesses from '../controllers/interesseController.js';

//  Inicializando rotas do usuário
const routes = express.Router();

const userController = controller();
const lattesController = lattes();
const interesseController = interesses();
//  Rotas

//  Cadastrar usuário
routes.post('/registerUser',userController.registerUser);
routes.post('/loginUser',userController.logUser);

routes.get('/auth',authUser, (req,res) => {
    res.status(200).json("Authentication Succeed!")
})

routes.get('/me',authUser, userController.getUser);

//  Currículo Lattes do perfil
routes.put('/perfil/lattes',authUser, lattesController.salvarLink);
routes.post('/perfil/lattes/xml',authUser, lattesController.importarXml);

//  Interesses (áreas e estados)
routes.get('/perfil/interesses',authUser, interesseController.verInteresses);
routes.put('/perfil/interesses',authUser, interesseController.salvarInteresses);


//  Logar usuário
export default routes;


