import jwt from 'jsonwebtoken';
import prisma from './adapter.js';

// Confere o login (token) e também o banco:
// conta apagada ou bloqueada pelo administrador não passa, mesmo com token válido.
export default async function authUser(req, res, next) {

    const header = req.header('Authorization');

    if (!header) {
        return res.status(401).json({error:'Authorization Header Missing'});
    }

    const token = header.split(' '); //Bearer [0] (my_token) [1]

    if (token[0] !== "Bearer" || !token[1]) {
        return res.status(401).json({
            error: "Invalid authorization format"
        });
    }

    let auth;
    try {
        auth = jwt.verify(token[1],process.env.MY_SECRET_KEY);
    } catch(error) {
        console.log(error.message);
        return res.status(401).json("Authentication denied!");
    }

    try {
        const usuario = await prisma.usuario.findUnique({
            where: { id: Number(auth.id) },
            select: { id: true, nome: true, tipo: true, bloqueado: true, verificado: true },
        });
        if (!usuario) return res.status(401).json("Esta conta não existe mais.");
        if (usuario.bloqueado) return res.status(403).json("Esta conta foi bloqueada pelo administrador.");

        // Usa o tipo que está no banco (se o administrador mudou, já vale)
        req.user = { id: usuario.id, nome: usuario.nome, tipo: usuario.tipo, verificado: usuario.verificado };
        next();
    } catch (error) {
        console.log(error.message);
        res.status(500).json("Erro no servidor.");
    }
}
