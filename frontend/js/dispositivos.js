document.addEventListener("DOMContentLoaded", () => {
    const { proteger, solicitar, mostrarMensaje, crearFila } = window.RegistroTI;
    const token = proteger(["Administrador", "Técnico"]);
    if (!token) return;
    const mensaje = document.getElementById("mensajeDispositivo");
    const panel = document.getElementById("formularioDispositivo");
    const formulario = document.getElementById("formDispositivo");
    const tabla = document.getElementById("tablaDispositivos");
    const guardar = document.getElementById("btnGuardar");

    async function cargar() {
        try {
            const { datos } = await solicitar("/dispositivos", token);
            tabla.replaceChildren();
            if (!datos.length) {
                tabla.appendChild(crearFila(["No hay dispositivos registrados."]));
                tabla.lastChild.firstChild.colSpan = 6;
                return;
            }
            datos.forEach(d => tabla.appendChild(crearFila([
                d.codigo_inventario, d.nombre, d.tipo, `${d.marca} / ${d.modelo}`,
                d.numero_serie, d.estado
            ], 5)));
        } catch (error) {
            tabla.replaceChildren(crearFila(["No se pudieron cargar los dispositivos."]));
            tabla.firstChild.firstChild.colSpan = 6;
            mostrarMensaje(mensaje, error.message, false);
        }
    }
    document.getElementById("btnRegistrar").addEventListener("click", () => {
        panel.hidden = false;
        mensaje.hidden = true;
        panel.scrollIntoView({ behavior: "smooth" });
        document.getElementById("codigoInventario").focus();
    });
    document.getElementById("btnCancelar").addEventListener("click", () => {
        formulario.reset(); panel.hidden = true;
    });
    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        guardar.disabled = true;
        mensaje.hidden = true;
        const campo = id => document.getElementById(id).value.trim();
        const datos = { codigoInventario: campo("codigoInventario"), nombre: campo("nombre"),
            tipo: campo("tipo"), marca: campo("marca"), modelo: campo("modelo"),
            numeroSerie: campo("numeroSerie"), fechaAdquisicion: campo("fechaAdquisicion"),
            estado: campo("estado"), descripcion: campo("descripcion"),
            observaciones: campo("observaciones") };
        try {
            const resultado = await solicitar("/dispositivos", token,
                { method: "POST", body: JSON.stringify(datos) });
            mostrarMensaje(mensaje, resultado.mensaje);
            formulario.reset();
            panel.hidden = true;
            await cargar();
            mensaje.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch (error) {
            mostrarMensaje(mensaje, error.message, false);
            mensaje.scrollIntoView({ behavior: "smooth", block: "center" });
        } finally { guardar.disabled = false; }
    });
    cargar();
});
