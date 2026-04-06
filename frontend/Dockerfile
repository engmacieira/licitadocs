# Estágio 1: Build (Node.js)
FROM node:22-alpine as builder
WORKDIR /app

# Copia dependências e instala
COPY package*.json ./
RUN npm install

# Copia o resto do código e faz o build
COPY . .
RUN npm run build

# Estágio 2: Servidor Web (Nginx)
FROM nginx:alpine
# Copia os arquivos estáticos gerados na etapa anterior para a pasta pública do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Expõe a porta padrão da web
EXPOSE 80

# Inicia o Nginx
CMD ["nginx", "-g", "daemon off;"]