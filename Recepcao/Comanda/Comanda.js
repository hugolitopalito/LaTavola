import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: 'AIzaSyBayur0I7uCelwae7NVXot19cYOD2fa0ro',
    authDomain: 'latavola-99df2.firebaseapp.com',
    projectId: 'latavola-99df2',
    storageBucket: 'latavola-99df2.firebasestorage.app',
    messagingSenderId: '336225970527',
    appId: '1:336225970527:web:5f60e799c507931143aeea',
    measurementId: 'G-XF8PMT0KGV',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const mesasRef = collection(db, 'mesas');

const inputPessoas = document.getElementById('qtdPessoas');
const selectMesa = document.getElementById('selectMesa');
const formComanda = document.getElementById('formComanda');
const btnSubmit = document.getElementById('btnSubmit');

let mesasLivres = [];

// Carrega as mesas livres do banco de dados
async function carregarMesasLivres() {
    const snapshot = await getDocs(mesasRef);
    mesasLivres = [];
    snapshot.forEach(docSnap => {
        const mesa = docSnap.data();
        if (mesa.status === 'Livre') {
            mesasLivres.push({ id: docSnap.id, ...mesa });
        }
    });
}

// Filtra as mesas de acordo com a quantidade de pessoas digitada
inputPessoas.addEventListener('input', (e) => {
    const qtd = parseInt(e.target.value) || 0;
    selectMesa.innerHTML = '<option value="">Selecione uma mesa</option>';
    
    // Filtra as mesas que cabem a quantidade de pessoas
    const mesasCompativeis = mesasLivres.filter(mesa => mesa.capacidade >= qtd);
    
    // Ordena pelo número da mesa
    mesasCompativeis.sort((a, b) => a.numero - b.numero);

    mesasCompativeis.forEach(mesa => {
        const option = document.createElement('option');
        option.value = mesa.id;
        option.innerText = `Mesa ${mesa.numero} (Capacidade: ${mesa.capacidade} pessoas)`;
        selectMesa.appendChild(option);
    });

    if (mesasCompativeis.length === 0 && qtd > 0) {
        selectMesa.innerHTML = '<option value="">Nenhuma mesa livre para essa capacidade</option>';
    }
});

// Ação de Salvar a Comanda
formComanda.addEventListener('submit', async (e) => {
    e.preventDefault();
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Abrindo...";

    const idMesa = selectMesa.value;
    const pessoas = parseInt(inputPessoas.value);
    const cliente = document.getElementById('nomeCliente').value || "Sem nome";
    const garcom = document.getElementById('nomeGarcom').value;

    try {
        // Atualiza a mesa no banco de dados
        await updateDoc(doc(db, 'mesas', idMesa), {
            status: "Ocupada",
            pessoas: pessoas,
            cliente: cliente,
            garcom: garcom,
            total: 0 // Comanda começa zerada
        });
        
        alert("Comanda aberta com sucesso!");
        window.location.href = ".././Mesas/Mesas.html"; // Redireciona para o painel de mesas
    } catch (error) {
        console.error("Erro ao abrir comanda:", error);
        alert("Erro ao abrir comanda.");
        btnSubmit.disabled = false;
        btnSubmit.innerText = "Abrir Comanda";
    }
});

carregarMesasLivres();