document.getElementById('formLogin').addEventListener('submit', function(event) {
    // Evita que a página recarregue ao clicar em "Entrar"
    event.preventDefault();

    const email = document.getElementById('emailInput').value.trim().toLowerCase();
    const senha = document.getElementById('senhaInput').value.trim();

    // 1. Verifica a senha global
    if (senha !== "123456") {
        alert("❌ Senha incorreta! A senha de demonstração é 123456.");
        return;
    }

    // 2. Faz o roteamento com base no e-mail
    switch (email) {
        case "recepcao@restaurante.com":
            // Rota da Maria
            window.location.href = "../Recepcao/Recepcao.html";
            break;
            
        case "garcom@restaurante.com":
            // Rota do Garçom (Pode colocar Mesas.html ou Comanda.html)
            window.location.href = "../Garcom/Garcom.html"; 
            break;
            
        case "cozinha@restaurante.com":
            // Rota do Chef
            window.location.href = "../Cozinha/Cozinha.html";
            break;
            
        case "gerente@restaurante.com":
            // Rota da Ana Gerente
            window.location.href = "../Gerente/DashBoard.html";
            break;
            
        case "entrega@restaurante.com":
            // Rota do Bruno Entregador
            window.location.href = "../Entregador/Entregador.html";
            break;
            
        default:
            alert("❌ E-mail não encontrado no sistema. Verifique as credenciais de demonstração na tela.");
            break;
    }
});