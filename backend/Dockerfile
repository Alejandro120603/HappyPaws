# backend/Dockerfile

FROM node:20-alpine
WORKDIR /usr/src/app

# Copia e instala las dependencias (CRÍTICO: Esto crea node_modules dentro del contenedor)
COPY package*.json ./
RUN npm install

# Copia el resto del código del servidor (server.js, etc.)
COPY . .

EXPOSE 3000
CMD [ "node", "server.js" ]