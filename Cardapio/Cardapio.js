import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  onSnapshot,
  doc
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

// SUAS CREDENCIAIS DO FIREBASE
const firebaseConfig = {
    apiKey: 'AIzaSyBayur0I7uCelwae7NVXot19cYOD2fa0ro',
    authDomain: 'latavola-99df2.firebaseapp.com',
    projectId: 'latavola-99df2',
    storageBucket: 'latavola-99df2.firebasestorage.app',
    messagingSenderId: '336225970527',
    appId: '1:336225970527:web:5f60e799c507931143aeea',
    measurementId: 'G-XF8PMT0KGV',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const produtosRef = collection(db, 'produtos');
const pedidosRef = collection(db, 'pedidos');
const configRef = doc(db, 'configuracoes', 'geral');

// Elementos da interface
const listaCardapio = document.getElementById('listaCardapio');
const botoesFiltro = document.querySelectorAll('.filtros button');
const carrinhoVazio = document.getElementById('carrinhoVazio');
const carrinhoCheio = document.getElementById('carrinhoCheio');
const itensDoCarrinho = document.getElementById('itensDoCarrinho');
const spanQtdTop = document.getElementById('qtdItensTop');
const spanSubtotal = document.getElementById('valorSubtotal');
const spanTotal = document.getElementById('valorTotal');
const btnFazerPedido = document.getElementById('btnFazerPedido');

// Estado da Aplicação
let todosOsProdutos = [];
let carrinho = [];
let filtroAtual = 'Todos';

// VARIÁVEIS DE CONFIGURAÇÃO (Sincronizadas com a Gerência)
let configTaxaEntrega = 8.00;
let configMinimoDelivery = 0;
let configAceitaDelivery = true;
let configRestauranteAberto = true;

// 1. ESCUTAR CONFIGURAÇÕES DA GERENTE EM TEMPO REAL
onSnapshot(configRef, (docSnap) => {
    if (docSnap.exists()) {
        const cfg = docSnap.data();
        if (cfg.taxaEntrega !== undefined) configTaxaEntrega = Number(cfg.taxaEntrega);
        if (cfg.minimoDelivery !== undefined) configMinimoDelivery = Number(cfg.minimoDelivery);
        if (cfg.aceitarDelivery !== undefined) configAceitaDelivery = cfg.aceitarDelivery;
        if (cfg.restauranteAberto !== undefined) configRestauranteAberto = cfg.restauranteAberto;

        // Se a gerente mudar a taxa enquanto o cliente monta o pedido, atualiza o carrinho na hora!
        atualizarInterfaceCarrinho();
    }
});

// 2. CARREGAR PRODUTOS DO BANCO
async function carregarProdutos() {
    const querySnapshot = await getDocs(produtosRef);
    todosOsProdutos = [];
    
    querySnapshot.forEach((doc) => {
        const produto = doc.data();
        if (produto.ativo) {
            todosOsProdutos.push({ id: doc.id, ...produto });
        }
    });

    renderizarCardapio();
}

// 3. RENDERIZAR O CARDÁPIO
function renderizarCardapio() {
    listaCardapio.innerHTML = '';
    
    const produtosFiltrados = todosOsProdutos.filter(prod => {
        if (filtroAtual === 'Todos') return true;
        return prod.categoria.toLowerCase() === filtroAtual.toLowerCase();
    });

    if (produtosFiltrados.length === 0) {
        listaCardapio.innerHTML = '<p>Nenhum produto encontrado nesta categoria.</p>';
        return;
    }

    produtosFiltrados.forEach(produto => {
        const itemNoCarrinho = carrinho.find(item => item.id === produto.id);
        const quantidade = itemNoCarrinho ? itemNoCarrinho.quantidade : 0;

        const div = document.createElement('div');
        div.className = 'produto-card';
        
        let htmlBotoes = '';
        if (quantidade === 0) {
            htmlBotoes = `<button class="btn-adicionar" data-id="${produto.id}">+ Adicionar</button>`;
        } else {
            htmlBotoes = `
                <div style="display: flex; justify-content: center; gap: 15px; align-items: center; margin-top: 10px;">
                    <button class="btn-diminuir" data-id="${produto.id}">-</button>
                    <span>${quantidade}</span>
                    <button class="btn-aumentar" data-id="${produto.id}">+</button>
                </div>
            `;
        }

        div.innerHTML = `
            <h3>${produto.nome}</h3>
            <p style="color: #b8860b; font-weight: bold; font-size: 1.2em;">R$ ${Number(produto.preco).toFixed(2)}</p>
            ${htmlBotoes}
        `;
        
        listaCardapio.appendChild(div);
    });

    adicionarEventosCardapio();
}

// 4. EVENTOS DOS BOTÕES DO CARDÁPIO
function adicionarEventosCardapio() {
    document.querySelectorAll('.btn-adicionar').forEach(btn => {
        btn.addEventListener('click', (e) => alterarQuantidade(e.target.dataset.id, 1));
    });
    document.querySelectorAll('.btn-aumentar').forEach(btn => {
        btn.addEventListener('click', (e) => alterarQuantidade(e.target.dataset.id, 1));
    });
    document.querySelectorAll('.btn-diminuir').forEach(btn => {
        btn.addEventListener('click', (e) => alterarQuantidade(e.target.dataset.id, -1));
    });
}

// 5. LÓGICA DE QUANTIDADE DO CARRINHO
function alterarQuantidade(produtoId, variacao) {
    const produtoBase = todosOsProdutos.find(p => p.id === produtoId);
    let itemCarrinho = carrinho.find(item => item.id === produtoId);

    if (itemCarrinho) {
        itemCarrinho.quantidade += variacao;
        if (itemCarrinho.quantidade <= 0) {
            carrinho = carrinho.filter(item => item.id !== produtoId);
        }
    } else if (variacao > 0) {
        carrinho.push({
            id: produtoBase.id,
            nome: produtoBase.nome,
            preco: produtoBase.preco,
            quantidade: 1
        });
    }

    renderizarCardapio();
    atualizarInterfaceCarrinho();
}

function removerDoCarrinho(produtoId) {
    carrinho = carrinho.filter(item => item.id !== produtoId);
    renderizarCardapio();
    atualizarInterfaceCarrinho();
}

// 6. ATUALIZAR BARRA DO CARRINHO (Calculando com a Taxa Dinâmica)
function atualizarInterfaceCarrinho() {
    let subtotal = 0;
    let qtdItens = 0;
    itensDoCarrinho.innerHTML = '';

    if (carrinho.length === 0) {
        carrinhoVazio.classList.remove('escondido');
        carrinhoCheio.classList.add('escondido');
    } else {
        carrinhoVazio.classList.add('escondido');
        carrinhoCheio.classList.remove('escondido');

        carrinho.forEach(item => {
            const totalItem = item.preco * item.quantidade;
            subtotal += totalItem;
            qtdItens += item.quantidade;

            const div = document.createElement('div');
            div.className = 'item-carrinho';
            div.innerHTML = `
                <div>
                    <strong>${item.nome}</strong><br>
                    <small>${item.quantidade}x R$ ${item.preco.toFixed(2)}</small>
                </div>
                <div>
                    <strong>R$ ${totalItem.toFixed(2)}</strong>
                    <button style="color: red; border: none; background: none; cursor: pointer; margin-left: 10px;" onclick="removerItemGlobal('${item.id}')">❌</button>
                </div>
            `;
            itensDoCarrinho.appendChild(div);
        });
    }

    window.removerItemGlobal = removerDoCarrinho;

    spanQtdTop.innerText = qtdItens;
    spanSubtotal.innerText = subtotal.toFixed(2);
    
    // Usa a taxa de entrega vinda do painel do gerente
    const totalFinal = subtotal > 0 ? subtotal + configTaxaEntrega : 0;
    spanTotal.innerText = totalFinal.toFixed(2);
}

// Filtro de Categorias
botoesFiltro.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filtroAtual = e.target.getAttribute('data-categoria');
        renderizarCardapio();
    });
});

// 7. ENVIAR PEDIDO E APLICAR AS REGRAS DA GERENTE
btnFazerPedido.addEventListener('click', async () => {
    
    // Regra 1: O Restaurante está aberto?
    if (!configRestauranteAberto) {
        alert("Desculpe, o restaurante está fechado no momento. Volte mais tarde!");
        return;
    }

    // Regra 2: Está aceitando Delivery?
    if (!configAceitaDelivery) {
        alert("Desculpe, não estamos aceitando pedidos para entrega no momento por alta demanda.");
        return;
    }

    const subtotal = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

    // Regra 3: Atingiu o valor mínimo configurado?
    if (subtotal < configMinimoDelivery) {
        const falta = configMinimoDelivery - subtotal;
        alert(`O valor mínimo para delivery é de R$ ${configMinimoDelivery.toFixed(2)}.\nFaltam R$ ${falta.toFixed(2)} para você poder finalizar o pedido.`);
        return;
    }

    const nome = document.getElementById('clienteNome').value;
    const telefone = document.getElementById('clienteTelefone').value;
    const endereco = document.getElementById('clienteEndereco').value;
    const bairro = document.getElementById('clienteBairro').value;

    if (!nome || !telefone || !endereco) {
        alert("Por favor, preencha os dados de entrega!");
        return;
    }

    btnFazerPedido.innerText = "Aguardando aprovação do restaurante...";
    btnFazerPedido.disabled = true;

    const total = subtotal + configTaxaEntrega;

    const novoPedido = {
        data: new Date().toISOString(),
        status: "Aguardando Aprovação", 
        cliente: { nome, telefone, endereco, bairro },
        itens: carrinho,
        resumo: { subtotal, taxaEntrega: configTaxaEntrega, total }
    };

    try {
        const docRef = await addDoc(pedidosRef, novoPedido);
        
        const unsubscribe = onSnapshot(doc(db, 'pedidos', docRef.id), (docSnap) => {
            const dadosPedido = docSnap.data();
            
            if (dadosPedido.status === "Pendente") {
                alert("Pedido aceito! A cozinha já está preparando o seu pedido.");
                
                carrinho = [];
                document.getElementById('clienteNome').value = '';
                document.getElementById('clienteTelefone').value = '';
                document.getElementById('clienteEndereco').value = '';
                document.getElementById('clienteBairro').value = '';
                
                renderizarCardapio();
                atualizarInterfaceCarrinho();
                
                btnFazerPedido.innerText = "Fazer Pedido";
                btnFazerPedido.disabled = false;
                
                unsubscribe(); 
            } 
            else if (dadosPedido.status === "Recusado") {
                alert("Não foi possível realizar o pedido neste momento por conta de uma demanda muito alta. Por favor, volte mais tarde.");
                
                btnFazerPedido.innerText = "Fazer Pedido";
                btnFazerPedido.disabled = false;
                
                unsubscribe(); 
            }
        });
        
    } catch (error) {
        console.error("Erro ao enviar:", error);
        alert("Erro ao conectar com o restaurante. Verifique sua internet.");
        btnFazerPedido.innerText = "Fazer Pedido";
        btnFazerPedido.disabled = false;
    }
});

// Inicializar
carregarProdutos();