import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

// SUAS CREDENCIAIS
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

const pedidosRef = collection(db, "pedidos");
const mesasRef = collection(db, "mesas");

// Elementos da Tela
const listaPendentes = document.getElementById("listaPendentes");
const containerPendentes = document.getElementById("containerPendentes");
const contadorPendentesCard = document.getElementById("contadorPendentes");
const qtdPendentesSecao = document.getElementById("qtdPendentesSecao");
const qtdAndamento = document.getElementById("qtdAndamento");
const contadorCozinha = document.getElementById("contadorCozinha");
const contadorMesasLivres = document.getElementById("contadorMesasLivres");
const contadorMesasOcupadas = document.getElementById("contadorMesasOcupadas");
const qtdComandas = document.getElementById("qtdComandas");
const listaComandasAtivas = document.getElementById("listaComandasAtivas");
const listaAndamento = document.getElementById("listaAndamento");

// 1. ESCUTAR PEDIDOS (DELIVERY) EM TEMPO REAL
onSnapshot(pedidosRef, (snapshot) => {
    try {
        listaPendentes.innerHTML = "";
        listaAndamento.innerHTML = "";

        let countPendentes = 0;
        let countAndamento = 0;
        let countItensCozinha = 0;

        snapshot.forEach((documento) => {
            const pedido = documento.data();
            const id = documento.id;

            // Verifica se é delivery
            if (pedido.cliente) {
                if (pedido.status === "Aguardando Aprovação") {
                    listaPendentes.innerHTML += criarCardPendente(id, pedido);
                    countPendentes++;
                } 
                else if (["Pendente", "Em Preparo", "Pronto", "Aguardando Entregador"].includes(pedido.status)) {
                    listaAndamento.innerHTML += criarCardAndamento(id, pedido);
                    countAndamento++;

                    if ((pedido.status === "Pendente" || pedido.status === "Em Preparo") && pedido.itens) {
                        pedido.itens.forEach((i) => (countItensCozinha += i.quantidade || 0));
                    }
                }
            }
        });

        // Oculta a caixa dourada se não tiver pedidos
        if (countPendentes === 0) {
            containerPendentes.style.display = "none";
        } else {
            containerPendentes.style.display = "block";
        }

        if (countAndamento === 0) {
            listaAndamento.innerHTML = '<p style="color: #777;">Nenhum delivery em andamento.</p>';
        }

        contadorPendentesCard.innerText = countPendentes;
        qtdPendentesSecao.innerText = countPendentes;
        qtdAndamento.innerText = countAndamento;
        contadorCozinha.innerText = countItensCozinha;

        configurarBotoes();

    } catch (error) {
        console.error("Erro ao carregar os pedidos na recepção:", error);
    }
});

// 2. ESCUTAR MESAS EM TEMPO REAL
onSnapshot(mesasRef, (snapshot) => {
    try {
        listaComandasAtivas.innerHTML = "";
        let countLivres = 0;
        let countOcupadas = 0;
        let mesasArray = [];

        snapshot.forEach((docSnap) => {
            mesasArray.push(docSnap.data());
        });

        mesasArray.sort((a, b) => a.numero - b.numero);

        mesasArray.forEach((mesa) => {
            if (mesa.status === "Livre") {
                countLivres++;
            } else {
                countOcupadas++;
                const clienteTexto = mesa.cliente ? mesa.cliente : "Sem nome";
                const garcomTexto = mesa.garcom ? mesa.garcom : "Garçom não definido";
                const valor = mesa.total ? mesa.total : 0;

                listaComandasAtivas.innerHTML += `
                    <div class="item-andamento">
                        <div>
                            <strong style="color: #e74c3c">#${mesa.numero}</strong>
                            <strong style="margin-left: 10px">Mesa ${mesa.numero}</strong><br />
                            <span style="color: #aaa; font-size: 0.85em; margin-left: 30px">
                                ${clienteTexto} • ${mesa.pessoas || 0} pessoas
                            </span>
                        </div>
                        <div style="text-align: right">
                            <strong style="color: #d4af37">R$ ${valor.toFixed(2)}</strong><br />
                            <span style="color: #777; font-size: 0.8em">${garcomTexto}</span>
                        </div>
                    </div>
                `;
            }
        });

        if (countOcupadas === 0) {
            listaComandasAtivas.innerHTML = '<p style="color: #777">Nenhuma comanda ativa.</p>';
        }

        contadorMesasLivres.innerText = countLivres;
        contadorMesasOcupadas.innerText = countOcupadas;
        qtdComandas.innerText = countOcupadas;
    } catch (error) {
        console.error("Erro ao carregar as mesas na recepção:", error);
    }
});

// FUNÇÕES AUXILIARES
function criarCardPendente(id, pedido) {
    const shortId = "#" + id.substring(id.length - 4).toUpperCase();
    
    const horaPedido = pedido.data ? new Date(pedido.data) : new Date();
    const agora = new Date();
    const diffMinutos = Math.floor((agora - horaPedido) / 60000);
    const textoTempo = (isNaN(diffMinutos) || diffMinutos < 1) ? "agora mesmo" : `há ${diffMinutos} minutos`;

    let itensHTML = "";
    if (pedido.itens) {
        pedido.itens.forEach((item) => {
            itensHTML += `<span style="display: block; font-size: 0.9em;">${item.quantidade}x ${item.nome}</span>`;
        });
    }

    const total = pedido.resumo ? pedido.resumo.total : (pedido.total || 0);

    return `
        <div class="pedido-pendente">
            <div class="pedido-header">
                <h3 style="margin: 0; color: #d4af37; font-size: 1.5em;">${shortId}</h3>
                <span class="badge">Recebido</span>
                <span style="color: #aaa; font-size: 0.85em;">${textoTempo}</span>
            </div>
            
            <div class="pedido-grid">
                <div>
                    <span class="info-label">Cliente</span>
                    <div class="info-value">${pedido.cliente.nome || 'Sem Nome'}</div>
                    <div style="color: #aaa; font-size: 0.85em;">${pedido.cliente.telefone || ''}</div>
                    <div style="margin-top: 15px;">
                        <span class="info-label">Total:</span>
                        <strong style="font-size: 1.2em;">R$ ${Number(total).toFixed(2)}</strong>
                    </div>
                </div>
                <div>
                    <span class="info-label">Itens</span>
                    ${itensHTML}
                </div>
            </div>

            <div class="botoes-aprovacao">
                <button class="btn-aprovar" data-id="${id}">✓ Aprovar e Enviar para Cozinha</button>
                <button class="btn-recusar" data-id="${id}">Recusar Pedido</button>
            </div>
        </div>
    `;
}

function criarCardAndamento(id, pedido) {
    const shortId = "#" + id.substring(id.length - 4).toUpperCase();
    const total = pedido.resumo ? pedido.resumo.total : (pedido.total || 0);
    
    let badgeClass = "badge-preparo";
    let statusDisplay = pedido.status;
    let subStatus = "Aguardando preparo";

    if (pedido.status === "Em Preparo") {
        subStatus = "Sendo preparado";
    } else if (pedido.status === "Pronto" || pedido.status === "Aguardando Entregador") {
        badgeClass = "badge-pronto";
        statusDisplay = "Pronto";
        subStatus = "Aguardando entregador";
    }

    return `
        <div class="item-andamento">
            <div style="display: flex; align-items: center; gap: 15px;">
                <strong style="font-size: 1.2em;">${shortId}</strong>
                <span class="${badgeClass}">${statusDisplay}</span>
                <span style="color: #aaa; font-size: 0.9em;">${pedido.cliente.nome || 'Sem Nome'}</span>
            </div>
            <div style="text-align: right;">
                <strong style="color: #d4af37;">R$ ${Number(total).toFixed(2)}</strong><br>
                <span style="color: #777; font-size: 0.8em;">${subStatus}</span>
            </div>
        </div>
    `;
}

function configurarBotoes() {
    document.querySelectorAll(".btn-aprovar").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            const id = e.target.getAttribute("data-id");
            e.target.disabled = true;
            e.target.innerText = "Aprovando...";
            try {
                await updateDoc(doc(db, "pedidos", id), { status: "Pendente" });
            } catch(err) {
                console.error("Erro ao aprovar:", err);
                e.target.disabled = false;
                e.target.innerText = "✓ Aprovar e Enviar para Cozinha";
            }
        });
    });

    document.querySelectorAll(".btn-recusar").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            if (confirm("Tem certeza que deseja recusar este pedido? O cliente será notificado.")) {
                const id = e.target.getAttribute("data-id");
                e.target.disabled = true;
                e.target.innerText = "Recusando...";
                try {
                    await updateDoc(doc(db, "pedidos", id), { status: "Recusado" });
                } catch(err) {
                    console.error("Erro ao recusar:", err);
                    e.target.disabled = false;
                    e.target.innerText = "Recusar Pedido";
                }
            }
        });
    });
}