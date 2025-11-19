# Usa uma imagem base oficial do Node.js
FROM node:20-slim

# Define o user para evitar problemas de permissão com o Puppeteer
ENV PUPPETEER_SKIP_DOWNLOAD=true
# Define o caminho do executável do Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Instala as dependências necessárias do Chromium (Puppeteer)
RUN apt-get update && \
    apt-get install -yq --no-install-recommends \
    chromium \
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
RUN npm install --omit=dev

# Copia o restante dos arquivos do aplicativo
COPY . .

# Comando para iniciar o servidor Node.js
CMD ["node", "server.js"]
