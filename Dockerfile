# Base
FROM node:18-alpine

# Diretório da aplicação
WORKDIR /app

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm install

# Copiar o restante do código
COPY . .

# Gerar cliente do Prisma
RUN npx prisma generate

# Expor porta
EXPOSE 3000

# Comando padrão
CMD ["npm", "run", "dev"]
    