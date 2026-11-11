
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

        if (contrasenaNueva.length < 10 || contrasenaNueva.length > 64) {
            mensaje.textContent = "La contraseña debe tener entre 12 y 64 caracteres.";
            return;
        }

        if (contrasenaNueva !== confirmarContrasena) {
            mensaje.textContent = "Las contraseñas no coinciden.";
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
                    contrasenaNueva,
                    confirmarContrasena
                })
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(resultado.mensaje);
            }

            mensaje.textContent = "Contraseña actualizada correctamente.";

            // Guardar el nuevo token generado por el backend
            sessionStorage.setItem("token", resultado.token);

            // Actualizar los datos del usuario
            const usuario = JSON.parse(sessionStorage.getItem("usuario"));

            if (usuario) {
                usuario.debe_cambiar_contrasena = false;
                sessionStorage.setItem("usuario", JSON.stringify(usuario));
            }

            // Redirigir al inicio del sistema
            setTimeout(() => {
                window.location.href = "../inicio.html";
            }, 1500);

        } catch (error) {
            mensaje.textContent = error.message;
        }

    });

});
