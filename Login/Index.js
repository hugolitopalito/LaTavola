import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

document
  .getElementById("formLogin")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const emailDigitado = document
      .getElementById("emailInput")
      .value.trim()
      .toLowerCase();
    const senhaDigitada = document.getElementById("senhaInput").value.trim();
    const btn = document.querySelector(".btn-entrar");

    btn.innerText = "Verificando...";
    btn.disabled = true;

    if (
      emailDigitado === "gerente@restaurante.com" &&
      senhaDigitada === "123456"
    ) {
      localStorage.setItem("usuarioLogado", "Ana Gerente (Padrão)");
      localStorage.setItem("perfilLogado", "Gerente");
      window.location.href = "../Gerente/DashBoard.html";
      return;
    }

    try {
      const q = query(
        collection(db, "usuarios"),
        where("email", "==", emailDigitado)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert(
          "❌ E-mail não encontrado no sistema. Verifique o e-mail ou peça para a Gerência realizar o cadastro."
        );
        btn.innerText = "Entrar";
        btn.disabled = false;
        return;
      }

      let usuarioEncontrado = null;
      querySnapshot.forEach((doc) => {
        usuarioEncontrado = doc.data();
      });

      if (usuarioEncontrado.senha !== senhaDigitada) {
        alert("❌ Senha incorreta!");
        btn.innerText = "Entrar";
        btn.disabled = false;
        return;
      }

      localStorage.setItem("usuarioLogado", usuarioEncontrado.nome);
      localStorage.setItem("perfilLogado", usuarioEncontrado.perfil);

      const perfil = usuarioEncontrado.perfil;

      if (perfil === "Recepção") {
        window.location.href = "../Recepcao/Recepcao.html";
      } else if (perfil === "Garçom") {
        window.location.href = "../Garcom/Garcom.html";
      } else if (perfil === "Cozinha") {
        window.location.href = "../Cozinha/Cozinha.html";
      } else if (perfil === "Gerente") {
        window.location.href = "../Gerente/DashBoard.html";
      } else if (perfil === "Entregador") {
        window.location.href = "../Entregador/Entregador.html";
      } else {
        window.location.href = "../Cardapio/Cardapio.html";
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com o banco de dados. Tente novamente.");
      btn.innerText = "Entrar";
      btn.disabled = false;
    }
  });
