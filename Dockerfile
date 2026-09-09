# syntax=docker/dockerfile:1

# Node 22+ é necessário por causa do módulo nativo node:sqlite.
FROM node:22-slim

WORKDIR /app

# Instala apenas as dependências de produção primeiro (aproveita o cache do Docker).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copia o restante do código.
COPY . .

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
# Caminho padrão do banco dentro do volume montado (ver fly.toml / DATABASE_PATH).
ENV DATABASE_PATH=/data/eventplatform.db

EXPOSE 8080

CMD ["node", "src/server.js"]
