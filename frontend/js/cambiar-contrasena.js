
document.addEventListener("DOMContentLoaded", () => {

    const formulario = document.getElementById("formCambiarContrasena");
    const mensaje = document.getElementById("mensaje");

    formulario.addEventListener("submit", async (e) => {
        e.preventDefault();

        const contrasenaActual = document.getElementById("contrasenaActual").value;
        const contrasenaNueva = document.getElementById("contrasenaNueva").value;
        const confirmarContrasena = document.getElementById("confirmarContrasena").value;

        const token = sessionStorage.getItem("token");

        if (!token) {
            mensaje.textContent = "Debes iniciar sesión nuevamente.";
            return;
        }

        if (contrasenaNueva.length < 12 || new TextEncoder().encode(contrasenaNueva).length > 72) {
            mensaje.textContent = "La contraseña nueva debe tener al menos 12 caracteres y máximo 72 bytes.";
            return;
        }

        if (contrasenaNueva !== confirmarContrasena) {
            mensaje.textContent = "Las contraseñas nuevas no coinciden.";
            return;
        }

        try {
            const respuesta = await fetch("http://localhost:3000/api/auth/cambiar-contrasena", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    contrasenaActual,
                    contrasenaNueva
                })
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(resultado.mensaje);
            }

            mensaje.textContent = "Contraseña actualizada correctamente.";

            // Actualizar datos de sesión
            const usuario = JSON.parse(sessionStorage.getItem("usuario"));

            if (usuario) {
                usuario.debe_cambiar_contrasena = false;
                sessionStorage.setItem("usuario", JSON.stringify(usuario));
            }

            // Cerrar sesión para generar un token nuevo
            sessionStorage.removeItem("token");

            setTimeout(() => {
                window.location.href = "../../index.html";
            }, 1500);

        } catch (error) {
            mensaje.textContent = error.message;
        }

    });

});
