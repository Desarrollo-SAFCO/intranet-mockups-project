document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const btnIngresar = document.getElementById("btnIngresar");
    const checkUser = document.getElementById("checkUser");
    const checkPass = document.getElementById("checkPass");
    const toggleEye = document.getElementById("toggleEye");

    // Verificar inputs en cada tipeo para encender el boton en Rojo
    function checkInputs() {
        const isUserFilled = usernameInput.value.trim().length > 0;
        const isPassFilled = passwordInput.value.trim().length > 0;

        // Mostrar chekcs verdes extra solicitados segun la imagen visual
        if(isUserFilled) checkUser.classList.add("active");
        else checkUser.classList.remove("active");

        if(isPassFilled) checkPass.classList.add("active");
        else checkPass.classList.remove("active");

        // Activar boton (Rojo Safco)
        if(isUserFilled && isPassFilled) {
            btnIngresar.classList.add("active-red");
        } else {
            btnIngresar.classList.remove("active-red");
        }
    }

    if(usernameInput) usernameInput.addEventListener("input", checkInputs);
    if(passwordInput) passwordInput.addEventListener("input", checkInputs);

    // Toggle Eye (Lógica del ojito rojo de la contraseña)
    if(toggleEye) {
        toggleEye.addEventListener("click", () => {
            if(passwordInput.type === "password"){
                passwordInput.type = "text";
                toggleEye.classList.replace("bx-show", "bx-hide");
            } else {
                passwordInput.type = "password";
                toggleEye.classList.replace("bx-hide", "bx-show");
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            if(usernameInput.value.trim() === "" || passwordInput.value.trim() === "") return;

            const btn = btnIngresar;
            const originalText = btn.innerHTML;
            btn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Autenticando...`;
            btn.disabled = true;

            setTimeout(() => {
                // Guardamos pseudo-sesión en localStorage para checkear en el dash
                localStorage.setItem("userSession", JSON.stringify({ user: usernameInput.value, role: 'Inspector' }));
                
                // Redirigir al menú principal
                window.location.href = "menu.html";
            }, 800);
        });
    }
});
