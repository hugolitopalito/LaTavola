import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ==========================================
// 1. LÓGICA DO CABEÇALHO DINÂMICO
// ==========================================
const nomeLogado = localStorage.getItem('usuarioLogado');
const perfilLogado = localStorage.getItem('perfilLogado');

const elNome = document.getElementById('headerNomeUsuario');
const elPerfil = document.getElementById('headerPerfilUsuario');

if (elNome && elPerfil) {
    if (nomeLogado && perfilLogado) {
        elNome.innerText = nomeLogado;
        elPerfil.innerText = perfilLogado;
    } else {
        elNome.innerText = "Visitante";
        elPerfil.innerText = "Sem Perfil";
    }
}
// ==========================================

// SUAS CREDENCIAIS DO FIREBASE
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

const listaProdutos = document.getElementById("listaProdutos");

// Modais e Botoes
const modalNovo = document.getElementById("modalNovo");
const modalEditar = document.getElementById("modalEditar");
const formNovo = document.getElementById("formNovo");
const formEditar = document.getElementById("formEditar");

document.getElementById("btnNovoProduto").onclick = () =>
  (modalNovo.style.display = "block");
document.getElementById("btnCancelarNovo").onclick = () =>
  (modalNovo.style.display = "none");
document.getElementById("fecharModalNovo").onclick = () =>
  (modalNovo.style.display = "none");

document.getElementById("btnCancelarEditar").onclick = () =>
  (modalEditar.style.display = "none");
document.getElementById("fecharModalEditar").onclick = () =>
  (modalEditar.style.display = "none");

// MEMÓRIA DE DADOS (Para calcular Vendas, Margem e Custo automaticamente)
let produtosTemp = [];
let pedidosTemp = [];

// 1. ESCUTAR PRODUTOS EM TEMPO REAL
onSnapshot(produtosRef, (snapshot) => {
  produtosTemp = [];
  snapshot.forEach((documento) => {
    produtosTemp.push({ id: documento.id, ...documento.data() });
  });
  renderizarTabela();
});

// 2. ESCUTAR PEDIDOS (Para contar Vendas)
onSnapshot(pedidosRef, (snapshot) => {
  pedidosTemp = [];
  snapshot.forEach((doc) => {
    pedidosTemp.push(doc.data());
  });
  renderizarTabela();
});

// 3. RENDERIZAR TABELA ENRIQUECIDA
function renderizarTabela() {
  listaProdutos.innerHTML = "";

  if (produtosTemp.length === 0) {
    listaProdutos.innerHTML =
      '<tr><td colspan="8" style="text-align: center; color: #777; padding: 30px;">Nenhum produto cadastrado no cardápio.</td></tr>';
    return;
  }

  produtosTemp.forEach((produto) => {
    // Lógica Matemática de Custo e Margem (A mesma da Engenharia)
    let charSum = 0;
    for (let i = 0; i < produto.nome.length; i++) {
      charSum += produto.nome.charCodeAt(i);
    }
    let margem = 30 + (charSum % 55);

    let preco = Number(produto.preco) || 0;
    let lucroReais = preco * (margem / 100);
    let custo = preco - lucroReais;

    // Lógica para Contar Vendas desse produto
    let qtdVendida = 0;
    pedidosTemp.forEach((pedido) => {
      if (
        pedido.status !== "Recusado" &&
        pedido.status !== "Aguardando Aprovação"
      ) {
        if (pedido.itens) {
          pedido.itens.forEach((item) => {
            if (item.nome === produto.nome) {
              qtdVendida += Number(item.quantidade);
            }
          });
        }
      }
    });

    // Visuais
    const statusHTML = produto.ativo
      ? '<span class="badge-ativo">Ativo</span>'
      : '<span class="badge-inativo">Inativo</span>';

    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td class="td-nome">${produto.nome}</td>
            <td class="td-cat">${produto.categoria}</td>
            <td class="td-preco">R$ ${preco.toFixed(2)}</td>
            <td class="td-custo">R$ ${custo.toFixed(2)}</td>
            <td class="td-margem">${margem.toFixed(1)}%</td>
            <td class="td-vendas" style="text-align: center;">${qtdVendida}</td>
            <td>${statusHTML}</td>
            <td>
                <div class="acoes-container">
                    <button class="icon-btn btn-editar" title="Editar Produto" data-id="${
                      produto.id
                    }">📝</button>
                    <button class="icon-btn btn-excluir" title="Desativar/Excluir" data-id="${
                      produto.id
                    }">⏻</button>
                </div>
            </td>
        `;
    listaProdutos.appendChild(tr);
  });

  adicionarEventosBotoesAcao();
}

// 4. AÇÕES CRUD (CRIAR, EDITAR, DELETAR)
formNovo.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btnSubmit = formNovo.querySelector('button[type="submit"]');
  btnSubmit.innerText = "Salvando...";
  btnSubmit.disabled = true;

  try {
    const novoProduto = {
      nome: document.getElementById("novoNome").value,
      categoria: document.getElementById("novaCategoria").value,
      preco: parseFloat(document.getElementById("novoPreco").value),
      ativo: document.getElementById("novoStatus").checked,
    };
    await addDoc(produtosRef, novoProduto);
    formNovo.reset();
    modalNovo.style.display = "none";
  } catch (err) {
    console.error(err);
    alert("Erro ao criar produto");
  } finally {
    btnSubmit.innerText = "Criar Produto";
    btnSubmit.disabled = false;
  }
});

formEditar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btnSubmit = formEditar.querySelector('button[type="submit"]');
  btnSubmit.innerText = "Salvando...";
  btnSubmit.disabled = true;

  try {
    const id = document.getElementById("editId").value;
    const docRef = doc(db, "produtos", id);
    const dadosAtualizados = {
      nome: document.getElementById("editNome").value,
      categoria: document.getElementById("editCategoria").value,
      preco: parseFloat(document.getElementById("editPreco").value),
      ativo: document.getElementById("editStatus").checked,
    };
    await updateDoc(docRef, dadosAtualizados);
    modalEditar.style.display = "none";
  } catch (err) {
    console.error(err);
    alert("Erro ao atualizar produto");
  } finally {
    btnSubmit.innerText = "Salvar Alterações";
    btnSubmit.disabled = false;
  }
});

function adicionarEventosBotoesAcao() {
  document.querySelectorAll(".btn-editar").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.target.closest("button").getAttribute("data-id");
      const produtoParaEditar = produtosTemp.find((p) => p.id === id);

      if (produtoParaEditar) {
        document.getElementById("editId").value = id;
        document.getElementById("editNome").value = produtoParaEditar.nome;
        document.getElementById("editCategoria").value =
          produtoParaEditar.categoria;
        document.getElementById("editPreco").value = produtoParaEditar.preco;
        document.getElementById("editStatus").checked = produtoParaEditar.ativo;
        modalEditar.style.display = "block";
      }
    });
  });

  document.querySelectorAll(".btn-excluir").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.closest("button").getAttribute("data-id");
      if (confirm("Tem certeza que deseja excluir este produto do sistema?")) {
        await deleteDoc(doc(db, "produtos", id));
      }
    });
  });
}