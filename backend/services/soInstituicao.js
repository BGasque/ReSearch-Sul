// Deixa passar só contas de instituição (usar depois do authUser).
// Para cadastrar ou editar conteúdos, a instituição precisa ter sido verificada pelo administrador.
export default function soInstituicao(req, res, next) {
    if (req.user?.tipo !== 'INSTITUICAO') {
        return res.status(403).json("Só contas de instituição podem fazer isso.");
    }
    if ((req.method === 'POST' || req.method === 'PUT') && !req.user.verificado) {
        return res.status(403).json("Sua instituição ainda está aguardando a verificação do administrador.");
    }
    next();
}
