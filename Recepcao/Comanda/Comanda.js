import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
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
const mesasRef = collection(db, "mesas");

const inputPessoas = document.getElementById("qtdPessoas");
const selectMesa = document.getElementById("selectMesa");
const nomeGarcomInput = document.getElementById("nomeGarcom");
const formComanda = document.getElementById("formComanda");
const btnSubmit = document.getElementById("btnSubmit");

let mesasLivres = [];

async function carregarMesasLivres() {
  const snapshot = await getDocs(mesasRef);
  mesasLivres = [];
  snapshot.forEach((docSnap) => {
    const mesa = docSnap.data();
    if (mesa.status === "Livre") {
      mesasLivres.push({ id: docSnap.id, ...mesa });
    }
  });
}

inputPessoas.addEventListener("input", (e) => {
  const qtd = parseInt(e.target.value) || 0;
  selectMesa.innerHTML = '<option value="">Selecione uma mesa</option>';
  nomeGarcomInput.value = "";

  const mesasCompativeis = mesasLivres.filter((mesa) => mesa.capacidade >= qtd);
  mesasCompativeis.sort((a, b) => a.numero - b.numero);

  mesasCompativeis.forEach((mesa) => {
    const option = document.createElement("option");
    option.value = mesa.id;
    option.innerText = `Mesa ${mesa.numero} (Capacidade: ${mesa.capacidade} pessoas)`;
    selectMesa.appendChild(option);
  });

  if (mesasCompativeis.length === 0 && qtd > 0) {
    selectMesa.innerHTML =
      '<option value="">Nenhuma mesa livre para essa capacidade</option>';
  }
});

selectMesa.addEventListener("change", (e) => {
  const idSelecionado = e.target.value;
  if (!idSelecionado) {
    nomeGarcomInput.value = "";
    return;
  }

  const mesaEscolhida = mesasLivres.find((m) => m.id === idSelecionado);

  if (mesaEscolhida && mesaEscolhida.garcom) {
    nomeGarcomInput.value = mesaEscolhida.garcom;
  } else {
    nomeGarcomInput.value = "Garçom não atribuído (Verifique a Gestão)";
  }
});

formComanda.addEventListener("submit", async (e) => {
  e.preventDefault();
  btnSubmit.disabled = true;
  btnSubmit.innerText = "Abrindo...";

  const idMesa = selectMesa.value;
  const pessoas = parseInt(inputPessoas.value);
  const cliente = document.getElementById("nomeCliente").value || "Sem nome";
  const garcom = nomeGarcomInput.value;

  try {
    await updateDoc(doc(db, "mesas", idMesa), {
      status: "Ocupada",
      pessoas: pessoas,
      cliente: cliente,
      garcom: garcom,
      total: 0,
    });

    alert("Comanda aberta com sucesso!");
    window.location.href = "../Recepcao.html";
  } catch (error) {
    console.error("Erro ao abrir comanda:", error);
    alert("Erro ao abrir comanda.");
    btnSubmit.disabled = false;
    btnSubmit.innerText = "Abrir Comanda";
  }
});

carregarMesasLivres();
