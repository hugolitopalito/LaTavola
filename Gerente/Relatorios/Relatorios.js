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

let chartTop10Instance = null;
let chartCategoriasInstance = null;

const valFaturamento = document.getElementById("valFaturamento");
const valLucro = document.getElementById("valLucro");
const valMargemPerc = document.getElementById("valMargemPerc");
const valTicket = document.getElementById("valTicket");
const valQtdVendas = document.getElementById("valQtdVendas");
const listaRelatorio = document.getElementById("listaRelatorio");

onSnapshot(produtosRef, (snapshot) => {
  snapshot.forEach((doc) => {
    const p = doc.data();
    if (p.ativo && !dictProdutos[p.nome]) {
      let charSum = 0;
      for (let i = 0; i < p.nome.length; i++) {
        charSum += p.nome.charCodeAt(i);
      }
      let margem = 30 + (charSum % 55);

      let preco = Number(p.preco) || 0;
      let lucroUnidade = preco * (margem / 100);
      let custoUnidade = preco - lucroUnidade;

      dictProdutos[p.nome] = {
        nome: p.nome,
        categoria: p.categoria || "Diversos",
        preco: preco,
        custoUnidade: custoUnidade,
        lucroUnidade: lucroUnidade,
        margemPerc: margem,
        qtdVendida: 0,
        receitaTotal: 0,
        custoTotal: 0,
        lucroTotal: 0,
      };
    }
  });
  gerarRelatorios();
});

onSnapshot(pedidosRef, (snapshot) => {
  listaDePedidos = [];
  snapshot.forEach((doc) => {
    listaDePedidos.push(doc.data());
  });
  gerarRelatorios();
});

function gerarRelatorios() {
  if (Object.keys(dictProdutos).length === 0 || listaDePedidos.length === 0)
    return;

  Object.keys(dictProdutos).forEach((k) => {
    dictProdutos[k].qtdVendida = 0;
    dictProdutos[k].receitaTotal = 0;
    dictProdutos[k].custoTotal = 0;
    dictProdutos[k].lucroTotal = 0;
  });

  let faturamentoGlobal = 0;
  let qtdPedidosValidos = 0;

  listaDePedidos.forEach((pedido) => {
    const isDelivery = !!pedido.cliente;
    const isMesa = !!pedido.mesaId;

    let vendaValida = false;

    if (isDelivery && pedido.status === "Entregue") vendaValida = true;

    if (isMesa && pedido.status === "Pago") vendaValida = true;

    if (!vendaValida) return;

    qtdPedidosValidos++;

    let totalDestePedido = pedido.resumo
      ? pedido.resumo.total
      : pedido.total || 0;
    faturamentoGlobal += Number(totalDestePedido);

    if (pedido.itens) {
      pedido.itens.forEach((item) => {
        if (dictProdutos[item.nome]) {
          const p = dictProdutos[item.nome];
          const qtd = Number(item.quantidade);

          p.qtdVendida += qtd;
          p.receitaTotal += qtd * p.preco;
          p.custoTotal += qtd * p.custoUnidade;
          p.lucroTotal += qtd * p.lucroUnidade;
        }
      });
    }
  });

  const produtosVendidos = Object.values(dictProdutos).filter(
    (p) => p.qtdVendida > 0
  );
  produtosVendidos.sort((a, b) => b.receitaTotal - a.receitaTotal);

  let lucroAbsolutoGlobal = 0;
  let receitaDosProdutos = 0;

  produtosVendidos.forEach((p) => {
    lucroAbsolutoGlobal += p.lucroTotal;
    receitaDosProdutos += p.receitaTotal;
  });

  let margemGlobalPerc =
    receitaDosProdutos > 0
      ? (lucroAbsolutoGlobal / receitaDosProdutos) * 100
      : 0;
  let ticketMedio =
    qtdPedidosValidos > 0 ? faturamentoGlobal / qtdPedidosValidos : 0;

  valFaturamento.innerText = `R$ ${faturamentoGlobal.toFixed(2)}`;
  valLucro.innerText = `R$ ${lucroAbsolutoGlobal.toFixed(2)}`;
  valMargemPerc.innerText = `${margemGlobalPerc.toFixed(1)}% de margem global`;
  valTicket.innerText = `R$ ${ticketMedio.toFixed(2)}`;
  valQtdVendas.innerText = qtdPedidosValidos;

  listaRelatorio.innerHTML = "";

  if (produtosVendidos.length === 0) {
    listaRelatorio.innerHTML =
      '<tr><td colspan="7" style="text-align: center; color: #777; padding: 30px;">Nenhuma venda finalizada ainda.</td></tr>';
  } else {
    produtosVendidos.forEach((p) => {
      listaRelatorio.innerHTML += `
                <tr>
                    <td class="td-nome">${p.nome}</td>
                    <td class="td-cat">${p.categoria}</td>
                    <td style="text-align: center; font-weight: bold;">${
                      p.qtdVendida
                    }</td>
                    <td class="td-receita">R$ ${p.receitaTotal.toFixed(2)}</td>
                    <td class="td-custo">R$ ${p.custoTotal.toFixed(2)}</td>
                    <td class="td-lucro">R$ ${p.lucroTotal.toFixed(2)}</td>
                    <td class="td-margem">${p.margemPerc.toFixed(1)}%</td>
                </tr>
            `;
    });
  }

  desenharGraficoTop10(produtosVendidos);
  desenharGraficoCategorias(produtosVendidos);
}

function desenharGraficoTop10(produtosOrdenados) {
  const top10 = produtosOrdenados.slice(0, 10);
  const labels = top10.map((p) => p.nome);
  const dadosReceita = top10.map((p) => p.receitaTotal);

  const ctx = document.getElementById("chartTop10").getContext("2d");
  if (chartTop10Instance) chartTop10Instance.destroy();

  chartTop10Instance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Receita (R$)",
          data: dadosReceita,
          backgroundColor: "rgba(212, 175, 55, 0.8)",
          borderRadius: 4,
          barThickness: 15,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: "#222", titleColor: "#d4af37" },
      },
      scales: {
        x: { display: false },
        y: {
          ticks: { color: "#aaa", font: { size: 11 } },
          grid: { display: false },
        },
      },
    },
  });
}

function desenharGraficoCategorias(produtosVendidos) {
  let receitaPorCategoria = {};
  let receitaTotalGeral = 0;

  produtosVendidos.forEach((p) => {
    if (!receitaPorCategoria[p.categoria]) {
      receitaPorCategoria[p.categoria] = 0;
    }
    receitaPorCategoria[p.categoria] += p.receitaTotal;
    receitaTotalGeral += p.receitaTotal;
  });

  const labels = Object.keys(receitaPorCategoria);
  const dados = Object.values(receitaPorCategoria);

  const cores = [
    "#d4af37",
    "#8b0000",
    "#cba374",
    "#556b2f",
    "#a52a2a",
    "#444444",
  ];

  const ctx = document.getElementById("chartCategorias").getContext("2d");
  if (chartCategoriasInstance) chartCategoriasInstance.destroy();

  chartCategoriasInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: dados,
          backgroundColor: cores,
          borderWidth: 2,
          borderColor: "#1a1a1a",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "right", labels: { color: "#aaa", padding: 20 } },
        tooltip: {
          backgroundColor: "#222",
          callbacks: {
            label: function (context) {
              let valor = context.raw;
              let percentual = ((valor / receitaTotalGeral) * 100).toFixed(1);
              return ` R$ ${valor.toFixed(2)} (${percentual}%)`;
            },
          },
        },
      },
    },
  });
}
