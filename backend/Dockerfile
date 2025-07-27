# Usa a imagem oficial do Node.js LTS
FROM node:18-alpine

# Define diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copia package.json e package-lock.json para instalar dependências
COPY package*.json ./

# Instala dependências (prod + dev)
RUN npm install --production

# Copia todo o código para dentro do container
COPY . .

# Expõe a porta em que o app vai rodar
EXPOSE 3001

# Define variável de ambiente para a porta (opcional, pode ser passado no container)
ENV PORT=3001

# Comando para rodar o servidor
CMD ["node", "server.js"]
