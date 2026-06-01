import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  doc,
  onSnapshot,
  updateDoc,
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

const tituloComanda = document.getElementById("tituloComanda");
const txtNumeroCard = document.getElementById("txtNumeroCard");
const txtMesa = document.getElementById("txtMesa");
const txtCliente = document.getElementById("txtCliente");
const txtTotal = document.getElementById("txtTotal");
const txtPessoas = document.getElementById("txtPessoas");
const txtStatus = document.getElementById("txtStatus");
const listaItensComanda = document.getElementById("listaItensComanda");
const btnFecharConta = document.getElementById("btnFecharConta");
const btnAddItem = document.getElementById("btnAddItem");

const abaTodos = document.getElementById("abaTodos");
const abaCadeiras = document.getElementById("abaCadeiras");

let modoVisao = "todos";
let itensDaMesa = [];

const docRef = doc(db, "mesas", mesaId);

onSnapshot(docRef, (docSnap) => {
  if (!docSnap.exists()) return;
  const mesa = docSnap.data();

  tituloComanda.innerText = `#ord${mesa.numero}`;
  txtNumeroCard.innerText = `#${mesa.numero}`;
  txtMesa.innerText = `Mesa ${mesa.numero}`;
  txtCliente.innerText = mesa.cliente || "Sem nome";
  txtTotal.innerText = `R$ ${mesa.total.toFixed(2)}`;
  txtPessoas.innerText = mesa.pessoas;
  txtStatus.innerText = mesa.status;

  if (mesa.status === "Aguardando Pagamento") {
    btnFecharConta.innerText = "Conta Fechada (Aguardando)";
    btnFecharConta.disabled = true;
    btnFecharConta.style.opacity = "0.5";
  }

  itensDaMesa = mesa.itens || [];
  renderizarItens();
});

abaTodos.addEventListener("click", () => {
  abaTodos.classList.add("ativa");
  abaCadeiras.classList.remove("ativa");
  modoVisao = "todos";
  renderizarItens();
});

abaCadeiras.addEventListener("click", () => {
  abaCadeiras.classList.add("ativa");
  abaTodos.classList.remove("ativa");
  modoVisao = "cadeiras";
  renderizarItens();
});

function renderizarItens() {
  listaItensComanda.innerHTML = "";

  if (itensDaMesa.length === 0) {
    listaItensComanda.innerHTML =
      '<p style="color: #aaa;">Nenhum item adicionado ainda.</p>';
    return;
  }

  if (modoVisao === "todos") {
    itensDaMesa.forEach((item) => {
      listaItensComanda.innerHTML += gerarHTMLItem(item);
    });
  } else {
    const itensAgrupados = {};

    itensDaMesa.forEach((item) => {
      const cadeira = item.cadeira || "Sem Cadeira";
      if (!itensAgrupados[cadeira]) {
        itensAgrupados[cadeira] = [];
      }
      itensAgrupados[cadeira].push(item);
    });

    for (const cadeira in itensAgrupados) {
      listaItensComanda.innerHTML += `
                <div style="background: #333; padding: 8px 15px; margin: 20px 0 10px 0; border-radius: 4px; color: #d4af37; font-weight: bold;">
                    🪑 ${cadeira}
                </div>
            `;
      itensAgrupados[cadeira].forEach((item) => {
        listaItensComanda.innerHTML += gerarHTMLItem(item);
      });
    }
  }
}

function gerarHTMLItem(item) {
  let corTag = "tag-pendente";
  if (item.status === "Entregue") corTag = "tag-entregue";
  if (item.status === "Em preparo") corTag = "tag-preparo";

  const infoCadeira =
    modoVisao === "todos" && item.cadeira !== "Sem Cadeira"
      ? `<span style="color: #aaa; font-size: 0.8em; margin-left: 10px;">(${item.cadeira})</span>`
      : "";

  return `
        <div class="item-pedido">
            <div>
                <strong style="font-size: 1.1em;">${
                  item.nome
                }</strong> ${infoCadeira}<br>
                <span style="color: #aaa; font-size: 0.85em;">${
                  item.categoria
                } • Qtd: ${item.quantidade}</span><br>
                <span class="tag-status ${corTag}">${item.status}</span>
            </div>
            <div style="text-align: right;">
                <strong style="font-size: 1.1em;">R$ ${(
                  item.preco * item.quantidade
                ).toFixed(2)}</strong><br>
                <span style="color: #aaa; font-size: 0.8em;">R$ ${item.preco.toFixed(
                  2
                )} cada</span>
            </div>
        </div>
    `;
}

btnFecharConta.addEventListener("click", async () => {
  if (
    confirm(
      "Tem certeza que deseja fechar a conta? O status da mesa mudará para Aguardando Pagamento."
    )
  ) {
    btnFecharConta.innerText = "Fechando...";
    await updateDoc(docRef, {
      status: "Aguardando Pagamento",
    });
    alert("Conta fechada! A recepção foi notificada para o pagamento.");
  }
});

btnAddItem.addEventListener("click", () => {
  window.location.href = `./CardapioGarcom/CardapioGarcom.html?mesa=${mesaId}`;
});
