import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
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

const produtosRef = collection(db, "produtos");
const pedidosRef = collection(db, "pedidos");

let dictProdutos = {};
let listaDePedidos = [];
let meuGrafico = null;
onSnapshot(produtosRef, (snapshot) => {
  snapshot.forEach((doc) => {
    const p = doc.data();
    if (p.ativo && !dictProdutos[p.nome]) {
      let charSum = 0;
      for (let i = 0; i < p.nome.length; i++) {
        charSum += p.nome.charCodeAt(i);
      }
      let simulatedMargin = 30 + (charSum % 55);

      dictProdutos[p.nome] = {
        nome: p.nome,
        preco: Number(p.preco) || 0,
        margem: simulatedMargin,
        qtdVendida: 0,
      };
    }
  });
  processarMatriz();
});
onSnapshot(pedidosRef, (snapshot) => {
  listaDePedidos = [];
  snapshot.forEach((doc) => {
    listaDePedidos.push(doc.data());
  });
  processarMatriz();
});
function processarMatriz() {
  if (Object.keys(dictProdutos).length === 0 || listaDePedidos.length === 0)
    return;

  Object.keys(dictProdutos).forEach((k) => (dictProdutos[k].qtdVendida = 0));

  let totalItensVendidosGlobal = 0;
  listaDePedidos.forEach((pedido) => {
    if (
      pedido.status === "Recusado" ||
      pedido.status === "Aguardando Aprovação"
    )
      return;

    if (pedido.itens) {
      pedido.itens.forEach((item) => {
        if (dictProdutos[item.nome]) {
          dictProdutos[item.nome].qtdVendida += Number(item.quantidade);
          totalItensVendidosGlobal += Number(item.quantidade);
        }
      });
    }
  });

  const totalProdutosDiferentes = Object.keys(dictProdutos).length;
  const mediaDeVendas =
    totalProdutosDiferentes > 0
      ? totalItensVendidosGlobal / totalProdutosDiferentes
      : 1;
  let somaMargens = 0;
  let ativosVendidos = 0;

  const dadosGrafico = [];

  Object.values(dictProdutos).forEach((p) => {
    if (p.qtdVendida > 0) {
      somaMargens += p.margem;
      ativosVendidos++;

      let popularidade = (p.qtdVendida / mediaDeVendas) * 100;

      dadosGrafico.push({
        x: popularidade,
        y: p.margem,
        r: Math.min(Math.max(p.qtdVendida * 2, 8), 30),
        _nome: p.nome,
        _vendas: p.qtdVendida,
        _preco: p.preco,
      });
    }
  });

  const margemMediaGlobal =
    ativosVendidos > 0 ? somaMargens / ativosVendidos : 50;

  desenharGrafico(dadosGrafico, margemMediaGlobal);
}

function desenharGrafico(dados, margemMediaGlobal) {
  const ctx = document.getElementById("matrizChart").getContext("2d");
  if (meuGrafico) {
    meuGrafico.destroy();
  }

  const classificarQuadrante = (pop, marg) => {
    if (pop >= 100 && marg >= margemMediaGlobal) return "⭐ Estrela";
    if (pop < 100 && marg >= margemMediaGlobal) return "🧩 Quebra-Cabeça";
    if (pop >= 100 && marg < margemMediaGlobal) return "🐎 Cavalo de Batalha";
    return "🐶 Cão";
  };

  meuGrafico = new Chart(ctx, {
    type: "bubble",
    data: {
      datasets: [
        {
          label: "Produtos",
          data: dados,
          backgroundColor: function (context) {
            const item = context.raw;
            if (!item) return "#d4af37";
            const c = classificarQuadrante(item.x, item.y);
            if (c.includes("Cão") || c.includes("Cavalo"))
              return "rgba(165, 42, 42, 0.8)";
            return "rgba(212, 175, 55, 0.8)";
          },
          borderColor: "transparent",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(20, 20, 20, 0.95)",
          titleColor: "#fff",
          bodyColor: "#aaa",
          borderColor: "#444",
          borderWidth: 1,
          padding: 15,
          titleFont: { size: 14, weight: "bold" },
          callbacks: {
            label: function (context) {
              const p = context.raw;
              const quadrante = classificarQuadrante(p.x, p.y);
              return [
                p._nome,
                `Margem: ${p.y.toFixed(1)}%`,
                `Popularidade: ${p.x.toFixed(1)}%`,
                `Vendas: ${p._vendas}`,
                `Preço: R$ ${p._preco.toFixed(2)}`,
                ``,
                quadrante,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Popularidade →",
            color: "#fff",
            font: { weight: "bold" },
          },
          grid: { color: "#333" },
          ticks: {
            color: "#aaa",
            callback: function (val) {
              return val + "%";
            },
          },
          min: 0,
        },
        y: {
          title: {
            display: true,
            text: "Margem de Lucro →",
            color: "#fff",
            font: { weight: "bold" },
          },
          grid: { color: "#333" },
          ticks: {
            color: "#aaa",
            callback: function (val) {
              return val + "%";
            },
          },
          min: 0,
          max: 100,
        },
      },
    },
    plugins: [
      {
        id: "quadrantLines",
        beforeDraw(chart) {
          const {
            ctx,
            chartArea: { top, bottom, left, right },
            scales: { x, y },
          } = chart;
          ctx.save();
          const xPos = x.getPixelForValue(100);
          if (xPos >= left && xPos <= right) {
            ctx.beginPath();
            ctx.moveTo(xPos, top);
            ctx.lineTo(xPos, bottom);
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.stroke();
          }
          const yPos = y.getPixelForValue(margemMediaGlobal);
          if (yPos >= top && yPos <= bottom) {
            ctx.beginPath();
            ctx.moveTo(left, yPos);
            ctx.lineTo(right, yPos);
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.stroke();
          }
          ctx.restore();
        },
      },
    ],
  });
}
