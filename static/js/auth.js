// JS para troca visual entre telas

const authContainer = document.getElementById("authContainer");
const mostrarCadastro = document.getElementById("mostrarCadastro");
const mostrarLogin = document.getElementById("mostrarLogin");

mostrarCadastro.addEventListener("click", () => {
    authContainer.classList.remove("modo-login");
    authContainer.classList.add("modo-cadastro");
});

mostrarLogin.addEventListener("click", () => {
    authContainer.classList.remove("modo-cadastro");
    authContainer.classList.add("modo-login");
});