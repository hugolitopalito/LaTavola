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
const mesasRef = collection(db, "mesas");

const listaMesasGarcom = document.getElementById("listaMesasGarcom");

onSnapshot(mesasRef, (snapshot) => {
  listaMesasGarcom.innerHTML = "";
  let mesasOcupadasCount = 0;

  let mesasArray = [];
  snapshot.forEach((doc) => mesasArray.push({ id: doc.id, ...doc.data() }));
  mesasArray.sort((a, b) => a.numero - b.numero);

  mesasArray.forEach((mesa) => {
    const donoDaMesa = mesa.garcom || "Sem Garçom";
    const isMeuPedido = perfilLogado !== "Garçom" || donoDaMesa === nomeLogado;

    if (mesa.status !== "Livre" && isMeuPedido) {
      mesasOcupadasCount++;

      const cliente = mesa.cliente || "Sem nome";
      const total = mesa.total || 0;
      const itens = mesa.itens || [];

      let badgeHTML = "";
      let itensProntos = itens.filter((i) => i.status === "Pronto").length;
      let itensPreparo = itens.filter((i) => i.status === "Em preparo").length;
      let itensPendentes = itens.filter((i) => i.status === "Pendente").length;

      if (itensProntos > 0) {
        badgeHTML = `<span class="status-badge badge-pronto">${itensProntos} pronto!</span>`;
      } else if (itensPreparo > 0) {
        badgeHTML = `<span class="status-badge badge-preparo">${itensPreparo} em preparo</span>`;
      } else if (itensPendentes > 0) {
        badgeHTML = `<span class="status-badge badge-pendente">${itensPendentes} pendente</span>`;
      }

      const destaqueAlerta =
        itensProntos > 0
          ? "border-left: 4px solid #3498db; padding-left: 15px;"
          : "";

      listaMesasGarcom.innerHTML += `
                <div class="mesa-item" style="${destaqueAlerta}" onclick="window.location.href='./MesaGarcom/MesaGarcom.html?mesa=${
        mesa.id
      }'">
                    <div style="display: flex; gap: 20px; align-items: center;">
                        <strong style="color: #e74c3c; font-size: 1.2em;">#${
                          mesa.numero
                        }</strong>
                        <div>
                            <strong style="font-size: 1.1em;">Mesa ${
                              mesa.numero
                            }</strong><br>
                            <span style="color: #aaa; font-size: 0.85em;">${cliente} • ${
        mesa.pessoas
      } pessoas</span><br>
                            ${badgeHTML}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <strong style="color: #d4af37; font-size: 1.2em;">R$ ${total.toFixed(
                          2
                        )}</strong><br>
                        <span style="color: #aaa; font-size: 0.8em;">${
                          itens.length
                        } itens</span>
                    </div>
                </div>
            `;
    }
  });

  if (mesasOcupadasCount === 0) {
    listaMesasGarcom.innerHTML =
      '<p style="color: #777;">Você não possui nenhuma mesa ocupada sob sua responsabilidade no momento.</p>';
  }
});
