# Base
FROM node:18-alpine

# Diretório da aplicação
WORKDIR /app

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm install

# Copiar arquivo de ambiente
COPY .env ./

# Copiar o restante do código
COPY . .

# Variáveis de ambiente (backup caso .env não seja encontrado)
ENV NODE_ENV=development
ENV PORT=3000
ENV JWT_SECRET=davinci_secret

# Gerar cliente do Prisma
RUN npx prisma generate

# Expor porta
EXPOSE 3000

# Comando padrão
CMD ["npm", "run", "dev"]
    