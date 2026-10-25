import prisma from '../services/adapter.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Formato simples de e-mail: algo@algo.algo
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function controller() {
    return {
        get prisma() {
            return prisma;
        },

        async registerUser(req,res) {
            try{

                // Informações da requisição (nome sem espaços nas pontas e e-mail em minúsculas)
                const { senha, tipo } = req.body;
                const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';
                const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

                // Verificando se todos os campos foram preenchidos
                if (!nome || !email || typeof senha !== 'string' || !senha) {
                    return res.status(400).json("Preencha nome, e-mail e senha.");
                }

                if (nome.length > 100) {
                    return res.status(400).json("O nome pode ter no máximo 100 caracteres.");
                }

                if (email.length > 150 || !FORMATO_EMAIL.test(email)) {
                    return res.status(400).json("Informe um e-mail válido.");
                }

                if (senha.length < 6 || senha.length > 72) {
                    return res.status(400).json("A senha precisa ter entre 6 e 72 caracteres.");
                }

                // No cadastro só dá pra escolher pessoa ou instituição (admin não)
                if (tipo && tipo !== "PESSOA" && tipo !== "INSTITUICAO") {
                    return res.status(400).json("Tipo de conta inválido.");
                }

                // Verificando se o e-mail já está em uso
                const emailEmUso = await prisma.usuario.findUnique({
                    where: { email: email }
                })

                if (emailEmUso) {
                    return res.status(409).json("Este e-mail já está cadastrado. Faça login.");
                }

                // Criptogrando senha enviada na requisição
                const hashSenha = await bcrypt.hash(senha,10);

                // Fazendo o insert de dados no banco
                const novoUsuario = await prisma.usuario.create({
                    data: {
                        nome: nome,
                        email: email,
                        senha: hashSenha,
                        tipo: tipo || "PESSOA"
                    }
                })

                // Resposta da requisição: dados do novo usuário (sem a senha)
                res.status(201).json({
                    id: novoUsuario.id,
                    nome: novoUsuario.nome,
                    email: novoUsuario.email,
                    tipo: novoUsuario.tipo
                });
            }catch(error){
                console.log(error.message);

                // Erro no servidor
                res.status(500).json("Erro no servidor.");
            }
        },

        async logUser(req,res) {
            try {
                const { senha } = req.body;
                const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

                //  Verificando e-mail e senha
                if (!email || typeof senha !== 'string' || !senha) {
                    return res.status(400).json("Informe e-mail e senha.");
                }

                // Procurando usuário
                const usuario = await prisma.usuario.findUnique({
                    where: {
                        email: email,
                    }
                })

                // Comparando senha enviada na requisição com senha do banco
                const senhaCerta = usuario && await bcrypt.compare(senha,usuario.senha);

                // A mensagem é a mesma nos dois casos, pra não revelar qual dado está errado
                if (!senhaCerta) {
                    return res.status(401).json("E-mail ou senha incorretos.");
                }

                // Criando o payload de jwt
                const payload = {
                    id: usuario.id,
                    nome: usuario.nome,
                    tipo: usuario.tipo
                }

                //  Definindo o token jwt
                const token = jwt.sign(
                    payload,
                    process.env.MY_SECRET_KEY,
                    {
                        expiresIn:"7d"
                    }
                );

                //Realiza o login com sucesso
                res.status(200).json(token);
            }catch(error) {
                console.log(error.message)
                // Erro no servidor
                res.status(500).json("Erro no servidor.");
            }
        },

        async getUser(req,res) {
           try{
                const { id } = req.user;

                const usuario = await prisma.usuario.findUnique({
                    where:{
                        id: parseInt(id)
                    }
                })

                if (!usuario) {
                    return res.status(404).json("Usuário não encontrado.");
                }

                res.status(200).json({
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    tipo: usuario.tipo,
                    lattes: usuario.lattes,
                    lattesId: usuario.lattesId,
                    lattesDados: usuario.lattesDados,
                    lattesImportadoEm: usuario.lattesImportadoEm
                });
           }catch(error){
                console.log(error.message)
                res.status(500).json("Erro no servidor.");
           }
        }
    }
}

export default controller;
