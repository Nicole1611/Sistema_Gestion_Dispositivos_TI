
document.addEventListener("DOMContentLoaded", () => {

    // Elementos del HTML
const btnRegistrar = document.getElementById("btnRegistrar");
const btnCancelar = document.getElementById("btnCancelar");
const formularioUsuario = document.getElementById("formularioUsuario");
const formUsuario = document.getElementById("formUsuario");
const tablaUsuarios = document.getElementById("tablaUsuarios");
const buscarUsuario = document.getElementById("buscarUsuario");
const filtroRol = document.getElementById("filtroRol");
const contadorUsuarios = document.getElementById("contadorUsuarios");
const filtroEstado = document.getElementById("filtroEstado");

// Almacenar los usuarios consultados
let usuariosCargados = [];
    // Datos de sesión
const datosUsuario = sessionStorage.getItem("usuario");
const token = sessionStorage.getItem("token");

    if (!datosUsuario || !token) {
        window.location.href = "../index.html";
        return;
    }

    const usuario = JSON.parse(datosUsuario);

    // Verificar que sea Administrador
    if (!usuario.roles || !usuario.roles.includes("Administrador")) {
        alert("No tienes permiso para acceder a este módulo.");
        window.location.href = "inicio.html";
        return;
    }

// Mostrar usuarios aplicando búsqueda y filtro
function mostrarUsuarios() {

    const texto = buscarUsuario.value.toLowerCase().trim();
    const rolSeleccionado = filtroRol.value;
    const estadoSeleccionado = filtroEstado.value;

    const usuariosFiltrados = usuariosCargados.filter(usuario => {

        const nombreCompleto =
            `${usuario.nombres} ${usuario.apellidos}`.toLowerCase();

        const coincideBusqueda =
            usuario.cedula.toLowerCase().includes(texto) ||
            nombreCompleto.includes(texto) ||
            usuario.correo_institucional.toLowerCase().includes(texto);

        const coincideRol =
            rolSeleccionado === "Todos" ||
            usuario.rol === rolSeleccionado;

        const coincideEstado =
            estadoSeleccionado === "Todos" ||
            usuario.estado === estadoSeleccionado;

        return coincideBusqueda && coincideRol && coincideEstado;
    });

    contadorUsuarios.textContent =
        `${usuariosFiltrados.length} ${
            usuariosFiltrados.length === 1
                ? "usuario encontrado"
                : "usuarios encontrados"
        }`;

    tablaUsuarios.innerHTML = "";

    if (usuariosFiltrados.length === 0) {
        tablaUsuarios.innerHTML = `
            <tr>
                <td colspan="7">No se encontraron usuarios.</td>
            </tr>
        `;
        return;
    }

    usuariosFiltrados.forEach(usuario => {

        const fila = document.createElement("tr");

        const valores = [
            usuario.cedula,
            `${usuario.nombres} ${usuario.apellidos}`,
            usuario.correo_institucional,
            usuario.telefono || "—",
            usuario.rol,
            usuario.estado
        ];

        valores.forEach(valor => {
            const celda = document.createElement("td");
            celda.textContent = valor;
            fila.appendChild(celda);
        });

        const acciones = document.createElement("td");
        acciones.textContent = "—";
        fila.appendChild(acciones);

        tablaUsuarios.appendChild(fila);
    });
}

    // Cargar usuarios desde el backend
    async function cargarUsuarios() {
        try {
            const respuesta = await fetch("http://localhost:3000/api/usuarios", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(resultado.mensaje);
            }

            usuariosCargados = resultado.datos;
            mostrarUsuarios();

        } catch (error) {
            console.error("Error al cargar usuarios:", error);

            tablaUsuarios.innerHTML = `
                <tr>
                    <td colspan="7">Error al cargar los usuarios.</td>
                </tr>
            `;
        }
    }

    // Mostrar formulario
    btnRegistrar.addEventListener("click", () => {
        formularioUsuario.hidden = false;
        formUsuario.reset();

        formularioUsuario.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        document.getElementById("cedula").focus();
    });

    // Cancelar registro
    btnCancelar.addEventListener("click", () => {
        formUsuario.reset();
        formularioUsuario.hidden = true;
    });

    // Registrar usuario
    formUsuario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const datos = {
            cedula: document.getElementById("cedula").value.trim(),
            nombres: document.getElementById("nombres").value.trim(),
            apellidos: document.getElementById("apellidos").value.trim(),
            correo: document.getElementById("correo").value.trim(),
            telefono: document.getElementById("telefono").value.trim(),
            rol: document.getElementById("rol").value
        };

        try {
            const respuesta = await fetch("http://localhost:3000/api/usuarios", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(datos)
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(resultado.mensaje);
            }

            alert(
                `${resultado.mensaje}\n\n` +
                `Contraseña temporal: ${resultado.contrasenaTemporal}\n\n` +
                `Entrega esta contraseña al usuario. Deberá cambiarla al iniciar sesión.`
            );

            formUsuario.reset();
            formularioUsuario.hidden = true;

            await cargarUsuarios();

        } catch (error) {
            console.error("Error al registrar usuario:", error);
            alert(error.message);
        }
    });

    // Buscar mientras se escribe
buscarUsuario.addEventListener("input", mostrarUsuarios);
filtroEstado.addEventListener("change", mostrarUsuarios);
// Filtrar por rol
filtroRol.addEventListener("change", mostrarUsuarios);

    // Cargar tabla al entrar
    cargarUsuarios();

});
