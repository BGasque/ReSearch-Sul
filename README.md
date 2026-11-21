# ReSearch Sul

Portal de eventos e publicações acadêmicas da Região Sul do Brasil (Paraná, Santa Catarina e Rio Grande do Sul).

Trabalho de Conclusão de Curso do Técnico em Informática para Internet integrado ao Ensino Médio — IFRS, Campus Rio Grande.

- Site: https://re-search-sul.vercel.app
- API: https://researchsul-api.onrender.com

## O que o site faz

- **Catálogo público** de eventos e publicações, com busca (título, descrição, instituição, autoria, áreas e tags, sem ligar para acentos) e filtros por tipo, estado, área, instituição, tags, modalidade, forma de acesso, período e prazo aberto.
- **Cadastro e login** de pessoas (estudantes e pesquisadores) e de instituições, com "Esqueci a senha" por e-mail.
- **Perfil** com o Currículo Lattes (link público ou importação do XML exportado pelo próprio Lattes), interesses (tags, áreas, estados e tipo de conteúdo), favoritos, e os direitos da LGPD: corrigir nome e e-mail, trocar a senha, baixar os dados e apagar a conta.
- **Recomendações** que comparam os interesses do perfil com os conteúdos publicados e mostram o motivo de cada uma.
- **Área da instituição** para cadastrar, editar e arquivar eventos e publicações (só depois de o administrador verificar a instituição).
- **Reportar problema**: qualquer pessoa logada avisa sobre informação errada, link quebrado, conteúdo repetido ou fora do tema.
- **Administração**: moderar conteúdos (aprovar, recusar, pedir correção, editar, ocultar, arquivar, excluir) com histórico de cada decisão; tratar os problemas relatados; gerenciar usuários e instituições; gerenciar áreas, categorias e tags (criar, renomear, juntar, desativar).

## Tecnologias

| Parte | Tecnologias |
|---|---|
| Front-end (`frontend/`) | React, Vite, React Router, Axios, Lucide (ícones) |
| Back-end (`backend/`) | Node.js, Express, Prisma, bcrypt, JSON Web Token |
| Banco de dados | PostgreSQL (Neon) |
| Hospedagem | Vercel (site), Render (API), Neon (banco) |

## Organização das pastas

```
backend/
  controllers/   regras de cada parte (usuário, conteúdos, instituição, admin, relatos...)
  routes/        endereços da API e quem pode usar cada um
  services/      peças reaproveitadas (login, validação, e-mail, limite de tentativas...)
  prisma/        tabelas do banco (schema.prisma), mudanças (migrations) e dados de exemplo (seed)
  scripts/       cópia de segurança e restauração do banco
frontend/
  src/Components/  uma pasta por tela (Home, Detalhe, Perfil, Instituicao, Admin...)
  src/utils/       funções de apoio (login, nomes na tela)
  services/api.js  endereço da API
```

## Como rodar no computador

Pré-requisitos: Node.js 20 ou mais novo e um banco PostgreSQL gratuito no [Neon](https://neon.tech).

**Back-end**

```bash
cd backend
npm install
cp .env.example .env      # depois preencha o .env (o próprio arquivo explica cada linha)
npx prisma migrate deploy # cria as tabelas
npx prisma generate
npm run seed              # dados de exemplo (opcional)
node .
```

O servidor liga em `http://localhost:3000`.

**Front-end** (em outro terminal)

```bash
cd frontend
npm install
npm run dev
```

O site abre em `http://localhost:5173`. O endereço da API pode ser trocado pela variável `VITE_API_URL`.

## Como colocar no ar (implantação)

O site usa três serviços gratuitos. Use **um banco para o computador e outro para o site no ar** (no Neon, são duas "branches").

### 1. Banco (Neon)

1. Crie o projeto no Neon e copie a *connection string* da branch de produção.
2. Guarde no arquivo `backend/.env.producao` (ele não vai para o GitHub), na linha `DATABASE_URL=...`.
3. Crie as tabelas no banco de produção, a partir do computador:

```bash
cd backend
node --env-file=.env.producao node_modules/prisma/build/index.js migrate deploy
```

Sempre que uma mudança nova no banco (pasta `prisma/migrations`) for criada, rode esse comando **antes** de enviar o código.

### 2. API (Render)

1. No Render, crie um **Web Service** ligado a este repositório do GitHub.
2. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `node index.js`
3. Em **Environment**, crie as variáveis (os valores são os mesmos tipos do `.env.example`):
   - `DATABASE_URL`: endereço do banco de produção
   - `MY_SECRET_KEY`: chave comprida e aleatória (diferente da do computador)
   - `FRONTEND_URL`: `https://re-search-sul.vercel.app`
   - `BREVO_API_KEY` e `EMAIL_REMETENTE`: para o "Esqueci a senha" mandar e-mail
4. Cada envio (push) para a branch `main` atualiza a API sozinho. Se não atualizar, use **Manual Deploy** no painel.

O plano gratuito "dorme" depois de 15 minutos sem visitas. O robô em `.github/workflows/manter-acordado.yml` chama a rota `/saude` a cada 10 minutos para isso não acontecer.

### 3. Site (Vercel)

1. Na Vercel, importe este repositório.
2. Configure:
   - **Root Directory:** `frontend`
   - **Framework:** Vite
   - **Environment Variable:** `VITE_API_URL` = `https://researchsul-api.onrender.com`
3. Cada push para a `main` publica o site sozinho. O `frontend/vercel.json` faz os endereços das páginas (ex.: `/perfil`) funcionarem ao recarregar.

### 4. Conferir

- `https://researchsul-api.onrender.com/saude` deve responder `{"ok":true}`.
- O catálogo do site deve mostrar os conteúdos.

## Cópia de segurança (backup) e restauração

São duas proteções:

**1. Automática, pelo Neon.** O Neon guarda o histórico do banco e permite voltar no tempo (*point-in-time restore*). O período disponível depende do plano (no gratuito, algumas horas). Para usar:

1. No painel do Neon, abra o projeto e vá em **Backup & Restore** (ou **Restore**).
2. Escolha a branch de produção, a data e a hora para onde quer voltar.
3. Confirme. O Neon guarda uma cópia do estado de antes, caso precise desfazer.

**2. Manual, por arquivo.** Faça uma cópia toda semana e antes de qualquer mudança grande no banco:

```bash
cd backend
npm run backup                                          # banco do computador
node --env-file=.env.producao scripts/backup.js         # banco do site no ar
```

A cópia vai para `backend/backups/backup-DATA-HORA.json`. Essa pasta **não vai para o GitHub**, porque tem dados pessoais (nomes e e-mails). Guarde os arquivos num lugar seguro (por exemplo, um drive com acesso só da equipe) e apague as cópias antigas.

Para restaurar um arquivo (**apaga o que está no banco e coloca a cópia no lugar**):

```bash
cd backend
# 1. Primeiro, só mostra o que tem na cópia (não muda nada)
node --env-file=.env scripts/restaurar.js backups/backup-2026-11-20-18-00.json
# 2. Para restaurar de verdade
node --env-file=.env scripts/restaurar.js backups/backup-2026-11-20-18-00.json --confirmar
```

Troque `.env` por `.env.producao` para restaurar o banco do site no ar. A restauração acontece numa transação: se der erro no meio, nada é alterado. O banco precisa estar com as mesmas tabelas da cópia (rode o `migrate deploy` antes, se for um banco novo).

## Navegadores

O site foi testado no Chrome e no Edge (computador e tamanho de celular) e usa só recursos suportados pelas versões atuais do Chrome, do Firefox e do Edge.
