// server.js

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
// Certifique-se de ter instalado o whatsapp-web.js: npm install whatsapp-web.js
const { Client, LocalAuth } = require('whatsapp-web.js'); 
const humanTakeover = {}; // Armazena os IDs de chat em atendimento humano

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 3720; // Porta de Servidor

// Configuração do WhatsApp Client
let client = null;
let clientStatus = 'DISCONNECTED';

// --- Funções de Controle do Chatbot ---

function initializeClient() {
    if (client) {
        console.log('Cliente já está em processo de inicialização ou conectado.');
        return;
    }

    // Cria uma nova instância do cliente
    // A configuração do puppeteer (chrome) foi removida,
    // pois o WwebJS cuidará do download/configuração no Windows.
    client = new Client({
        authStrategy: new LocalAuth(), // Usa a LocalAuth para salvar a sessão
        puppeteer: {
             // O bloco Puppeteer customizado para Termux foi REMOVIDO/COMENTADO.
             // O WwebJS usa o Chromium embutido por padrão.
             args: ['--no-sandbox', '--disable-setuid-sandbox'], // Argumentos essenciais de segurança
        }
    });

    clientStatus = 'INITIALIZING';
    console.log('Iniciando o cliente WhatsApp...');

    // Evento de QR Code
    client.on('qr', (qr) => {
        clientStatus = 'QR_CODE_READY';
        console.log('QR RECEIVED:', qr);
        // Envia o QR Code para o frontend via Socket.io
        io.emit('qr', qr);
    });

    // Evento de Conexão Bem-Sucedida
    client.on('ready', () => {
        clientStatus = 'CONNECTED';
        console.log('CLIENT IS READY!');
        io.emit('status', 'Conectado');
    });

    // Evento de Desconexão
    client.on('disconnected', (reason) => {
        clientStatus = 'DISCONNECTED';
        console.log('Client was disconnected', reason);
        io.emit('status', `Desconectado (${reason})`);
        
        // Limpa a instância do cliente
        if (client) {
            client.destroy();
            client = null;
        }
    });

    // --- Lógica do Chatbot de Resposta ---
    client.on('message', message => {
        const chatId = message.from; 
        const body = message.body.toLowerCase().trim();
        const SECRET_KEYWORD = '!chatbot'; // Palavra-chave secreta para reativar

        let response = null; // <<< CORREÇÃO DE BUG: Garante que a variável esteja definida

        // SEÇÃO A: REATIVAÇÃO
        if (body === SECRET_KEYWORD && humanTakeover[chatId]) {
            delete humanTakeover[chatId]; // Remove o chat do controle humano
            message.reply('🤖 **Modo Chatbot Reativado.** O assistente virtual está de volta!');
            return; // Pára de processar a mensagem
        }

        // SEÇÃO B: IGNORAR MENSAGENS (Atendimento Humano)
        if (humanTakeover[chatId]) {
            console.log(`Mensagem de ${chatId} ignorada. Atendimento humano em curso.`);
            return; 
        }

        if (clientStatus !== 'CONNECTED') return; // Ignora mensagens se não estiver pronto

        // Se o cliente for um grupo, não responder
        if (message.isGroup) return;

        // O fluxo principal que o usuário solicitou
        switch (body) {
            case '1': // Pedido/Site
                response = 'Ótimo! Você pode fazer seu pedido diretamente pelo nosso site. É rápido e seguro: **[http://192.168.3.22:3756/]**';
                break;
            case '2': // Endereço
                response = 'Nosso endereço é: **Rua da Lanchonete, 123 - Centro, Sua Cidade.** \n\n🔗 Link do Google Maps: [Link Maps]';
                break;
            case '3': // Atendente Humano
                // Opcional: Aqui você pode registrar o chat para ser notificado no dashboard
                humanTakeover[chatId] = true; // Coloca o chat em modo atendimento humano
                response = 'Entendido! Já estou chamando um de nossos atendentes. Por favor, aguarde um momento. O atendimento será retomado por uma pessoa. Para reativar o chatbot, envie a palavra-chave !chatbot';
                break;
            default:
                // Mensagem de boas-vindas e opções
                response = `
Olá, boa noite! Bem-vindo ao Paraíso do Dogão e Lanches! 🍔🌭🍟

Hoje é um ótimo dia para satisfazer seu apetite com nossos lanches irresistíveis! Para conferir nosso cardápio, acesse http://192.168.3.22:3756/ e escolha suas delícias favoritas. Assim que decidir, envie seu pedido junto com o endereço completo para entrega, e nós prepararemos tudo com muito carinho!

Estamos ansiosos para atender você! 😋

🍔 **1 - Quero Fazer Meu Pedido (Acessar o Cardápio/Site)**
📍 **2 - Qual o Endereço da Lanchonete?**
🗣️ **3 - Falar com um Atendente Humano**
`;
                break;
        }

        if (response) {
            // Envia a resposta de volta ao cliente
            message.reply(response);
        }
    });

    client.initialize().catch(err => {
        console.error('Erro ao inicializar o WhatsApp Client:', err);
        clientStatus = 'DISCONNECTED';
        client = null;
        io.emit('status', 'Erro na Inicialização');
    });
}

// --- Rotas e Servidor Web (Express) ---

// Serve arquivos estáticos da pasta 'public'
// Certifique-se de que a pasta 'public' existe dentro de 'chatbot'.
app.use(express.static(path.join(__dirname, 'public')));

// Rota para a inicialização do chatbot (Chamada pelo botão do frontend)
app.post('/start', (req, res) => {
    if (clientStatus === 'CONNECTED' || clientStatus === 'INITIALIZING' || clientStatus === 'QR_CODE_READY') {
        return res.json({ success: false, message: 'Chatbot já está em execução ou conectando.' });
    }
    initializeClient();
    res.json({ success: true, message: 'Inicialização do Chatbot solicitada.' });
});

// Rota para encerrar/desconectar o chatbot
app.post('/stop', async (req, res) => {
    if (client) {
        try {
            await client.destroy();
            client = null;
            clientStatus = 'DISCONNECTED';
            console.log('Chatbot encerrado com sucesso.');
            io.emit('status', 'Encerrado');
            return res.json({ success: true, message: 'Chatbot encerrado.' });
        } catch (e) {
            console.error('Erro ao destruir o cliente:', e);
            clientStatus = 'DISCONNECTED';
            client = null; // Tenta limpar mesmo com erro
            return res.json({ success: false, message: 'Erro ao encerrar o chatbot.' });
        }
    }
    res.json({ success: true, message: 'Chatbot já estava desconectado.' });
});

// WebSocket (Socket.io) para comunicação em tempo real
io.on('connection', (socket) => {
    console.log('Usuário conectado ao dashboard.');
    // Envia o status atual assim que o dashboard se conecta
    const currentStatus = clientStatus === 'CONNECTED' ? 'Conectado' : (clientStatus === 'QR_CODE_READY' ? 'Aguardando QR' : 'Desconectado');
    socket.emit('status', currentStatus);
});


// Inicia o servidor HTTP
server.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log('Acesse o endereço para ver o Painel de Controle.');
});