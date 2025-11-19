# Usa uma imagem base oficial do Node.js
FROM node:20-slim

# Instala as dependências necessárias do Chromium (Puppeteer)
# Esta é a parte CRÍTICA para o whatsapp-web.js funcionar
RUN apt-get update && \
    apt-get install -yq --no-install-recommends \
    gconf-service \
    libappindicator1 \
    libasound2 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libfontconfig1 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libjpeg-dev \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libgbm-dev \
    wget \
    libpcre3 \
    && rm -rf /var/lib/apt/lists/*

# Cria o diretório de trabalho
WORKDIR /usr/src/app

# Copia os arquivos de definição do projeto e instala as dependências
COPY package*.json ./
RUN npm install

# Copia o restante dos arquivos do aplicativo
COPY . .

# Expõe a porta que o servidor Node.js irá ouvir
EXPOSE 3720

# Comando para iniciar o servidor Node.js
CMD ["node", "server.js"]
