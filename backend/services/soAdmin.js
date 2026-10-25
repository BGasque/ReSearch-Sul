import prisma from './adapter.js';

// Deixa passar só administradores (usar depois do authUser).
// Confere no banco também, para o caso de a conta ter mudado depois do login.
export default async function soAdmin(req, res, next) {
    try {
        if (req.user?.tipo !== 'ADMIN') {
            return res.status(403).json("Só administradores podem fazer isso.");
        }

        const usuario = await prisma.usuario.findUnique({ where: { id: req.user.id } });
        if (!usuario || usuario.tipo !== 'ADMIN') {
            return res.status(403).json("Só administradores podem fazer isso.");
        }

        next();
    } catch (error) {
        console.log(error.message);
        res.status(500).json("Erro no servidor.");
    }
}
