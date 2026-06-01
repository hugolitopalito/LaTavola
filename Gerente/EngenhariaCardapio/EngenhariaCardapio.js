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

const listaEngenharia = document.getElementById("listaEngenharia");
const filtroCategoria = document.getElementById("filtroCategoria");

const totEstrelas = document.getElementById("totEstrelas");
const totCavalos = document.getElementById("totCavalos");
const totQuebras = document.getElementById("totQuebras");
const totCaes = document.getElementById("totCaes");

const txtMediaVendas = document.getElementById("txtMediaVendas");
const txtMargemMedia = document.getElementById("txtMargemMedia");
const txtMargemMedia2 = document.getElementById("txtMargemMedia2");

let dictProdutos = {};
let listaDePedidos = [];

onSnapshot(produtosRef, (snapshot) => {
  snapshot.forEach((doc) => {
    const p = doc.data();
    if (p.ativo && !dictProdutos[p.nome]) {
      let charSum = 0;
      for (let i = 0; i < p.nome.length; i++) {
        charSum += p.nome.charCodeAt(i);
      }
      let simulatedMargin = 30 + (charSum % 55);
      const preco = Number(p.preco) || 0;
      const lucroReais = preco * (simulatedMargin / 100);
      const custoReais = preco - lucroReais;
      dictProdutos[p.nome] = {
        nome: p.nome,
        categoria: p.categoria || "Diversos",
        preco: preco,
        custo: custoReais,
        lucroDinheiro: lucroReais,
        margem: simulatedMargin,
        qtdVendida: 0,
        receitaTotal: 0,
      };
    }
  });
  processarTabela();
});

onSnapshot(pedidosRef, (snapshot) => {
  listaDePedidos = [];
  snapshot.forEach((doc) => {
    listaDePedidos.push(doc.data());
  });
  processarTabela();
});

filtroCategoria.addEventListener("change", () => {
  processarTabela();
});

function processarTabela() {
  if (Object.keys(dictProdutos).length === 0 || listaDePedidos.length === 0) {
    listaEngenharia.innerHTML =
      '<tr><td colspan="9" style="text-align: center; color: #777; padding: 30px;">Aguardando vendas para gerar a Engenharia do Cardápio.</td></tr>';
    return;
  }

  Object.keys(dictProdutos).forEach((k) => {
    dictProdutos[k].qtdVendida = 0;
    dictProdutos[k].receitaTotal = 0;
  });
  let totalItensVendidosGlobal = 0;

  listaDePedidos.forEach((pedido) => {
    const isDelivery = !!pedido.cliente;
    const isMesa = !!pedido.mesaId;

    let vendaValida = false;

    if (isDelivery && pedido.status === "Entregue") vendaValida = true;

    if (isMesa && pedido.status === "Pago") vendaValida = true;

    if (!vendaValida) return;

    if (pedido.itens) {
      pedido.itens.forEach((item) => {
        if (dictProdutos[item.nome]) {
          dictProdutos[item.nome].qtdVendida += Number(item.quantidade);
          dictProdutos[item.nome].receitaTotal +=
            Number(item.quantidade) * Number(item.preco);
          totalItensVendidosGlobal += Number(item.quantidade);
        }
      });
    }
  });

  const totalProdutosAtivos = Object.keys(dictProdutos).length;
  const mediaDeVendas =
    totalProdutosAtivos > 0
      ? totalItensVendidosGlobal / totalProdutosAtivos
      : 1;

  let somaMargens = 0;
  let ativosVendidos = 0;

  const produtosVendidos = Object.values(dictProdutos).filter(
    (p) => p.qtdVendida > 0
  );

  produtosVendidos.forEach((p) => {
    somaMargens += p.margem;
    ativosVendidos++;
  });

  const margemMediaGlobal =
    ativosVendidos > 0 ? somaMargens / ativosVendidos : 50;

  txtMediaVendas.innerText = Math.round(mediaDeVendas);
  txtMargemMedia.innerText = margemMediaGlobal.toFixed(1);
  txtMargemMedia2.innerText = margemMediaGlobal.toFixed(1);

  let contadores = { estrela: 0, cavalo: 0, quebra: 0, cao: 0 };
  listaEngenharia.innerHTML = "";

  const categoriaSelecionada = filtroCategoria.value;

  produtosVendidos.sort((a, b) => b.qtdVendida - a.qtdVendida);

  produtosVendidos.forEach((p) => {
    let popularidadePercentual = (p.qtdVendida / mediaDeVendas) * 100;
    let larguraBarra = Math.min(popularidadePercentual, 100);

    let emoji = "";
    let recomendacao = "";

    if (popularidadePercentual >= 100 && p.margem >= margemMediaGlobal) {
      emoji = "⭐";
      recomendacao = "Mantenha em destaque! Produto lucrativo e popular.";
      contadores.estrela++;
    } else if (popularidadePercentual < 100 && p.margem >= margemMediaGlobal) {
      emoji = "🧩";
      recomendacao = "Invista em marketing ou ajuste o posicionamento.";
      contadores.quebra++;
    } else if (popularidadePercentual >= 100 && p.margem < margemMediaGlobal) {
      emoji = "🐎";
      recomendacao = "Considere aumentar o preço ou reduzir o custo.";
      contadores.cavalo++;
    } else {
      emoji = "🐶";
      recomendacao = "Considere remover do cardápio ou reformular.";
      contadores.cao++;
    }

    if (
      categoriaSelecionada !== "Todas" &&
      p.categoria !== categoriaSelecionada
    ) {
      return;
    }

    listaEngenharia.innerHTML += `
            <tr>
                <td><strong style="color: #fff;">${p.nome}</strong></td>
                <td>${p.categoria}</td>
                <td style="font-weight: bold;">R$ ${p.preco.toFixed(2)}</td>
                <td><span class="texto-secundario">R$ ${p.custo.toFixed(
                  2
                )}</span></td>
                <td>
                    <span class="td-destaque">R$ ${p.lucroDinheiro.toFixed(
                      2
                    )}</span>
                    <span class="texto-secundario">${p.margem.toFixed(
                      1
                    )}%</span>
                </td>
                <td style="font-weight: bold; font-size: 1.1em;">${
                  p.qtdVendida
                }</td>
                <td>
                    <div class="bar-bg">
                        <div class="bar-fill" style="width: ${larguraBarra}%;"></div>
                    </div>
                    <span class="texto-secundario">${popularidadePercentual.toFixed(
                      1
                    )}%</span>
                </td>
                <td class="emoji-classificacao">${emoji}</td>
                <td style="color: #aaa; font-size: 0.85em;">${recomendacao}</td>
            </tr>
        `;
  });

  if (listaEngenharia.innerHTML === "") {
    listaEngenharia.innerHTML =
      '<tr><td colspan="9" style="text-align: center; color: #777; padding: 30px;">Nenhum produto vendido nesta categoria.</td></tr>';
  }

  totEstrelas.innerText = contadores.estrela;
  totCavalos.innerText = contadores.cavalo;
  totQuebras.innerText = contadores.quebra;
  totCaes.innerText = contadores.cao;
}
