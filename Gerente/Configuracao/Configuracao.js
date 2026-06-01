import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
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

const configRef = doc(db, "configuracoes", "geral");

const inTaxaEntrega = document.getElementById("cfgTaxaEntrega");
const inMinimoDelivery = document.getElementById("cfgMinimoDelivery");
const inDistanciaMax = document.getElementById("cfgDistanciaMax");
const chkAceitarDelivery = document.getElementById("cfgAceitarDelivery");
const inHoraAbertura = document.getElementById("cfgHoraAbertura");
const inHoraFechamento = document.getElementById("cfgHoraFechamento");
const chkAceitarNovos = document.getElementById("cfgAceitarNovos");
const btnSalvarConfig = document.getElementById("btnSalvarConfig");

async function carregarConfiguracoes() {
  try {
    const docSnap = await getDoc(configRef);

    if (docSnap.exists()) {
      const dados = docSnap.data();

      if (dados.taxaEntrega !== undefined)
        inTaxaEntrega.value = dados.taxaEntrega;
      if (dados.minimoDelivery !== undefined)
        inMinimoDelivery.value = dados.minimoDelivery;
      if (dados.distanciaMax !== undefined)
        inDistanciaMax.value = dados.distanciaMax;
      if (dados.aceitarDelivery !== undefined)
        chkAceitarDelivery.checked = dados.aceitarDelivery;

      if (dados.horaAbertura) inHoraAbertura.value = dados.horaAbertura;
      if (dados.horaFechamento) inHoraFechamento.value = dados.horaFechamento;
      if (dados.restauranteAberto !== undefined)
        chkAceitarNovos.checked = dados.restauranteAberto;
    }
  } catch (error) {
    console.error("Erro ao carregar configurações:", error);
  }
}

btnSalvarConfig.addEventListener("click", async () => {
  btnSalvarConfig.innerText = "Salvando...";
  btnSalvarConfig.disabled = true;

  const novasConfiguracoes = {
    taxaEntrega: parseFloat(inTaxaEntrega.value) || 0,
    minimoDelivery: parseFloat(inMinimoDelivery.value) || 0,
    distanciaMax: parseFloat(inDistanciaMax.value) || 0,
    aceitarDelivery: chkAceitarDelivery.checked,
    horaAbertura: inHoraAbertura.value,
    horaFechamento: inHoraFechamento.value,
    restauranteAberto: chkAceitarNovos.checked,
  };

  try {
    await setDoc(configRef, novasConfiguracoes, { merge: true });

    alert("Configurações atualizadas com sucesso!");
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    alert("Erro ao salvar configurações. Tente novamente.");
  } finally {
    btnSalvarConfig.innerText = "💾 Salvar Configurações";
    btnSalvarConfig.disabled = false;
  }
});

carregarConfiguracoes();
