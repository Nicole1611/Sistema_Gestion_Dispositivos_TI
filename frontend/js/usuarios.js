
document.addEventListener("DOMContentLoaded", () => {

    // Elementos del HTML
    const btnRegistrar = document.getElementById("btnRegistrar");
    const btnCancelar = document.getElementById("btnCancelar");
    const formularioUsuario = document.getElementById("formularioUsuario");
    const formUsuario = document.getElementById("formUsuario");
    const tablaUsuarios = document.getElementById("tablaUsuarios");

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

            tablaUsuarios.innerHTML = "";

            if (resultado.datos.length === 0) {
                tablaUsuarios.innerHTML = `
                    <tr>
                        <td colspan="7">No hay usuarios registrados.</td>
                    </tr>
                `;
                return;
            }

            resultado.datos.forEach(usuario => {
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

    // Cargar tabla al entrar
    cargarUsuarios();

});
