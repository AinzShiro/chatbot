// A chave que usaremos no localStorage
const CARRINHO_STORAGE_KEY = 'lanchonete_carrinho';
const MEU_NUMERO_WHATSAPP = '5522981104283'; // <-- MUDAR PARA SEU NÚMERO

let carrinho = {}; 

/**
 * Carrega o carrinho do localStorage ao iniciar a página.
 */
function carregarCarrinho() {
    const carrinhoSalvo = localStorage.getItem(CARRINHO_STORAGE_KEY);
    if (carrinhoSalvo) {
        carrinho = JSON.parse(carrinhoSalvo);
    }
}

/**
 * Salva o carrinho no localStorage.
 */
function salvarCarrinho() {
    localStorage.setItem(CARRINHO_STORAGE_KEY, JSON.stringify(carrinho));
}


/**
 * Adiciona um item ao carrinho e salva.
 */
function adicionarAoCarrinho(id, nome, preco) {
    // Garante que 'id' é string para consistência no objeto
    const itemId = String(id); 
    
    if (carrinho[itemId]) {
        carrinho[itemId].qtd++;
    } else {
        carrinho[itemId] = { nome, preco, qtd: 1 };
    }
    
    salvarCarrinho();
    atualizarContadorCarrinho();
    alert(`${nome} adicionado ao carrinho!`); // Feedback visual
}

/**
 * Remove um item do carrinho ou diminui a quantidade, e salva.
 */
function removerDoCarrinho(id, removerTotal = false) {
    const itemId = String(id);
    if (carrinho[itemId]) {
        if (removerTotal || carrinho[itemId].qtd <= 1) {
            delete carrinho[itemId];
        } else {
            carrinho[itemId].qtd--;
        }
        salvarCarrinho();
        // Se estiver na página do carrinho, atualiza a lista de visualização
        if (document.getElementById('lista-carrinho')) {
            atualizarInterfaceCarrinho();
        }
        atualizarContadorCarrinho();
    }
}

/**
 * Atualiza o contador de itens no ícone do cabeçalho.
 */
function atualizarContadorCarrinho() {
    const contador = document.getElementById('carrinho-contador');
    if (contador) {
        let totalItens = Object.values(carrinho).reduce((sum, item) => sum + item.qtd, 0);
        contador.textContent = totalItens;
    }
}

/**
 * Renderiza a lista de itens e o total APENAS na página do carrinho.
 */
function atualizarInterfaceCarrinho() {
    const listaCarrinho = document.getElementById('lista-carrinho');
    const valorTotalSpan = document.getElementById('valor-total');
    const finalizarBtn = document.getElementById('finalizar-btn');
    let total = 0;
    
    // Só roda se a página for a de carrinho
    if (!listaCarrinho) return; 

    listaCarrinho.innerHTML = '';
    
    const ids = Object.keys(carrinho);
    if (ids.length === 0) {
        listaCarrinho.innerHTML = '<li class="carrinho-vazio">Seu carrinho está vazio.</li>';
        valorTotalSpan.textContent = 'R$ 0,00';
        if(finalizarBtn) finalizarBtn.disabled = true;
        return;
    }

    ids.forEach(id => {
        const item = carrinho[id];
        const subtotal = item.preco * item.qtd;
        total += subtotal;

        const li = document.createElement('li');
        li.innerHTML = `
            <div>${item.qtd}x ${item.nome}</div>
            <div>
                R$ ${subtotal.toFixed(2)}
                <button class="btn-sm" onclick="adicionarAoCarrinho(${id}, '${item.nome}', ${item.preco})">+</button>
                <button class="btn-sm" onclick="removerDoCarrinho(${id})">-</button>
                <button class="btn-sm-remover" onclick="removerDoCarrinho(${id}, true)">Remover</button>
            </div>
        `;
        listaCarrinho.appendChild(li);
    });

    valorTotalSpan.textContent = `R$ ${total.toFixed(2)}`;
    if(finalizarBtn) finalizarBtn.disabled = false;
}

/**
 * Monta a mensagem final do pedido com os dados de entrega/pagamento.
 */
function montarPedidoWhatsApp() {
    // 1. Validar o carrinho e os dados do formulário
    if (Object.keys(carrinho).length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    const nome = document.getElementById('nome').value;
    const endereco = document.getElementById('endereco').value;
    const pagamento = document.getElementById('pagamento').value;
    const observacoes = document.getElementById('observacoes').value;

    if (!nome || !endereco || !pagamento) {
        alert('Por favor, preencha seu nome, endereço e forma de pagamento.');
        return;
    }

    // 2. Montar o texto do Pedido
    let total = 0;
    let mensagem = '*🍕 NOVO PEDIDO - [Nome da sua Lanchonete] 🚀*\n\n';
    
    // Dados do Cliente
    mensagem += `*DADOS DO CLIENTE:*\n`;
    mensagem += `👤 Nome: ${nome}\n`;
    mensagem += `📍 Endereço: ${endereco}\n`;
    mensagem += `💳 Pagamento: ${pagamento}\n`;
    if (observacoes) {
        mensagem += `📝 Obs: ${observacoes}\n`;
    }
    mensagem += `---------------------------\n\n`;

    // Itens do Pedido
    mensagem += '*ITENS DO PEDIDO:*\n';
    Object.keys(carrinho).forEach(id => {
        const item = carrinho[id];
        const subtotal = item.preco * item.qtd;
        total += subtotal;
        mensagem += `• ${item.qtd}x ${item.nome} (R$ ${subtotal.toFixed(2)})\n`;
    });

    mensagem += `\n*VALOR TOTAL: R$ ${total.toFixed(2)}*\n\n`;
    mensagem += '*AGUARDANDO CONFIRMAÇÃO.*';

    // 3. Gerar e abrir o link
    const mensagemCodificada = encodeURIComponent(mensagem);
    const linkWhatsApp = `https://api.whatsapp.com/send?phone=${MEU_NUMERO_WHATSAPP}&text=${mensagemCodificada}`;
    
    // Limpar o carrinho e abrir o WhatsApp
    carrinho = {};
    salvarCarrinho(); 
    window.open(linkWhatsApp, '_blank');
}


// --- Inicialização ---

carregarCarrinho(); // Carrega o carrinho ao iniciar a página
atualizarContadorCarrinho(); // Garante que o contador no cabeçalho está correto

// Se estiver na página do carrinho, renderiza os detalhes
if (document.getElementById('lista-carrinho')) {
    atualizarInterfaceCarrinho();
}