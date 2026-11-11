
document.addEventListener("DOMContentLoaded", () => {

    const btnRegistrar = document.getElementById("btnRegistrar");
    const btnCancelar = document.getElementById("btnCancelar");

    const formularioDispositivo = document.getElementById("formularioDispositivo");
    const formDispositivo = document.getElementById("formDispositivo");
    const tablaDispositivos = document.getElementById("tablaDispositivos");
    const detalleDispositivo = document.getElementById("detalleDispositivo");
    const btnCerrarDetalle = document.getElementById("btnCerrarDetalle");

    const tituloFormulario = document.getElementById("tituloFormulario");
    const descripcionFormulario = document.getElementById("descripcionFormulario");
    const grupoEstado = document.getElementById("grupoEstado");
    const btnGuardarDispositivo = document.getElementById("btnGuardarDispositivo");
    const buscarDispositivo = document.getElementById("buscarDispositivo");
    const filtroTipo = document.getElementById("filtroTipo");
    const filtroEstado = document.getElementById("filtroEstado");
    const contadorDispositivos = document.getElementById("contadorDispositivos");

    let dispositivosCargados = [];
    let dispositivoEnEdicion = null;

    // Obtener el token de sesión
    function obtenerToken() {
        return sessionStorage.getItem("token");
    }

    // Cargar catálogos desde el backend
    async function cargarCatalogos() {
        try {
            const respuesta = await fetch(
                "http://localhost:3000/api/dispositivos/catalogos",
                {
                    headers: {
                        "Authorization": `Bearer ${obtenerToken()}`
                    }
                }
            );

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(resultado.mensaje);
            }

            llenarSelect("id_tipo", resultado.datos.tipos);
            llenarSelect("id_marca", resultado.datos.marcas);
            llenarSelect("id_estado", resultado.datos.estados);

            llenarSelect("filtroTipo", resultado.datos.tipos);
            llenarSelect("filtroEstado", resultado.datos.estados);

        } catch (error) {
            console.error("Error al cargar catálogos:", error);
            alert(error.message);
        }
    }

    // Llenar listas desplegables
    function llenarSelect(id, datos) {
        const select = document.getElementById(id);

        datos.forEach(item => {
            const opcion = document.createElement("option");

            opcion.value = item.id_tipo ??
                           item.id_marca ??
                           item.id_estado;

            opcion.textContent = item.nombre;

            select.appendChild(opcion);
        });
    }

    // Consultar dispositivos
    async function cargarDispositivos() {
        try {
            const respuesta = await fetch(
                "http://localhost:3000/api/dispositivos",
                {
                    headers: {
                        "Authorization": `Bearer ${obtenerToken()}`
                    }
                }
            );

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(resultado.mensaje);
            }

            dispositivosCargados = resultado.datos;

            mostrarDispositivos();

        } catch (error) {
            console.error("Error al cargar dispositivos:", error);

            tablaDispositivos.innerHTML = `
                <tr>
                    <td colspan="7">
                        No se pudieron cargar los dispositivos.
                    </td>
                </tr>
            `;

            contadorDispositivos.textContent = "0 dispositivos";
        }
    }

    // Mostrar dispositivos aplicando búsqueda y filtros
    function mostrarDispositivos() {

        const texto = buscarDispositivo.value.toLowerCase().trim();
        const tipoSeleccionado = filtroTipo.value;
        const estadoSeleccionado = filtroEstado.value;

        const dispositivosFiltrados = dispositivosCargados.filter(dispositivo => {

            const coincideBusqueda =
                String(dispositivo.codigo).toLowerCase().includes(texto) ||
                String(dispositivo.nombre).toLowerCase().includes(texto);

            const coincideTipo =
                tipoSeleccionado === "Todos" ||
                String(dispositivo.id_tipo) === tipoSeleccionado;

            const coincideEstado =
                estadoSeleccionado === "Todos" ||
                String(dispositivo.id_estado) === estadoSeleccionado;

            return coincideBusqueda && coincideTipo && coincideEstado;
        });

        tablaDispositivos.innerHTML = "";

        contadorDispositivos.textContent =
            `${dispositivosFiltrados.length} dispositivos`;

        if (dispositivosFiltrados.length === 0) {
            tablaDispositivos.innerHTML = `
                <tr>
                    <td colspan="7">
                        No se encontraron dispositivos en el inventario
                    </td>
                </tr>
            `;
            return;
        }

        dispositivosFiltrados.forEach(dispositivo => {

            const fila = document.createElement("tr");

            
const datos = [
    dispositivo.codigo,
    dispositivo.nombre,
    dispositivo.tipo,
    dispositivo.marca,
    dispositivo.modelo || "—",
    dispositivo.estado
];

datos.forEach(dato => {
    const celda = document.createElement("td");
    celda.textContent = dato;
    fila.appendChild(celda);
});

// Columna de acciones
const celdaAcciones = document.createElement("td");
celdaAcciones.classList.add("acciones-dispositivo");
const btnDetalle = document.createElement("button");
btnDetalle.type = "button";
btnDetalle.textContent = "Ver detalle";
btnDetalle.classList.add("btn-secondary");

btnDetalle.addEventListener("click", () => {
    verDetalle(dispositivo);
});

celdaAcciones.appendChild(btnDetalle);

// Botón para editar
const btnEditar = document.createElement("button");
btnEditar.type = "button";
btnEditar.textContent = "Editar";
btnEditar.classList.add("btn-primary");

btnEditar.addEventListener("click", () => {
    editarDispositivo(dispositivo);
});

celdaAcciones.appendChild(btnEditar);

fila.appendChild(celdaAcciones);
tablaDispositivos.appendChild(fila);

        });
    }


    // Mostrar la ficha completa de un dispositivo
    function verDetalle(dispositivo) {

        document.getElementById("detalleCodigo").textContent =
            dispositivo.codigo || "—";

        document.getElementById("detalleNombre").textContent =
            dispositivo.nombre || "—";

        document.getElementById("detalleTipo").textContent =
            dispositivo.tipo || "—";

        document.getElementById("detalleMarca").textContent =
            dispositivo.marca || "—";

        document.getElementById("detalleModelo").textContent =
            dispositivo.modelo || "—";

        document.getElementById("detalleSerie").textContent =
            dispositivo.numero_serie || "—";

        document.getElementById("detalleEstado").textContent =
            dispositivo.estado || "—";

        document.getElementById("detalleFecha").textContent =
            dispositivo.fecha_registro
                ? new Date(dispositivo.fecha_registro).toLocaleDateString("es-EC")
                : "—";

        document.getElementById("detalleDescripcion").textContent =
            dispositivo.descripcion || "Sin observaciones";

        detalleDispositivo.hidden = false;

        detalleDispositivo.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
// Preparar el formulario para registrar un dispositivo nuevo
function prepararFormularioRegistro() {
    dispositivoEnEdicion = null;

    formDispositivo.reset();

    tituloFormulario.textContent = "Registrar dispositivo";
    descripcionFormulario.textContent =
        "Ingresa los datos del nuevo dispositivo tecnológico.";

    btnGuardarDispositivo.textContent = "Guardar dispositivo";

    grupoEstado.hidden = false;
    document.getElementById("id_estado").required = true;
}

// Cargar los datos del dispositivo para editarlos
function editarDispositivo(dispositivo) {
    dispositivoEnEdicion = dispositivo.id_dispositivo;

    detalleDispositivo.hidden = true;
    formularioDispositivo.hidden = false;

    tituloFormulario.textContent = "Actualizar dispositivo";
    descripcionFormulario.textContent =
        "Modifica los datos del dispositivo seleccionado.";

    btnGuardarDispositivo.textContent = "Guardar cambios";

    document.getElementById("codigo").value = dispositivo.codigo || "";
    document.getElementById("nombre").value = dispositivo.nombre || "";
    document.getElementById("id_tipo").value = String(dispositivo.id_tipo);
    document.getElementById("id_marca").value = String(dispositivo.id_marca);
    document.getElementById("modelo").value = dispositivo.modelo || "";
    document.getElementById("numero_serie").value =
        dispositivo.numero_serie || "";
    document.getElementById("descripcion").value =
        dispositivo.descripcion || "";

    // El estado no se modifica desde este formulario
    grupoEstado.hidden = true;
    document.getElementById("id_estado").required = false;

    formularioDispositivo.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    document.getElementById("codigo").focus();
}

    // Mostrar formulario
    btnRegistrar.addEventListener("click", () => {
        prepararFormularioRegistro();
        formularioDispositivo.hidden = false;

        formularioDispositivo.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        document.getElementById("codigo").focus();
    });

    // Cancelar registro
    btnCancelar.addEventListener("click", () => {
        prepararFormularioRegistro();
        formularioDispositivo.hidden = true;
    });

    // Registrar dispositivo
    
formDispositivo.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    try {
        const datosDispositivo = {
            codigo: document.getElementById("codigo").value.trim(),
            nombre: document.getElementById("nombre").value.trim(),
            id_tipo: document.getElementById("id_tipo").value,
            id_marca: document.getElementById("id_marca").value,
            modelo: document.getElementById("modelo").value.trim(),
            numero_serie: document.getElementById("numero_serie").value.trim(),
            descripcion: document.getElementById("descripcion").value.trim()
        };

        let url = "http://localhost:3000/api/dispositivos";
        let metodo = "POST";

        if (dispositivoEnEdicion !== null) {
            // Actualizar dispositivo existente
            url += `/${dispositivoEnEdicion}`;
            metodo = "PUT";
        } else {
            // Registrar dispositivo nuevo
            datosDispositivo.id_estado =
                document.getElementById("id_estado").value;
        }

        const respuesta = await fetch(url, {
            method: metodo,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${obtenerToken()}`
            },
            body: JSON.stringify(datosDispositivo)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje);
        }

        alert(resultado.mensaje);

        prepararFormularioRegistro();
        formularioDispositivo.hidden = true;

        await cargarDispositivos();

    } catch (error) {
        console.error("Error al guardar dispositivo:", error);
        alert(error.message);
    }
});


// Cerrar ficha de detalle
btnCerrarDetalle.addEventListener("click", () => {
    detalleDispositivo.hidden = true;
});
    // Eventos de búsqueda y filtros
    buscarDispositivo.addEventListener("input", mostrarDispositivos);
    filtroTipo.addEventListener("change", mostrarDispositivos);
    filtroEstado.addEventListener("change", mostrarDispositivos);

    // Cargar información inicial
    cargarCatalogos();
    cargarDispositivos();

});
