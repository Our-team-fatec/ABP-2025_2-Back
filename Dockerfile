# Use Node.js 18 como base
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json (se existir)
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Instalar dependências de desenvolvimento para o ts-node-dev
RUN npm install -D ts-node-dev typescript @types/node

# Copiar código fonte
COPY . .

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Dar permissões ao usuário
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expor porta
EXPOSE 3000

# Comando para desenvolvimento (com hot reload)
CMD ["npm", "run", "dev"]
