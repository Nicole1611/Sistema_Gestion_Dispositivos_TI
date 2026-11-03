
document.addEventListener("DOMContentLoaded", () => {

    // Obtener los datos del usuario
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

    // Mostrar opciones según el rol
    const opcionesMenu = document.querySelectorAll("[data-roles]");

    opcionesMenu.forEach(opcion => {

        const rolesPermitidos = opcion.dataset.roles.split(",");

        const tienePermiso = rolesPermitidos.some(rol =>
            usuario.roles.includes(rol)
        );

        opcion.style.display = tienePermiso ? "block" : "none";
    });

    // Cerrar sesión
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");

    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", () => {
            sessionStorage.clear();
            window.location.href = "../index.html";
        });
    }

});