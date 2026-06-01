import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import {
  getFirestore,
  collection,
  onSnapshot
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

const produtosRef = collection(db, 'produtos');
const pedidosRef = collection(db, 'pedidos');

// Elementos DOM
const listaEngenharia = document.getElementById('listaEngenharia');
const filtroCategoria = document.getElementById('filtroCategoria');

const totEstrelas = document.getElementById('totEstrelas');
const totCavalos = document.getElementById('totCavalos');
const totQuebras = document.getElementById('totQuebras');
const totCaes = document.getElementById('totCaes');

const txtMediaVendas = document.getElementById('txtMediaVendas');
const txtMargemMedia = document.getElementById('txtMargemMedia');
const txtMargemMedia2 = document.getElementById('txtMargemMedia2');

// Memória
let dictProdutos = {};
let listaDePedidos = [];

// 1. ESCUTAR PRODUTOS (Cálculo Inverso do Custo baseado na Margem Simulada)
onSnapshot(produtosRef, (snapshot) => {
    snapshot.forEach(doc => {
        const p = doc.data();
        if (p.ativo && !dictProdutos[p.nome]) {
            // Gera a mesma margem % da Matriz Estratégica
            let charSum = 0;
            for(let i=0; i < p.nome.length; i++) { charSum += p.nome.charCodeAt(i); }
            let simulatedMargin = 30 + (charSum % 55); 
            
            const preco = Number(p.preco) || 0;
            
            // Reversa a matemática: Se a margem é X%, qual é o custo em R$?
            // Lucro em R$ = Preco * (Margem / 100)
            const lucroReais = preco * (simulatedMargin / 100);
            const custoReais = preco - lucroReais;

            dictProdutos[p.nome] = { 
                nome: p.nome, 
                categoria: p.categoria || 'Diversos',
                preco: preco, 
                custo: custoReais,
                lucroDinheiro: lucroReais,
                margem: simulatedMargin,
                qtdVendida: 0,
                receitaTotal: 0
            };
        }
    });
    processarTabela();
});

// 2. ESCUTAR PEDIDOS
onSnapshot(pedidosRef, (snapshot) => {
    listaDePedidos = [];
    snapshot.forEach(doc => {
        listaDePedidos.push(doc.data());
    });
    processarTabela();
});

// EVENTO DE FILTRO
filtroCategoria.addEventListener('change', () => {
    processarTabela();
});

// 3. O CÉREBRO: PROCESSA A MATEMÁTICA E RENDERIZA A TABELA
function processarTabela() {
    if (Object.keys(dictProdutos).length === 0 || listaDePedidos.length === 0) {
        listaEngenharia.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #777; padding: 30px;">Aguardando vendas para gerar a Engenharia do Cardápio.</td></tr>';
        return;
    }

    // Zera contadores
    Object.keys(dictProdutos).forEach(k => {
        dictProdutos[k].qtdVendida = 0;
        dictProdutos[k].receitaTotal = 0;
    });
    
    let totalItensVendidosGlobal = 0;

    // Contabiliza vendas
    listaDePedidos.forEach(pedido => {
        if (pedido.status === 'Recusado' || pedido.status === 'Aguardando Aprovação') return;

        if (pedido.itens) {
            pedido.itens.forEach(item => {
                if (dictProdutos[item.nome]) {
                    dictProdutos[item.nome].qtdVendida += Number(item.quantidade);
                    dictProdutos[item.nome].receitaTotal += (Number(item.quantidade) * Number(item.preco));
                    totalItensVendidosGlobal += Number(item.quantidade);
                }
            });
        }
    });

    // Calcula Limites (Linhas de Corte da Matriz)
    const totalProdutosAtivos = Object.keys(dictProdutos).length;
    const mediaDeVendas = totalProdutosAtivos > 0 ? (totalItensVendidosGlobal / totalProdutosAtivos) : 1;
    
    let somaMargens = 0;
    let ativosVendidos = 0;
    
    const produtosVendidos = Object.values(dictProdutos).filter(p => p.qtdVendida > 0);

    produtosVendidos.forEach(p => {
        somaMargens += p.margem;
        ativosVendidos++;
    });

    const margemMediaGlobal = ativosVendidos > 0 ? (somaMargens / ativosVendidos) : 50;

    // Atualiza os textos dinâmicos do rodapé
    txtMediaVendas.innerText = Math.round(mediaDeVendas);
    txtMargemMedia.innerText = margemMediaGlobal.toFixed(1);
    txtMargemMedia2.innerText = margemMediaGlobal.toFixed(1);

    // Variáveis de renderização
    let contadores = { estrela: 0, cavalo: 0, quebra: 0, cao: 0 };
    listaEngenharia.innerHTML = '';
    
    const categoriaSelecionada = filtroCategoria.value;

    // Ordena do mais vendido pro menos vendido
    produtosVendidos.sort((a, b) => b.qtdVendida - a.qtdVendida);

    produtosVendidos.forEach(p => {
        
        let popularidadePercentual = (p.qtdVendida / mediaDeVendas) * 100;
        let larguraBarra = Math.min(popularidadePercentual, 100); // Trava a barra visual em 100%
        
        let emoji = "";
        let recomendacao = "";

        // CLASSIFICAÇÃO
        if (popularidadePercentual >= 100 && p.margem >= margemMediaGlobal) {
            emoji = "⭐";
            recomendacao = "Mantenha em destaque! Produto lucrativo e popular.";
            contadores.estrela++;
        } 
        else if (popularidadePercentual < 100 && p.margem >= margemMediaGlobal) {
            emoji = "🧩";
            recomendacao = "Invista em marketing ou ajuste o posicionamento.";
            contadores.quebra++;
        }
        else if (popularidadePercentual >= 100 && p.margem < margemMediaGlobal) {
            emoji = "🐎";
            recomendacao = "Considere aumentar o preço ou reduzir o custo.";
            contadores.cavalo++;
        }
        else {
            emoji = "🐶";
            recomendacao = "Considere remover do cardápio ou reformular.";
            contadores.cao++;
        }

        // Filtro de Categoria (Só não renderiza se a categoria for diferente, mas conta nos KPIs globais)
        if (categoriaSelecionada !== "Todas" && p.categoria !== categoriaSelecionada) {
            return; 
        }

        // Adiciona à Tabela
        listaEngenharia.innerHTML += `
            <tr>
                <td><strong style="color: #fff;">${p.nome}</strong></td>
                <td>${p.categoria}</td>
                <td style="font-weight: bold;">R$ ${p.preco.toFixed(2)}</td>
                <td><span class="texto-secundario">R$ ${p.custo.toFixed(2)}</span></td>
                <td>
                    <span class="td-destaque">R$ ${p.lucroDinheiro.toFixed(2)}</span>
                    <span class="texto-secundario">${p.margem.toFixed(1)}%</span>
                </td>
                <td style="font-weight: bold; font-size: 1.1em;">${p.qtdVendida}</td>
                <td>
                    <div class="bar-bg">
                        <div class="bar-fill" style="width: ${larguraBarra}%;"></div>
                    </div>
                    <span class="texto-secundario">${popularidadePercentual.toFixed(1)}%</span>
                </td>
                <td class="emoji-classificacao">${emoji}</td>
                <td style="color: #aaa; font-size: 0.85em;">${recomendacao}</td>
            </tr>
        `;
    });

    // Se o filtro ocultou tudo
    if (listaEngenharia.innerHTML === '') {
        listaEngenharia.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #777; padding: 30px;">Nenhum produto vendido nesta categoria.</td></tr>';
    }

    // Atualiza os Resumos (KPIs globais sempre refletem o total do restaurante)
    totEstrelas.innerText = contadores.estrela;
    totCavalos.innerText = contadores.cavalo;
    totQuebras.innerText = contadores.quebra;
    totCaes.innerText = contadores.cao;
}