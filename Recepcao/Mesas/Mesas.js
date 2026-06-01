import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import { getFirestore, collection, onSnapshot, getDocs, setDoc, doc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

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

const gridMesas = document.getElementById('gridMesas');

// FUNÇÃO MÁGICA: Configuração Inicial das 20 mesas
async function inicializarMesasSeVazio() {
    const snapshot = await getDocs(mesasRef);
    if (snapshot.empty) {
        console.log("Criando as 20 mesas no banco de dados...");
        gridMesas.innerHTML = '<p>Criando as mesas pela primeira vez, aguarde...</p>';
        
        // Regra das Mesas: 1-7 (2px), 8-14 (4px), 15-20 (6px)
        for(let i = 1; i <= 20; i++) {
            let capacidade = 2;
            if (i >= 8 && i <= 14) capacidade = 4;
            if (i >= 15) capacidade = 6;

            await setDoc(doc(db, 'mesas', `mesa_${i}`), {
                numero: i,
                capacidade: capacidade,
                status: 'Livre',
                pessoas: 0,
                cliente: '',
                garcom: '',
                total: 0
            });
        }
    }
    // Depois de garantir que as mesas existem, começa a escutar o tempo real
    escutarMesasEmTempoReal();
}

// Escuta as atualizações em tempo real e desenha na tela
function escutarMesasEmTempoReal() {
    onSnapshot(mesasRef, (snapshot) => {
        gridMesas.innerHTML = '';
        const mesasArray = [];

        snapshot.forEach(docSnap => {
            mesasArray.push(docSnap.data());
        });

        // Ordena para garantir que fiquem de 1 a 20 na tela
        mesasArray.sort((a, b) => a.numero - b.numero);

        mesasArray.forEach(mesa => {
            let classeCor = 'livre';
            let textoStatus = 'Livre';
            let htmlInfoExtra = '';

            if (mesa.status === 'Ocupada') {
                classeCor = 'ocupada';
                textoStatus = 'Ocupada';
                htmlInfoExtra = `
                    <div class="mesa-info">
                        ${mesa.cliente}<br>
                        <div class="mesa-total">R$ ${mesa.total.toFixed(2)}</div>
                    </div>
                `;
            } else if (mesa.status === 'Aguardando Pagamento') {
                classeCor = 'aguardando';
                textoStatus = 'Aguardando Pagamento';
                htmlInfoExtra = `
                    <div class="mesa-info">
                        ${mesa.cliente}<br>
                        <div class="mesa-total">R$ ${mesa.total.toFixed(2)}</div>
                    </div>
                `;
            }

            // Exibe a capacidade total se estiver livre, ou a qtd de pessoas atual se ocupada
            const textoPessoas = mesa.status === 'Livre' ? `👥 ${mesa.capacidade} lugares` : `👥 ${mesa.pessoas} pessoas`;

            gridMesas.innerHTML += `
                <div class="mesa-card ${classeCor}">
                    <div class="mesa-numero">${mesa.numero}</div>
                    <div class="mesa-status">${textoStatus}</div>
                    <div class="mesa-capacidade">${textoPessoas}</div>
                    ${htmlInfoExtra}
                </div>
            `;
        });
    });
}

// Inicia o processo
inicializarMesasSeVazio();