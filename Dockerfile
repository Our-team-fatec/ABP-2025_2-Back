# Base com Node.js e Python
FROM node:18-alpine

# Instalar Python e pip
RUN apk add --no-cache python3 py3-pip

# Diretório da aplicação
WORKDIR /app

# Copiar package.json e instalar dependências do Node
COPY package*.json ./
RUN npm install

# Copiar requirements.txt e instalar dependências do Python
COPY src/IA/requirements.txt ./src/IA/
RUN pip3 install --no-cache-dir -r src/IA/requirements.txt --break-system-packages

# Copiar o restante do código
COPY . .

# Gerar cliente do Prisma
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# Expor porta
EXPOSE 3000

# Comando padrão para produção
CMD ["npm", "start"]
    