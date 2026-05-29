const container = document.getElementById("container");
const btnCadastro = document.getElementById("register");
const btnLogin = document.getElementById("login");

btnCadastro.addEventListener("click", () => {
  container.classList.add("active");
});

btnLogin.addEventListener("click", () => {
  container.classList.remove("active");
});

// =============================================
// Botão "Entrar" — leva ao index principal do projeto
// =============================================
const formSignIn = document.getElementById("form-signin");

formSignIn.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("signin-email").value.trim();
  const senha = document.getElementById("signin-password").value.trim();

  // Validação simples: ambos os campos preenchidos
  if (!email || !senha) {
    alert("Preencha email e senha para entrar.");
    return;
  }

  // Salva o usuário logado (usado pelo script.js do index principal)
  sessionStorage.setItem("usuario_logado", email);

  // Redireciona para o index principal (sobe dois níveis a partir de Trabalho  WEB/Login/)
  window.location.href = "../../index.html";
});
