const container = document.getElementById("container");
const btnCadastro = document.getElementById("register");
const btnLogin = document.getElementById("login");

btnCadastro.addEventListener("click", () => {
  container.classList.add("active");
});

btnLogin.addEventListener("click", () => {
  container.classList.remove("active");
});
