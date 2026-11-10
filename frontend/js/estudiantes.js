document.addEventListener("DOMContentLoaded", () => {
    const { proteger, solicitar, mostrarMensaje, crearFila } = window.RegistroTI;
    const token = proteger(["Administrador"]);
    if (!token) return;
    const mensaje = document.getElementById("mensajeEstudiante");
    const panel = document.getElementById("formularioEstudiante");
    const formulario = document.getElementById("formEstudiante");
    const tabla = document.getElementById("tablaEstudiantes");
    const accesoTemporal = document.getElementById("accesoTemporal");
    const guardar = document.getElementById("btnGuardar");

    async function cargar() {
        try {
            const { datos } = await solicitar("/estudiantes", token);
            tabla.replaceChildren();
            if (!datos.length) {
                tabla.appendChild(crearFila(["No hay estudiantes registrados."]));
                tabla.lastChild.firstChild.colSpan = 5;
                return;
            }
            datos.forEach(e => tabla.appendChild(crearFila([
                e.matricula, e.cedula, `${e.nombres} ${e.apellidos}`,
                e.correo_institucional, e.estado
            ], 4)));
        } catch (error) {
            tabla.replaceChildren(crearFila(["No se pudieron cargar los estudiantes."]));
            tabla.firstChild.firstChild.colSpan = 5;
            mostrarMensaje(mensaje, error.message, false);
        }
    }
    document.getElementById("btnRegistrar").addEventListener("click", () => {
        panel.hidden = false;
        accesoTemporal.hidden = true;
        mensaje.hidden = true;
        panel.scrollIntoView({ behavior: "smooth" });
        document.getElementById("nombres").focus();
    });
    document.getElementById("btnCancelar").addEventListener("click", () => {
        formulario.reset(); panel.hidden = true;
    });
    document.getElementById("copiarContrasena").addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(document.getElementById("contrasenaTemporal").textContent);
            mostrarMensaje(mensaje, "Contraseña temporal copiada. Entrégala de forma privada.");
        } catch (_) {
            mostrarMensaje(mensaje, "No se pudo copiar automáticamente; selecciona el texto para copiarlo.", false);
        }
    });
    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        guardar.disabled = true;
        accesoTemporal.hidden = true;
        mensaje.hidden = true;
        const campo = id => document.getElementById(id).value.trim();
        const datos = { nombres: campo("nombres"), apellidos: campo("apellidos"),
            cedula: campo("cedula"), correo: campo("correo"), matricula: campo("matricula") };
        try {
            const resultado = await solicitar("/estudiantes", token,
                { method: "POST", body: JSON.stringify(datos) });
            mostrarMensaje(mensaje, resultado.mensaje);
            document.getElementById("contrasenaTemporal").textContent = resultado.contrasenaTemporal;
            accesoTemporal.hidden = false;
            formulario.reset();
            panel.hidden = true;
            await cargar();
            mensaje.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch (error) {
            mostrarMensaje(mensaje, error.message, false);
            mensaje.scrollIntoView({ behavior: "smooth", block: "center" });
        } finally {
            guardar.disabled = false;
        }
    });
    cargar();
});
