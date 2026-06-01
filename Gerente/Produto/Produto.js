    // Importações exclusivas via CDN (Vanilla JS)
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
    import { 
        getFirestore, 
        collection, 
        addDoc, 
        getDocs, 
        doc, 
        updateDoc, 
        deleteDoc 
    } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

    // SUAS CREDENCIAIS DO FIREBASE
    const firebaseConfig = {
        apiKey: "AIzaSyBayur0I7uCelwae7NVXot19cYOD2fa0ro",
        authDomain: "latavola-99df2.firebaseapp.com",
        projectId: "latavola-99df2",
        storageBucket: "latavola-99df2.firebasestorage.app",
        messagingSenderId: "336225970527",
        appId: "1:336225970527:web:5f60e799c507931143aeea",
        measurementId: "G-XF8PMT0KGV"
    };

    // Inicialização
    const app = initializeApp(firebaseConfig);

    // INICIALIZAÇÃO DO FIRESTORE (A linha que faltava)
    const db = getFirestore(app); 
    const produtosRef = collection(db, "produtos");

    // Elementos do DOM
    const listaProdutos = document.getElementById('listaProdutos');

    // Elementos - Modal Novo
    const modalNovo = document.getElementById('modalNovo');
    const btnNovoProduto = document.getElementById('btnNovoProduto');
    const btnCancelarNovo = document.getElementById('btnCancelarNovo');
    const fecharModalNovo = document.getElementById('fecharModalNovo');
    const formNovo = document.getElementById('formNovo');

    // Elementos - Modal Editar
    const modalEditar = document.getElementById('modalEditar');
    const btnCancelarEditar = document.getElementById('btnCancelarEditar');
    const fecharModalEditar = document.getElementById('fecharModalEditar');
    const formEditar = document.getElementById('formEditar');

    // Controle de Modais
    btnNovoProduto.onclick = () => modalNovo.style.display = 'block';
    btnCancelarNovo.onclick = () => modalNovo.style.display = 'none';
    fecharModalNovo.onclick = () => modalNovo.style.display = 'none';

    btnCancelarEditar.onclick = () => modalEditar.style.display = 'none';
    fecharModalEditar.onclick = () => modalEditar.style.display = 'none';

    // Carregar Produtos (Read)
    async function carregarProdutos() {
        listaProdutos.innerHTML = '';
        const querySnapshot = await getDocs(produtosRef);
        
        querySnapshot.forEach((documento) => {
            const produto = documento.data();
            const id = documento.id;
            const statusTexto = produto.ativo ? 'Ativo' : 'Inativo';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${produto.nome}</td>
                <td>${produto.categoria}</td>
                <td>R$ ${Number(produto.preco).toFixed(2)}</td>
                <td>${statusTexto}</td>
                <td>
                    <button class="btn-editar" data-id="${id}">Editar</button>
                    <button class="btn-excluir" data-id="${id}">Excluir</button>
                </td>
            `;
            listaProdutos.appendChild(tr);
        });

        adicionarEventosBotoesAcao();
    }

    // Criar Produto (Create)
    formNovo.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const novoProduto = {
            nome: document.getElementById('novoNome').value,
            categoria: document.getElementById('novaCategoria').value,
            preco: parseFloat(document.getElementById('novoPreco').value),
            ativo: document.getElementById('novoStatus').checked
        };

        await addDoc(produtosRef, novoProduto);
        formNovo.reset();
        modalNovo.style.display = 'none';
        carregarProdutos();
    });

    // Editar Produto (Update)
    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('editId').value;
        const docRef = doc(db, "produtos", id);
        
        const dadosAtualizados = {
            nome: document.getElementById('editNome').value,
            categoria: document.getElementById('editCategoria').value,
            preco: parseFloat(document.getElementById('editPreco').value),
            ativo: document.getElementById('editStatus').checked
        };

        await updateDoc(docRef, dadosAtualizados);
        modalEditar.style.display = 'none';
        carregarProdutos();
    });

    // Excluir Produto (Delete)
    async function deletarProduto(id) {
        if(confirm("Tem certeza que deseja excluir este produto?")) {
            const docRef = doc(db, "produtos", id);
            await deleteDoc(docRef);
            carregarProdutos();
        }
    }

    // Vincula os eventos aos botões gerados dinamicamente na tabela
    function adicionarEventosBotoesAcao() {
        const botoesEditar = document.querySelectorAll('.btn-editar');
        const botoesExcluir = document.querySelectorAll('.btn-excluir');

        botoesEditar.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                const linha = e.target.closest('tr');
                const nome = linha.children[0].innerText;
                const categoria = linha.children[1].innerText;
                const preco = linha.children[2].innerText.replace('R$ ', '');
                const ativo = linha.children[3].innerText === 'Ativo';

                // Preenche o modal
                document.getElementById('editId').value = id;
                document.getElementById('editNome').value = nome;
                document.getElementById('editCategoria').value = categoria;
                document.getElementById('editPreco').value = preco;
                document.getElementById('editStatus').checked = ativo;

                modalEditar.style.display = 'block';
            });
        });

        botoesExcluir.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                deletarProduto(id);
            });
        });
    }

    // Inicia a aplicação carregando a tabela
    carregarProdutos();