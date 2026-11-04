
document.addEventListener("DOMContentLoaded", () => {

    // Obtener los datos de la sesión
    const datosUsuario = sessionStorage.getItem("usuario");
    const token = sessionStorage.getItem("token");

    if (!datosUsuario || !token) {
        window.location.href = "../index.html";
        return;
    }

    const usuario = JSON.parse(datosUsuario);

    // Mostrar nombre y apellido
    const nombreUsuario = document.getElementById("nombreUsuario");

    if (nombreUsuario) {
        nombreUsuario.textContent =
            `${usuario.nombres} ${usuario.apellidos}`;
    }

    // Mostrar rol
    const rolUsuario = document.getElementById("rolUsuario");

    if (rolUsuario) {
        rolUsuario.textContent = usuario.roles.join(", ");
    }

    // Consultar estadísticas del sistema
    async function cargarEstadisticas() {
        try {
            const respuesta = await fetch(
                "http://localhost:3000/api/dashboard/estadisticas",
                {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(resultado.mensaje);
            }

            // Mostrar total de usuarios
            document.getElementById("totalUsuarios").textContent =
                resultado.datos.totalUsuarios;

            // Mostrar total de dispositivos
            document.getElementById("totalDispositivos").textContent =
                resultado.datos.totalDispositivos;

        } catch (error) {
            console.error("Error al cargar estadísticas:", error);
        }
    }

    cargarEstadisticas();

});
