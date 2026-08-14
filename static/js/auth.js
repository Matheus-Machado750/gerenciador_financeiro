// JS para troca visual entre telas

const authContainer = document.getElementById("authContainer");
const mostrarCadastro = document.getElementById("mostrarCadastro");
const mostrarLogin = document.getElementById("mostrarLogin");

if (authContainer && mostrarCadastro && mostrarLogin) {
    mostrarCadastro.addEventListener("click", () => {
        authContainer.classList.remove("modo-login");
        authContainer.classList.add("modo-cadastro");
    });

    mostrarLogin.addEventListener("click", () => {
        authContainer.classList.remove("modo-cadastro");
        authContainer.classList.add("modo-login");
    });
}

const togglePasswordButtons = document.querySelectorAll(".toggle_senha");

togglePasswordButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const input = button.parentElement.querySelector("input");
        const icon = button.querySelector("i");

        const senhaEstaOculta = input.type === "password";

        input.type = senhaEstaOculta ? "text" : "password";

        icon.classList.toggle("fa-eye", !senhaEstaOculta);
        icon.classList.toggle("fa-eye-slash", senhaEstaOculta);

        button.setAttribute(
            "aria-label",
            senhaEstaOculta ? "Ocultar senha" : "Mostrar senha"
        );
    });
});