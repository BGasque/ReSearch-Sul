# ReSearch Sul

Portal de eventos e publicações acadêmicas da Região Sul do Brasil (Paraná, Santa Catarina e Rio Grande do Sul).

Trabalho de Conclusão de Curso do Técnico em Informática para Internet integrado ao Ensino Médio — IFRS, Campus Rio Grande.

## O que o site faz

- **Catálogo público** de eventos e publicações, com busca por nome, instituição, autor ou tag e filtros por tipo, estado, área, instituição e tags.
- **Cadastro e login** de pessoas (estudantes e pesquisadores) e de instituições.
- **Perfil** com o Currículo Lattes (link público ou importação do XML exportado pelo próprio Lattes), tags preferidas, áreas e estados de interesse.
- **Recomendações** que comparam as tags, áreas e estados do perfil com os conteúdos publicados.
- **Área da instituição** para cadastrar, editar e arquivar eventos e publicações.
- **Moderação do administrador**: aprovar, recusar (com motivo), editar e excluir conteúdos, e gerenciar as tags.

## Tecnologias

| Parte | Tecnologias |
|---|---|
| Front-end (`frontend/`) | React, Vite, React Router, Axios, Lucide (ícones) |
| Back-end (`backend/`) | Node.js, Express, Prisma, bcrypt, JSON Web Token |
| Banco de dados | MySQL / MariaDB |

## Como rodar no computador

Pré-requisitos: Node.js e o MySQL do XAMPP ligado.

**Back-end**

```bash
cd backend
npm install
cp .env.example .env      # depois edite o .env
npx prisma migrate dev    # cria as tabelas
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
