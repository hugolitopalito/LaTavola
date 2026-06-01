import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
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

const usuariosRef = collection(db, "usuarios");
const mesasRef = collection(db, "mesas");

const telaLista = document.getElementById("telaLista");
const telaCadastro = document.getElementById("telaCadastro");
const btnAbrirCadastro = document.getElementById("btnAbrirCadastro");
const btnCancelar = document.getElementById("btnCancelar");
const tabelaUsuarios = document.getElementById("tabelaUsuarios");
const formNovoUsuario = document.getElementById("formNovoUsuario");
const inputTelefone = document.getElementById("cadTelefone");

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

btnAbrirCadastro.addEventListener("click", () => {
  telaLista.style.display = "none";
  telaCadastro.style.display = "block";
  btnAbrirCadastro.style.display = "none";
});

btnCancelar.addEventListener("click", () => {
  telaLista.style.display = "block";
  telaCadastro.style.display = "none";
  btnAbrirCadastro.style.display = "flex";
  formNovoUsuario.reset();
});

let todosUsuarios = [];

onSnapshot(usuariosRef, (snapshot) => {
  tabelaUsuarios.innerHTML = "";
  todosUsuarios = [];

  snapshot.forEach((doc) => {
    const u = doc.data();
    todosUsuarios.push({ id: doc.id, ...u });

    tabelaUsuarios.innerHTML += `
            <tr>
                <td>
                    <div class="user-name">
                        <div class="user-icon">👤</div>
                        ${u.nome}
                    </div>
                </td>
                <td>✉️ ${u.email}</td>
                <td><span class="badge-perfil">${u.perfil}</span></td>
                <td><span class="badge-status">Ativo</span></td>
                <td>
                    <button class="btn-link">Editar</button>
                    <button class="btn-link">Resetar Senha</button>
                </td>
            </tr>
        `;
  });

  if (todosUsuarios.length === 0) {
    tabelaUsuarios.innerHTML =
      '<tr><td colspan="5" style="text-align: center; color:#aaa;">Nenhum usuário cadastrado. Crie o primeiro!</td></tr>';
  }
});

formNovoUsuario.addEventListener("submit", async (e) => {
  e.preventDefault();

  const novoUser = {
    nome: document.getElementById("cadNome").value,
    email: document.getElementById("cadEmail").value.toLowerCase(),
    perfil: document.getElementById("cadPerfil").value,
    telefone: document.getElementById("cadTelefone").value,
    senha: document.getElementById("cadSenha").value,
  };

  try {
    await addDoc(usuariosRef, novoUser);
    alert("Usuário criado com sucesso!");

    if (novoUser.perfil === "Garçom") {
      await redividirMesas();
    }

    btnCancelar.click();
  } catch (err) {
    console.error(err);
    alert("Erro ao criar usuário.");
  }
});

async function redividirMesas() {
  const garcons = todosUsuarios.filter((u) => u.perfil === "Garçom");
  if (garcons.length === 0) return;

  const snapMesas = await getDocs(mesasRef);
  let mesasArray = [];
  snapMesas.forEach((doc) => mesasArray.push({ id: doc.id, ...doc.data() }));

  mesasArray.sort((a, b) => a.numero - b.numero);

  for (let i = 0; i < mesasArray.length; i++) {
    const mesa = mesasArray[i];
    const garcomResponsavel = garcons[i % garcons.length].nome;

    await updateDoc(doc(db, "mesas", mesa.id), {
      garcom: garcomResponsavel,
    });
  }
  console.log("Mesas redistribuídas com sucesso!");
}
