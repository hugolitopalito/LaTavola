import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
const nomeLogado = localStorage.getItem("usuarioLogado");
const perfilLogado = localStorage.getItem("perfilLogado");

const elNome = document.getElementById("headerNomeUsuario");
const elPerfil = document.getElementById("headerPerfilUsuario");

if (elNome && elPerfil) {
  if (nomeLogado && perfilLogado) {
    elNome.innerText = nomeLogado;
    elPerfil.innerText = perfilLogado;
  } else {
    elNome.innerText = "Visitante";
    elPerfil.innerText = "Sem Perfil";
  }
}

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

const params = new URLSearchParams(window.location.search);
const mesaId = params.get("mesa");

if (!mesaId) {
  alert("Nenhuma mesa selecionada!");
  window.location.href = "../Garcom.html";
}

document.getElementById("btnVoltar").href = `../MesaGarcom.html?mesa=${mesaId}`;

const tituloHeader = document.getElementById("tituloHeader");
const txtPessoasMesa = document.getElementById("txtPessoasMesa");
const containerCadeiras = document.getElementById("containerCadeiras");
const listaProdutos = document.getElementById("listaProdutos");
const botoesFiltro = document.querySelectorAll(".filtros button");
const itensCarrinho = document.getElementById("itensCarrinho");
const boxTotais = document.getElementById("boxTotais");
const qtdTotalItens = document.getElementById("qtdTotalItens");
const valorTotalCarrinho = document.getElementById("valorTotalCarrinho");
const btnConfirmarPedido = document.getElementById("btnConfirmarPedido");

let dadosMesa = {};
let todosOsProdutos = [];
let carrinho = [];
let cadeiraAtual = "Sem Cadeira";
let filtroAtual = "Todos";

async function inicializar() {
  try {
    const docSnap = await getDoc(doc(db, "mesas", mesaId));
    if (docSnap.exists()) {
      dadosMesa = docSnap.data();
      tituloHeader.innerText = `Mesa ${dadosMesa.numero} - Adicionar Itens`;
      txtPessoasMesa.innerText = `${dadosMesa.pessoas} pessoas na mesa`;
      for (let i = 1; i <= dadosMesa.pessoas; i++) {
        containerCadeiras.innerHTML += `<button class="btn-cadeira" data-cadeira="Cadeira ${i}">Cadeira ${i}</button>`;
      }
      configurarEventosCadeira();
    }
    await carregarCardapio();
  } catch (error) {
    console.error("Erro na inicialização:", error);
  }
}

function configurarEventosCadeira() {
  const botoes = document.querySelectorAll(".btn-cadeira");
  botoes.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      botoes.forEach((b) => b.classList.remove("ativo"));
      e.target.classList.add("ativo");
      cadeiraAtual = e.target.getAttribute("data-cadeira");
    });
  });
}
async function carregarCardapio() {
  const querySnapshot = await getDocs(collection(db, "produtos"));
  todosOsProdutos = [];
  querySnapshot.forEach((doc) => {
    const produto = doc.data();
    if (produto.ativo) {
      todosOsProdutos.push({ id: doc.id, ...produto });
    }
  });
  renderizarProdutos();
}

function renderizarProdutos() {
  listaProdutos.innerHTML = "";

  const filtrados = todosOsProdutos.filter(
    (prod) =>
      filtroAtual === "Todos" ||
      prod.categoria.toLowerCase() === filtroAtual.toLowerCase()
  );

  if (filtrados.length === 0) {
    listaProdutos.innerHTML =
      '<p style="color: #aaa;">Nenhum produto nesta categoria.</p>';
    return;
  }

  filtrados.forEach((produto) => {
    const itemCart = carrinho.find(
      (item) => item.id === produto.id && item.cadeira === cadeiraAtual
    );
    const qtd = itemCart ? itemCart.quantidade : 0;

    let controlesHTML = "";
    if (qtd === 0) {
      controlesHTML = `<button class="btn-add" onclick="alterarCarrinho('${produto.id}', 1)">Adicionar</button>`;
    } else {
      controlesHTML = `
                <div class="controles-qtd">
                    <button onclick="alterarCarrinho('${produto.id}', -1)">-</button>
                    <span style="padding: 0 10px;">${qtd}</span>
                    <button onclick="alterarCarrinho('${produto.id}', 1)">+</button>
                </div>
            `;
    }

    listaProdutos.innerHTML += `
            <div class="produto-item">
                <div>
                    <strong style="font-size: 1.1em;">${
                      produto.nome
                    }</strong><br>
                    <span style="color: #aaa; font-size: 0.85em;">${
                      produto.categoria
                    }</span><br>
                    <strong style="color: #d4af37; font-size: 1.1em; display: inline-block; margin-top: 5px;">R$ ${produto.preco.toFixed(
                      2
                    )}</strong>
                </div>
                <div>
                    ${controlesHTML}
                </div>
            </div>
        `;
  });
  window.alterarCarrinho = alterarQuantidade;
}

// 4. Lógica do Carrinho (Filtro)
botoesFiltro.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    botoesFiltro.forEach((b) => b.classList.remove("ativo"));
    e.target.classList.add("ativo");
    filtroAtual = e.target.getAttribute("data-categoria");
    renderizarProdutos();
  });
});

function alterarQuantidade(produtoId, variacao) {
  const produtoBase = todosOsProdutos.find((p) => p.id === produtoId);
  let itemCarrinho = carrinho.find(
    (item) => item.id === produtoId && item.cadeira === cadeiraAtual
  );

  if (itemCarrinho) {
    itemCarrinho.quantidade += variacao;
    if (itemCarrinho.quantidade <= 0) {
      carrinho = carrinho.filter(
        (item) => !(item.id === produtoId && item.cadeira === cadeiraAtual)
      );
    }
  } else if (variacao > 0) {
    carrinho.push({
      id: produtoBase.id,
      nome: produtoBase.nome,
      preco: produtoBase.preco,
      categoria: produtoBase.categoria,
      cadeira: cadeiraAtual,
      quantidade: 1,
    });
  }

  renderizarProdutos();
  atualizarSidebar();
}

function atualizarSidebar() {
  itensCarrinho.innerHTML = "";
  let totalValor = 0;
  let totalItens = 0;

  if (carrinho.length === 0) {
    itensCarrinho.innerHTML =
      '<p style="color: #777; text-align: center; margin: 30px 0;">Nenhum item selecionado</p>';
    boxTotais.style.display = "none";
    return;
  }

  boxTotais.style.display = "block";

  carrinho.forEach((item) => {
    const subtotal = item.preco * item.quantidade;
    totalValor += subtotal;
    totalItens += item.quantidade;

    const infoCadeira =
      item.cadeira !== "Sem Cadeira"
        ? ` <span style="color:#aaa; font-size: 0.8em;">(${item.cadeira})</span>`
        : "";

    itensCarrinho.innerHTML += `
            <div class="item-carrinho">
                <div>
                    <strong>${item.nome}</strong>${infoCadeira}<br>
                    <span style="color: #aaa;">${
                      item.quantidade
                    }x R$ ${item.preco.toFixed(2)}</span>
                </div>
                <strong style="color: #d4af37;">R$ ${subtotal.toFixed(
                  2
                )}</strong>
            </div>
        `;
  });

  qtdTotalItens.innerText = totalItens;
  valorTotalCarrinho.innerText = `R$ ${totalValor.toFixed(2)}`;
}

btnConfirmarPedido.addEventListener("click", async () => {
  if (carrinho.length === 0) return;

  btnConfirmarPedido.innerText = "Enviando...";
  btnConfirmarPedido.disabled = true;

  try {
    const itensParaSalvar = carrinho.map((item) => ({
      ...item,
      status: "Pendente",
    }));

    const valorNovoPedido = carrinho.reduce(
      (acc, i) => acc + i.preco * i.quantidade,
      0
    );

    const itensAntigos = dadosMesa.itens || [];
    const novoTotalMesa = (dadosMesa.total || 0) + valorNovoPedido;

    await updateDoc(doc(db, "mesas", mesaId), {
      itens: [...itensAntigos, ...itensParaSalvar],
      total: novoTotalMesa,
    });

    await addDoc(collection(db, "pedidos"), {
      data: new Date().toISOString(),
      status: "Pendente",
      mesaId: mesaId,
      numeroMesa: dadosMesa.numero,
      garcom: dadosMesa.garcom,
      itens: itensParaSalvar,
    });

    alert("Pedido enviado para a cozinha com sucesso!");
    window.location.href = `./CardapioGarcom.html?mesa=${mesaId}`;
  } catch (error) {
    console.error("Erro ao enviar pedido:", error);
    alert("Erro ao salvar pedido.");
    btnConfirmarPedido.innerText = "Confirmar Pedido";
    btnConfirmarPedido.disabled = false;
  }
});

inicializar();
