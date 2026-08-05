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

    const loginErrorContainer = document.getElementById("loginErrorMessage");
    const loginErrorText = document.getElementById("loginErrorText");
    const passContainer = document.getElementById("passInputContainer");

    function showError(message) {
        if (loginErrorContainer && loginErrorText) {
            loginErrorText.textContent = message;
            loginErrorContainer.style.display = "flex";
        }
        if (passContainer) {
            passContainer.style.borderColor = "#dc2626";
        }
    }

    function hideError() {
        if (loginErrorContainer) {
            loginErrorContainer.style.display = "none";
        }
        if (passContainer) {
            passContainer.style.borderColor = "#e2e8f0";
        }
    }

    // Ocultar error al escribir
    if(usernameInput) usernameInput.addEventListener("input", () => { checkInputs(); hideError(); });
    if(passwordInput) passwordInput.addEventListener("input", () => { checkInputs(); hideError(); });

    window.quickFillLogin = function(user, pass) {
        if(usernameInput) usernameInput.value = user;
        if(passwordInput) passwordInput.value = pass;
        hideError();
        checkInputs();
    };

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            hideError();
            
            const userVal = usernameInput.value.trim().toLowerCase();
            const passVal = passwordInput.value.trim();

            if(userVal === "" || passVal === "") return;

            // Definición de credenciales válidas por usuario
            const CREDENTIALS_MAP = {
                "produccion": {
                    validPasswords: ["produccion2026", "123456", "produccion123"],
                    roleObj: { user: 'produccion', role: 'Jefe de Producción', area: 'PRODUCCION', scope: 'PRODUCCION' }
                },
                "calidad": {
                    validPasswords: ["calidad2026", "123456", "calidad123"],
                    roleObj: { user: 'calidad', role: 'Inspector de Calidad', area: 'CALIDAD', scope: 'CALIDAD' }
                },
                "admin": {
                    validPasswords: ["admin2026", "123456", "admin123"],
                    roleObj: { user: 'admin', role: 'Administrador General', area: 'SISTEMAS', scope: 'ALL' }
                },
                "alex.quintanilla": {
                    validPasswords: ["admin2026", "123456", "safco2026", "alex2026"],
                    roleObj: { user: 'alex.quintanilla', role: 'Jefe de Sistemas', area: 'SISTEMAS', scope: 'ALL' }
                }
            };

            const userConfig = CREDENTIALS_MAP[userVal];

            const btn = btnIngresar;
            const originalText = `Iniciar Sesión`;
            btn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Autenticando...`;
            btn.disabled = true;

            setTimeout(() => {
                // Si el usuario está registrado en nuestro mapeo, validamos la contraseña
                if (userConfig) {
                    if (!userConfig.validPasswords.includes(passVal)) {
                        btn.disabled = false;
                        btn.innerHTML = originalText;
                        showError("Usuario o contraseña incorrectos. Por favor intente de nuevo.");
                        return;
                    }
                    // Guardamos pseudo-sesión en localStorage
                    localStorage.setItem("userSession", JSON.stringify(userConfig.roleObj));
                } else {
                    // Para otros usuarios genéricos de prueba, validamos si la contraseña no está vacía o si coincide con 123456 / admin2026
                    if (passVal !== "123456" && passVal !== "admin2026" && passVal !== `${userVal}2026`) {
                        btn.disabled = false;
                        btn.innerHTML = originalText;
                        showError("Usuario o contraseña incorrectos. Por favor intente de nuevo.");
                        return;
                    }
                    localStorage.setItem("userSession", JSON.stringify({
                        user: usernameInput.value.trim(),
                        role: 'Administrador',
                        area: 'SISTEMAS',
                        scope: 'ALL'
                    }));
                }
                
                // Redirigir al menú principal
                window.location.href = "menu.html";
            }, 600);
        });
    }
});
