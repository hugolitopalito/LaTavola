import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

// SUAS CREDENCIAIS DO FIREBASE
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

// Referências das coleções
const pedidosRef = collection(db, 'pedidos');
const configRef = doc(db, 'configuracoes', 'geral');

// VARIÁVEIS DE CONFIGURAÇÃO DA GERENTE (Com valores padrão iniciais)
let taxaPorKm = 5.00;
let distMax = 20.0;

// ESCUTAR CONFIGURAÇÕES EM TEMPO REAL
onSnapshot(configRef, (docSnap) => {
    if (docSnap.exists()) {
        const config = docSnap.data();
        if (config.taxaEntrega !== undefined) {
            taxaPorKm = Number(config.taxaEntrega);
        }
        if (config.distanciaMax !== undefined) {
            distMax = Number(config.distanciaMax);
        }
    }
});

// Estatísticas do entregador
let stats = {
    entregasHoje: 0,
    emRota: 0,
    ganhosHoje: 0,
    somaDistancias: 0
};

// Guarda a distância gerada
const distanciasCalculadas = {};

// Elementos da Tela
const listaPedidos = document.getElementById('listaPedidos');
const listaAndamento = document.getElementById('listaAndamento');
const secaoAndamento = document.getElementById('secaoAndamento');
const secaoResumo = document.getElementById('secaoResumo');
const qtdDisponiveis = document.getElementById('qtdDisponiveis');

// Stats Topo
const statEntregas = document.getElementById('statEntregas');
const statRota = document.getElementById('statRota');
const statGanhos = document.getElementById('statGanhos');
const statDistancia = document.getElementById('statDistancia');

// Stats Resumo
const resumoEntregas = document.getElementById('resumoEntregas');
const resumoGanhos = document.getElementById('resumoGanhos');
const resumoDistancia = document.getElementById('resumoDistancia');

// 1. ESCUTAR PEDIDOS EM TEMPO REAL E CALCULAR ESTATÍSTICAS
onSnapshot(pedidosRef, (snapshot) => {
    listaPedidos.innerHTML = '';
    listaAndamento.innerHTML = '';
    
    let contadorDisponiveis = 0;
    
    stats.emRota = 0; 
    stats.entregasHoje = 0;
    stats.ganhosHoje = 0;
    stats.somaDistancias = 0;

    snapshot.forEach((documento) => {
        const pedido = documento.data();
        const id = documento.id;

        if (!pedido.cliente) return;

        if (pedido.status === "Entregue") {
            stats.entregasHoje++;
            stats.ganhosHoje += (pedido.taxaEntregador || 0);
            stats.somaDistancias += (pedido.distanciaPercorrida || 0);
            return; 
        }

        // GERA A DISTÂNCIA RESPEITANDO O LIMITE DA GERENTE
        if (!distanciasCalculadas[id]) {
            // Garante que o gerador não ultrapasse o distMax
            let limiteGerador = distMax > 0.5 ? distMax - 0.5 : distMax;
            distanciasCalculadas[id] = parseFloat((Math.random() * limiteGerador + 0.5).toFixed(1));
        }
        
        const distancia = distanciasCalculadas[id];
        
        // O CÁLCULO DINÂMICO USANDO A TAXA DA GERENTE
        const taxaGanha = distancia * taxaPorKm; 

        if (pedido.status === "Em Rota") {
            stats.emRota++;
            listaAndamento.innerHTML += criarCardAndamento(id, pedido, distancia, taxaGanha);
        } 
        else if (pedido.status === "Aguardando Entregador") {
            contadorDisponiveis++;
            listaPedidos.innerHTML += criarCardDisponivel(id, pedido, distancia, taxaGanha);
        }
    });

    if (stats.emRota > 0) {
        secaoAndamento.style.display = "block";
        listaPedidos.innerHTML = `<p style="text-align:center; color:#777; padding: 20px 0;">Finalize suas entregas atuais para aceitar novos pedidos</p>`;
    } else {
        secaoAndamento.style.display = "none";
        if (contadorDisponiveis === 0) {
            listaPedidos.innerHTML = '<p style="color: #aaa; text-align:center;">Nenhum pedido disponível no momento.</p>';
        }
    }

    if (stats.entregasHoje > 0) {
        secaoResumo.style.display = "block";
    } else {
        secaoResumo.style.display = "none";
    }

    qtdDisponiveis.innerText = contadorDisponiveis;
    atualizarEstatisticas();
    configurarBotoesAcao();
});

// 2A. CARD DISPONÍVEL 
function criarCardDisponivel(id, pedido, distancia, taxaGanha) {
    const shortId = "#" + id.substring(id.length - 4).toUpperCase();
    const totalPedido = pedido.resumo ? pedido.resumo.subtotal : pedido.total;

    return `
        <div class="pedido-card">
            <div class="pedido-header">
                <h3 style="margin: 0; font-size: 1.5em;">${shortId} <span class="badge">Pronto para Entrega</span></h3>
            </div>
            <div class="pedido-info">
                <div class="info-block">
                    <span>📍 Endereço</span>
                    <strong>${pedido.cliente.endereco}</strong><br>
                    <span class="sub">${pedido.cliente.bairro}</span>
                </div>
                <div class="info-block" style="text-align: center;">
                    <span>🧭 Distância</span>
                    <strong style="color: #d4af37;">${distancia} km</strong>
                </div>
                <div class="info-block" style="text-align: right;">
                    <span>💲 Você Ganha</span>
                    <strong style="color: #d4af37;">R$ ${taxaGanha.toFixed(2)}</strong>
                </div>
            </div>
            <div class="pedido-footer">
                <span style="color: #aaa;">Total a receber: <strong>R$ ${totalPedido.toFixed(2)}</strong></span>
                <button class="btn-aceitar" data-id="${id}">Aceitar Entrega</button>
            </div>
        </div>
    `;
}

// 2B. CARD EM ANDAMENTO
function criarCardAndamento(id, pedido, distancia, taxaGanha) {
    const shortId = "#" + id.substring(id.length - 4).toUpperCase();
    const valorPedido = pedido.resumo ? pedido.resumo.subtotal : (pedido.total || 0);
    const totalFinal = valorPedido + taxaGanha; 

    return `
        <div class="pedido-card" style="border-color: #d4af37;">
            <div class="pedido-header" style="border-bottom: 1px solid #444; padding-bottom: 15px;">
                <h3 style="margin: 0; font-size: 1.5em; color: #d4af37;">${shortId} <span style="font-size: 0.6em; color: #aaa; font-weight: normal; margin-left: 10px;">Saiu agora para entrega</span></h3>
            </div>
            
            <div class="pedido-info" style="margin-top: 15px;">
                <div class="info-block">
                    <span>Cliente</span>
                    <strong>${pedido.cliente.nome}</strong><br>
                    <span class="sub">${pedido.cliente.telefone}</span>
                </div>
                <div class="info-block">
                    <span>Endereço</span>
                    <strong>${pedido.cliente.endereco}</strong><br>
                    <span class="sub">${pedido.cliente.bairro} • ${distancia}km</span>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; background: #1a1a1a; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <div>
                    <span style="color: #aaa; font-size: 0.8em; display: block;">Valor do Pedido</span>
                    <strong>R$ ${valorPedido.toFixed(2)}</strong>
                </div>
                <div>
                    <span style="color: #aaa; font-size: 0.8em; display: block;">Taxa de Entrega</span>
                    <strong style="color: #d4af37;">R$ ${taxaGanha.toFixed(2)}</strong>
                </div>
                <div style="text-align: right;">
                    <span style="color: #aaa; font-size: 0.8em; display: block;">Total a Cobrar</span>
                    <strong style="color: #d4af37; font-size: 1.2em;">R$ ${totalFinal.toFixed(2)}</strong>
                </div>
            </div>
            
            <button class="btn-entregue" data-id="${id}" data-distancia="${distancia}" data-ganho="${taxaGanha}">
                ✓ Marcar como Entregue
            </button>
        </div>
    `;
}

// 3. AÇÕES DOS BOTÕES (COM TIMERS ANTI-RACE CONDITION)
function configurarBotoesAcao() {
    
    document.querySelectorAll('.btn-aceitar').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const idPedido = e.target.getAttribute('data-id');
            e.target.disabled = true;
            e.target.innerText = "Aceitando...";

            try {
                await updateDoc(doc(db, 'pedidos', idPedido), {
                    status: "Em Rota"
                });
            } catch(error) {
                console.error("Erro ao aceitar:", error);
                e.target.disabled = false;
                e.target.innerText = "Aceitar Entrega";
            }
        });
    });

    document.querySelectorAll('.btn-entregue').forEach(btn => {
        
        btn.disabled = true;
        let tempo = 3;
        btn.innerText = `Aguarde ${tempo}s para confirmar...`;
        btn.style.opacity = "0.7";
        
        let intervalo = setInterval(() => {
            tempo--;
            if (tempo > 0) {
                btn.innerText = `Aguarde ${tempo}s para confirmar...`;
            } else {
                clearInterval(intervalo);
                btn.disabled = false;
                btn.innerText = "✓ Marcar como Entregue";
                btn.style.opacity = "1";
            }
        }, 1000);

        btn.addEventListener('click', async (e) => {
            const idPedido = e.target.getAttribute('data-id');
            const distancia = parseFloat(e.target.getAttribute('data-distancia'));
            const ganho = parseFloat(e.target.getAttribute('data-ganho'));

            e.target.disabled = true;
            e.target.innerText = "Processando...";

            try {
                await updateDoc(doc(db, 'pedidos', idPedido), {
                    status: "Entregue",
                    distanciaPercorrida: distancia,
                    taxaEntregador: ganho
                });
                
            } catch(error) {
                console.error("Erro ao finalizar:", error);
                e.target.disabled = false;
                e.target.innerText = "✓ Marcar como Entregue";
            }
        });
    });
}

// 4. ATUALIZAR NÚMEROS DA TELA
function atualizarEstatisticas() {
    statEntregas.innerText = stats.entregasHoje;
    statRota.innerText = stats.emRota;
    statGanhos.innerText = "R$ " + stats.ganhosHoje.toFixed(2);
    
    const media = stats.entregasHoje > 0 ? (stats.somaDistancias / stats.entregasHoje) : 0;
    statDistancia.innerText = media.toFixed(1) + " km";

    resumoEntregas.innerText = stats.entregasHoje;
    resumoGanhos.innerText = "R$ " + stats.ganhosHoje.toFixed(2);
    resumoDistancia.innerText = stats.somaDistancias.toFixed(1) + " km";
}