// Helpers reutilizables para los registros HU-12 y HU-17.
window.RegistroTI = (() => {
    const apiBase = "http://localhost:3000/api";
    function proteger(rolesPermitidos) {
        let usuario;
        try { usuario = JSON.parse(sessionStorage.getItem("usuario") || "null"); }
        catch (_) { usuario = null; }
        const token = sessionStorage.getItem("token");
        if (!usuario || !token) {
            window.location.replace("../index.html");
            return null;
        }
        if (!Array.isArray(usuario.roles) || !rolesPermitidos.some(rol => usuario.roles.includes(rol))) {
            window.alert("No tienes permiso para entrar en este módulo.");
            window.location.replace("inicio.html");
            return null;
        }
        if (usuario.debe_cambiar_contrasena) {
            window.location.replace("auth/cambiar-contrasena.html");
            return null;
        }
        return token;
    }
    async function solicitar(ruta, token, opciones = {}) {
        let respuesta;
        try {
            respuesta = await fetch(`${apiBase}${ruta}`, {
                ...opciones,
                headers: { "Authorization": `Bearer ${token}`,
                    ...(opciones.body ? { "Content-Type": "application/json" } : {}),
                    ...(opciones.headers || {}) }
            });
        } catch (_) {
            throw new Error("No hay conexión con el backend (http://localhost:3000).");
        }
        const resultado = await respuesta.json().catch(() => ({}));
        if (respuesta.status === 401) {
            sessionStorage.clear();
            window.location.replace("../index.html");
        }
        if (!respuesta.ok) throw new Error(resultado.mensaje || `Error HTTP ${respuesta.status}.`);
        return resultado;
    }
    function mostrarMensaje(elemento, texto, exito = true) {
        elemento.hidden = false;
        elemento.textContent = texto;
        elemento.classList.toggle("mensaje-exito", exito);
        elemento.classList.toggle("mensaje-error", !exito);
    }
    function crearFila(valores, claseEstadoIndex = -1) {
        const fila = document.createElement("tr");
        valores.forEach((dato, index) => {
            const celda = document.createElement("td");
            if (index === claseEstadoIndex) {
                const insignia = document.createElement("span");
                insignia.className = dato === "Disponible" || dato === "Activo"
                    ? "estado-tag estado-ok" : "estado-tag estado-pendiente";
                insignia.textContent = dato || "—";
                celda.appendChild(insignia);
            } else celda.textContent = dato || "—";
            fila.appendChild(celda);
        });
        return fila;
    }
    return { proteger, solicitar, mostrarMensaje, crearFila };
})();
