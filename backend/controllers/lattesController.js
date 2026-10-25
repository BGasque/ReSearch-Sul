import prisma from '../services/adapter.js';
import { extrairIdLattes, lerXmlLattes } from '../services/lattes.js';

// Mensagem quando o currículo já pertence a outra conta
const JA_VINCULADO = "Este Currículo Lattes já está vinculado a outra conta. Se ele é seu, fale com o administrador.";

// Confere se outro usuário já usa esse número de currículo
async function usadoPorOutraConta(lattesId, usuarioId) {
    const outro = await prisma.usuario.findFirst({ where: { lattesId, NOT: { id: usuarioId } } });
    return Boolean(outro);
}

// Associação do Currículo Lattes ao perfil.
// Não existe login pelo Lattes: o usuário só informa o link público ou envia o XML do próprio currículo.
// A senha do Lattes nunca é pedida nem guardada.
function controller() {
    return {
        get prisma() {
            return prisma;
        },

        // Salvar (ou remover) o link público do Lattes
        async salvarLink(req, res) {
            try {
                const { id } = req.user;
                const { lattes } = req.body;

                // Campo vazio: remove a associação e os dados importados
                if (!lattes) {
                    await prisma.usuario.update({
                        where: { id },
                        data: { lattes: null, lattesId: null, lattesDados: null, lattesImportadoEm: null }
                    });
                    return res.status(200).json("Currículo Lattes desassociado.");
                }

                const lattesId = extrairIdLattes(lattes);
                if (!lattesId) {
                    return res.status(400).json("Link inválido. Use o formato http://lattes.cnpq.br/ seguido dos 16 números do currículo.");
                }

                if (await usadoPorOutraConta(lattesId, id)) {
                    return res.status(409).json(JA_VINCULADO);
                }

                const usuario = await prisma.usuario.findUnique({ where: { id } });

                // Se trocou de currículo, os dados importados do antigo deixam de valer
                const trocouCurriculo = usuario.lattesId && usuario.lattesId !== lattesId;

                await prisma.usuario.update({
                    where: { id },
                    data: {
                        lattes: `http://lattes.cnpq.br/${lattesId}`,
                        lattesId,
                        ...(trocouCurriculo && { lattesDados: null, lattesImportadoEm: null })
                    }
                });

                res.status(200).json("Currículo Lattes associado.");
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        },

        // Importar os dados públicos a partir do XML (ou .zip) exportado pelo próprio Lattes
        async importarXml(req, res) {
            try {
                const { id } = req.user;
                const { arquivo } = req.body; // conteúdo do arquivo em base64

                if (!arquivo) {
                    return res.status(400).json("Envie o arquivo XML do Lattes.");
                }

                let lido;
                try {
                    lido = lerXmlLattes(arquivo);
                } catch (error) {
                    return res.status(400).json(error.message);
                }

                if (await usadoPorOutraConta(lido.lattesId, id)) {
                    return res.status(409).json(JA_VINCULADO);
                }

                const usuario = await prisma.usuario.findUnique({ where: { id } });

                // O XML precisa ser do mesmo currículo que está associado ao perfil
                if (usuario.lattesId && usuario.lattesId !== lido.lattesId) {
                    return res.status(409).json(`Este XML é de outro currículo (${lido.lattesId}). Confira o link associado ao seu perfil.`);
                }

                await prisma.usuario.update({
                    where: { id },
                    data: {
                        lattes: `http://lattes.cnpq.br/${lido.lattesId}`,
                        lattesId: lido.lattesId,
                        lattesDados: lido.dados,
                        lattesImportadoEm: new Date()
                    }
                });

                res.status(200).json(lido.dados);
            } catch (error) {
                console.log(error.message);
                res.status(500).json("Erro no servidor.");
            }
        }
    }
}

export default controller;
