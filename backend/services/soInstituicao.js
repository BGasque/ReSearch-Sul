// Deixa passar só contas de instituição (usar depois do authUser)
export default function soInstituicao(req, res, next) {
    if (req.user?.tipo !== 'INSTITUICAO') {
        return res.status(403).json("Só contas de instituição podem fazer isso.");
    }
    next();
}
