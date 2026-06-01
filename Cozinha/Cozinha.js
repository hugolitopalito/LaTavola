import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
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
const pedidosRef = collection(db, "pedidos");

const listaPendentes = document.getElementById("listaPendentes");
const listaPreparo = document.getElementById("listaPreparo");
const listaProntos = document.getElementById("listaProntos");

const countPendentes = document.getElementById("count-pendentes");
const countPreparo = document.getElementById("count-preparo");
const countProntos = document.getElementById("count-prontos");

let pedidosEmMemoria = {};

onSnapshot(pedidosRef, (snapshot) => {
  listaPendentes.innerHTML = "";
  listaPreparo.innerHTML = "";
  listaProntos.innerHTML = "";
  pedidosEmMemoria = {};
  let contadores = { pendentes: 0, preparo: 0, prontos: 0 };

  snapshot.forEach((documento) => {
    const pedido = documento.data();
    const id = documento.id;
    pedidosEmMemoria[id] = pedido;
    if (pedido.status === "Entregue" || pedido.status === "Em Rota") return;

    const cardHTML = criarCardPedido(id, pedido);

    if (
      pedido.status === "Recebido" ||
      pedido.status === "Pendente" ||
      pedido.status === "Aguardando Aprovação"
    ) {
      listaPendentes.innerHTML += cardHTML;
      contadores.pendentes++;
    } else if (pedido.status === "Em Preparo") {
      listaPreparo.innerHTML += cardHTML;
      contadores.preparo++;
    } else if (pedido.status === "Pronto") {
      listaProntos.innerHTML += cardHTML;
      contadores.prontos++;
    }
  });

  countPendentes.innerText = contadores.pendentes;
  countPreparo.innerText = contadores.preparo;
  countProntos.innerText = contadores.prontos;

  configurarBotoesAcao();
});

function criarCardPedido(id, pedido) {
  const horaPedido = new Date(pedido.data).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  let itensListaHTML = "";
  pedido.itens.forEach((item) => {
    itensListaHTML += `<li>${item.quantidade}x <strong>${item.nome}</strong></li>`;
  });

  let botaoAcaoHTML = "";
  const isDelivery = !!pedido.cliente;

  // Se estiver aguardando aprovação da recepção, exibe mas sem botão
  if (pedido.status === "Aguardando Aprovação") {
    botaoAcaoHTML = `<button class="btn-acao" disabled style="background: #555; cursor: not-allowed;">Aguardando Recepção</button>`;
  } else if (pedido.status === "Recebido" || pedido.status === "Pendente") {
    botaoAcaoHTML = `<button class="btn-acao btn-iniciar" data-id="${id}" data-mesa-id="${
      pedido.mesaId || ""
    }" data-novo-status="Em Preparo">Iniciar Preparo</button>`;
  } else if (pedido.status === "Em Preparo") {
    botaoAcaoHTML = `<button class="btn-acao btn-pronto" data-id="${id}" data-mesa-id="${
      pedido.mesaId || ""
    }" data-novo-status="Pronto">Marcar como Pronto</button>`;
  } else if (pedido.status === "Pronto") {
    if (isDelivery) {
      botaoAcaoHTML = `<button class="btn-acao btn-despachar" data-id="${id}" data-novo-status="Aguardando Entregador">Liberar para Delivery</button>`;
    } else {
      botaoAcaoHTML = `<button class="btn-acao btn-pronto" data-id="${id}" data-mesa-id="${
        pedido.mesaId || ""
      }" data-novo-status="Entregue">Prato Entregue na Mesa</button>`;
    }
  }

  const nomeCliente = isDelivery
    ? pedido.cliente.nome
    : `Mesa ${pedido.numeroMesa} - ${pedido.garcom}`;
  const tipoPedido = isDelivery ? "🚚 Delivery" : "🍽️ Salão";
  const classeCard = isDelivery ? "pedido-card delivery" : "pedido-card";

  return `
        <div class="${classeCard}">
            <div class="pedido-header">
                <span>${tipoPedido}</span>
                <span>⏱️ ${horaPedido}</span>
            </div>
            <div class="pedido-cliente">
                ${nomeCliente}
            </div>
            <ul class="pedido-itens">
                ${itensListaHTML}
            </ul>
            ${botaoAcaoHTML}
        </div>
    `;
}
function configurarBotoesAcao() {
  const botoes = document.querySelectorAll(".btn-acao");

  botoes.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const idPedido = e.target.getAttribute("data-id");
      const novoStatus = e.target.getAttribute("data-novo-status");
      const mesaId = e.target.getAttribute("data-mesa-id");

      e.target.disabled = true;
      e.target.innerText = "Atualizando...";

      try {
        let dadosAtualizacao = { status: novoStatus };
        if (mesaId && novoStatus === "Entregue") {
          const pedidoAtual = pedidosEmMemoria[idPedido];
          if (pedidoAtual && pedidoAtual.itens) {
            let valorDesteLote = 0;
            pedidoAtual.itens.forEach((item) => {
              valorDesteLote += Number(item.preco) * Number(item.quantidade);
            });
            dadosAtualizacao.total = valorDesteLote;
          }
        }
        await updateDoc(doc(db, "pedidos", idPedido), dadosAtualizacao);

        if (mesaId) {
          const mesaRef = doc(db, "mesas", mesaId);
          const mesaSnap = await getDoc(mesaRef);

          if (mesaSnap.exists()) {
            const dadosMesa = mesaSnap.data();

            const statusAntigo =
              novoStatus === "Em Preparo"
                ? "Pendente"
                : novoStatus === "Pronto"
                ? "Em preparo"
                : novoStatus === "Entregue"
                ? "Pronto"
                : "Pendente";
            const itensAtualizados = dadosMesa.itens.map((item) => {
              let statusComandaDesejado = novoStatus;
              if (novoStatus === "Em Preparo")
                statusComandaDesejado = "Em preparo";

              if (item.status === statusAntigo) {
                return { ...item, status: statusComandaDesejado };
              }
              return item;
            });

            await updateDoc(mesaRef, {
              itens: itensAtualizados,
            });
          }
        }
      } catch (error) {
        console.error("Erro ao atualizar status:", error);
        e.target.disabled = false;
        e.target.innerText = "Tentar Novamente";
      }
    });
  });
}
