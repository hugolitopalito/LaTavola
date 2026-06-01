import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  onSnapshot,
  doc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBayur0I7uCelwae7NVXot19cYOD2fa0ro",
  authDomain: "latavola-99df2.firebaseapp.com",
  projectId: "latavola-99df2",
  storageBucket: "latavola-99df2.firebasestorage.app",
  messagingSenderId: "336225970527",
  appId: "1:336225970527:web:5f60e799c507931143aeea",
  measurementId: "G-XF8PMT0KGV",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const produtosRef = collection(db, "produtos");
const pedidosRef = collection(db, "pedidos");
const configRef = doc(db, "configuracoes", "geral");

const listaCardapio = document.getElementById("listaCardapio");
const botoesFiltro = document.querySelectorAll(".filtros button");
const carrinhoVazio = document.getElementById("carrinhoVazio");
const carrinhoCheio = document.getElementById("carrinhoCheio");
const itensDoCarrinho = document.getElementById("itensDoCarrinho");
const spanQtdTop = document.getElementById("qtdItensTop");
const spanSubtotal = document.getElementById("valorSubtotal");
const spanTaxa = document.getElementById("valorTaxa");
const spanTotal = document.getElementById("valorTotal");
const btnFazerPedido = document.getElementById("btnFazerPedido");
const inputTelefone = document.getElementById("clienteTelefone");

inputTelefone.addEventListener("input", function (e) {
  let valor = e.target.value.replace(/\D/g, "");
  valor = valor.substring(0, 11);
  if (valor.length > 2) {
    valor = `(${valor.substring(0, 2)}) ${valor.substring(2)}`;
  }
  if (valor.length > 9) {
    valor = `${valor.substring(0, 10)}-${valor.substring(10)}`;
  }
  e.target.value = valor;
});

let todosOsProdutos = [];
let carrinho = [];
let filtroAtual = "Todos";

let configTaxaEntrega = 8.0;
let configMinimoDelivery = 0;
let configAceitaDelivery = true;
let configRestauranteAberto = true;

onSnapshot(configRef, (docSnap) => {
  if (docSnap.exists()) {
    const cfg = docSnap.data();
    if (cfg.taxaEntrega !== undefined)
      configTaxaEntrega = Number(cfg.taxaEntrega);
    if (cfg.minimoDelivery !== undefined)
      configMinimoDelivery = Number(cfg.minimoDelivery);
    if (cfg.aceitarDelivery !== undefined)
      configAceitaDelivery = cfg.aceitarDelivery;
    if (cfg.restauranteAberto !== undefined)
      configRestauranteAberto = cfg.restauranteAberto;
    atualizarInterfaceCarrinho();
  }
});

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

function renderizarCardapio() {
  listaCardapio.innerHTML = "";
  const produtosFiltrados = todosOsProdutos.filter((prod) => {
    if (filtroAtual === "Todos") return true;
    return prod.categoria.toLowerCase() === filtroAtual.toLowerCase();
  });
  if (produtosFiltrados.length === 0) {
    listaCardapio.innerHTML =
      '<p style="color: #aaa; grid-column: span 2;">Nenhum produto encontrado nesta categoria no momento.</p>';
    return;
  }
  produtosFiltrados.forEach((produto) => {
    const itemNoCarrinho = carrinho.find((item) => item.id === produto.id);
    const quantidade = itemNoCarrinho ? itemNoCarrinho.quantidade : 0;
    const div = document.createElement("div");
    div.className = "produto-card";
    let htmlBotoes = "";
    if (quantidade === 0) {
      htmlBotoes = `<button class="btn-adicionar" data-id="${produto.id}">+ Adicionar</button>`;
    } else {
      htmlBotoes = `<div class="controles-qtd">
        <button class="btn-diminuir" data-id="${produto.id}">-</button>
        <span>${quantidade}</span>
        <button class="btn-aumentar" data-id="${produto.id}">+</button>
        </div>`;
    }
    div.innerHTML = `<div>
    <h3>${produto.nome}</h3>
    <p class="preco">R$ ${Number(produto.preco).toFixed(2)}</p>
    </div>
    <div>
    ${htmlBotoes}
    </div>`;
    listaCardapio.appendChild(div);
  });

  adicionarEventosCardapio();
}

// 4. EVENTOS DOS BOTÕES DO CARDÁPIO
function adicionarEventosCardapio() {
  document.querySelectorAll(".btn-adicionar").forEach((btn) => {
    btn.addEventListener("click", (e) =>
      alterarQuantidade(e.target.dataset.id, 1)
    );
  });
  document.querySelectorAll(".btn-aumentar").forEach((btn) => {
    btn.addEventListener("click", (e) =>
      alterarQuantidade(e.target.dataset.id, 1)
    );
  });
  document.querySelectorAll(".btn-diminuir").forEach((btn) => {
    btn.addEventListener("click", (e) =>
      alterarQuantidade(e.target.dataset.id, -1)
    );
  });
}

// 5. LÓGICA DE QUANTIDADE DO CARRINHO
function alterarQuantidade(produtoId, variacao) {
  const produtoBase = todosOsProdutos.find((p) => p.id === produtoId);
  let itemCarrinho = carrinho.find((item) => item.id === produtoId);

  if (itemCarrinho) {
    itemCarrinho.quantidade += variacao;
    if (itemCarrinho.quantidade <= 0) {
      carrinho = carrinho.filter((item) => item.id !== produtoId);
    }
  } else if (variacao > 0) {
    carrinho.push({
      id: produtoBase.id,
      nome: produtoBase.nome,
      preco: produtoBase.preco,
      quantidade: 1,
    });
  }

  renderizarCardapio();
  atualizarInterfaceCarrinho();
}

function removerDoCarrinho(produtoId) {
  carrinho = carrinho.filter((item) => item.id !== produtoId);
  renderizarCardapio();
  atualizarInterfaceCarrinho();
}

// 6. ATUALIZAR BARRA DO CARRINHO (Calculando com a Taxa Dinâmica)
function atualizarInterfaceCarrinho() {
  let subtotal = 0;
  let qtdItens = 0;
  itensDoCarrinho.innerHTML = "";

  if (carrinho.length === 0) {
    carrinhoVazio.classList.remove("escondido");
    carrinhoCheio.classList.add("escondido");
  } else {
    carrinhoVazio.classList.add("escondido");
    carrinhoCheio.classList.remove("escondido");

    carrinho.forEach((item) => {
      const totalItem = item.preco * item.quantidade;
      subtotal += totalItem;
      qtdItens += item.quantidade;

      const div = document.createElement("div");
      div.className = "item-carrinho";
      div.innerHTML = `
                <div class="item-info">
                    <strong>${item.nome}</strong>
                    <small>${item.quantidade}x R$ ${item.preco.toFixed(
        2
      )}</small>
                </div>
                <div class="item-valor">
                    R$ ${totalItem.toFixed(2)}
                    <button class="btn-remover" onclick="removerItemGlobal('${
                      item.id
                    }')">⊗</button>
                </div>
            `;
      itensDoCarrinho.appendChild(div);
    });
  }

  // Pendura a função no global para o botão ⊗ do HTML funcionar
  window.removerItemGlobal = removerDoCarrinho;

  spanQtdTop.innerText = qtdItens;
  spanSubtotal.innerText = subtotal.toFixed(2);

  // Usa a taxa de entrega vinda do painel do gerente
  spanTaxa.innerText = configTaxaEntrega.toFixed(2);
  const totalFinal = subtotal > 0 ? subtotal + configTaxaEntrega : 0;
  spanTotal.innerText = totalFinal.toFixed(2);
}

// Filtro de Categorias (Lógica e Visual)
botoesFiltro.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    botoesFiltro.forEach((b) => b.classList.remove("ativo"));
    e.target.classList.add("ativo");
    filtroAtual = e.target.getAttribute("data-categoria");
    renderizarCardapio();
  });
});

// 7. ENVIAR PEDIDO E APLICAR AS REGRAS DA GERENTE
btnFazerPedido.addEventListener("click", async () => {
  // Regra 1: O Restaurante está aberto?
  if (!configRestauranteAberto) {
    alert("Desculpe, o restaurante está fechado no momento. Volte mais tarde!");
    return;
  }

  // Regra 2: Está aceitando Delivery?
  if (!configAceitaDelivery) {
    alert(
      "Desculpe, não estamos aceitando pedidos para entrega no momento por alta demanda."
    );
    return;
  }

  const subtotal = carrinho.reduce(
    (acc, item) => acc + item.preco * item.quantidade,
    0
  );

  // Regra 3: Atingiu o valor mínimo configurado?
  if (subtotal < configMinimoDelivery) {
    const falta = configMinimoDelivery - subtotal;
    alert(
      `O valor mínimo para delivery é de R$ ${configMinimoDelivery.toFixed(
        2
      )}.\nFaltam R$ ${falta.toFixed(2)} para você poder finalizar o pedido.`
    );
    return;
  }

  const nome = document.getElementById("clienteNome").value;
  const telefone = document.getElementById("clienteTelefone").value;
  const endereco = document.getElementById("clienteEndereco").value;
  const bairro = document.getElementById("clienteBairro").value;

  if (!nome || !telefone || !endereco) {
    alert("Por favor, preencha os dados de entrega completos!");
    return;
  }

  btnFazerPedido.innerText = "Enviando ao Restaurante...";
  btnFazerPedido.disabled = true;

  const total = subtotal + configTaxaEntrega;

  const novoPedido = {
    data: new Date().toISOString(),
    status: "Aguardando Aprovação", // Cai na tela da Recepção
    cliente: { nome, telefone, endereco, bairro },
    itens: carrinho,
    resumo: { subtotal, taxaEntrega: configTaxaEntrega, total },
  };

  try {
    const docRef = await addDoc(pedidosRef, novoPedido);

    // Fica escutando esse pedido específico para ver se a Maria aprova ou recusa
    const unsubscribe = onSnapshot(doc(db, "pedidos", docRef.id), (docSnap) => {
      const dadosPedido = docSnap.data();

      if (dadosPedido.status === "Pendente") {
        alert(
          "Pedido aceito pelo restaurante! A cozinha já está preparando o seu prato."
        );

        carrinho = [];
        document.getElementById("clienteNome").value = "";
        document.getElementById("clienteTelefone").value = "";
        document.getElementById("clienteEndereco").value = "";
        document.getElementById("clienteBairro").value = "";

        renderizarCardapio();
        atualizarInterfaceCarrinho();

        btnFazerPedido.innerText = "Confirmar Pedido";
        btnFazerPedido.disabled = false;

        unsubscribe();
      } else if (dadosPedido.status === "Recusado") {
        alert(
          "O restaurante não pôde aceitar seu pedido no momento por alta demanda. Por favor, volte mais tarde."
        );

        btnFazerPedido.innerText = "Confirmar Pedido";
        btnFazerPedido.disabled = false;

        unsubscribe();
      }
    });
  } catch (error) {
    console.error("Erro ao enviar:", error);
    alert("Erro ao conectar com o restaurante. Verifique sua internet.");
    btnFazerPedido.innerText = "Confirmar Pedido";
    btnFazerPedido.disabled = false;
  }
});

// Inicializar
carregarProdutos();
