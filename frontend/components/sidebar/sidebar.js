
document.addEventListener("DOMContentLoaded", async () => {

    // Obtener los datos de la sesión
    const datosUsuario = sessionStorage.getItem("usuario");
    const token = sessionStorage.getItem("token");

    // Verificar si existe una sesión
    if (!datosUsuario || !token) {
        window.location.href = "../index.html";
        return;
    }

    const usuario = JSON.parse(datosUsuario);

    try {

        // Cargar el menú lateral
        const respuesta = await fetch("../components/sidebar/sidebar.html");

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar el menú lateral.");
        }

        const contenidoSidebar = await respuesta.text();

        document.getElementById("contenedorSidebar").innerHTML =
            contenidoSidebar;
        // Configurar menú adaptable
        const sidebar = document.querySelector(".sidebar");
        const btnMenu = document.getElementById("btnMenu");
        const overlay = document.getElementById("sidebarOverlay");

        // Abrir y cerrar menú
        btnMenu.addEventListener("click", () => {
        sidebar.classList.toggle("abierto");
        overlay.classList.toggle("activo");
    });

// Cerrar al pulsar fuera del menú
overlay.addEventListener("click", cerrarMenu);

// Cerrar al seleccionar una opción
sidebar.querySelectorAll(".menu-item").forEach(opcion => {
    opcion.addEventListener("click", cerrarMenu);
});

function cerrarMenu() {
    sidebar.classList.remove("abierto");
    overlay.classList.remove("activo");
}

        // Obtener las opciones del menú
        const opcionesMenu = document.querySelectorAll("[data-roles]");

        opcionesMenu.forEach(opcion => {

            const rolesPermitidos = opcion.dataset.roles.split(",");

            const tienePermiso = rolesPermitidos.some(rol =>
                usuario.roles.includes(rol)
            );

            opcion.style.display = tienePermiso ? "block" : "none";
        });

        // Marcar la página actual
        const paginaActual = window.location.pathname.split("/").pop();

        opcionesMenu.forEach(opcion => {

            const paginaEnlace = opcion.getAttribute("href");

            if (paginaEnlace === paginaActual) {
                opcion.classList.add("active");
            }
        });

        // Configurar cierre de sesión
        const btnCerrarSesion =
            document.getElementById("btnCerrarSesion");

        if (btnCerrarSesion) {
            btnCerrarSesion.addEventListener("click", () => {
                sessionStorage.clear();
                window.location.href = "../index.html";
            });
        }

    } catch (error) {
        console.error("Error al cargar el menú:", error);
    }

});
