
document.addEventListener("DOMContentLoaded", () => {

    const btnRegistrar = document.getElementById("btnRegistrar");
    const btnCancelar = document.getElementById("btnCancelar");

    const formularioDocente = document.getElementById("formularioDocente");
    const formDocente = document.getElementById("formDocente");
    const tablaDocentes = document.getElementById("tablaDocentes");

    // Obtener docentes desde el backend
    async function cargarDocentes() {
        try {
            const token = sessionStorage.getItem("token");

            const respuesta = await fetch("http://localhost:3000/api/docentes", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(resultado.mensaje);
            }

            tablaDocentes.innerHTML = "";

            if (resultado.datos.length === 0) {
                tablaDocentes.innerHTML = `
                    <tr>
                        <td colspan="7">
                            No hay docentes registrados.
                        </td>
                    </tr>
                `;
                return;
            }

            resultado.datos.forEach(docente => {

                const fila = document.createElement("tr");

                const datos = [
                    docente.codigo_docente,
                    docente.cedula,
                    `${docente.nombres} ${docente.apellidos}`,
                    docente.correo_institucional,
                    docente.telefono,
                    docente.estado,
                    "—"
                ];

                datos.forEach(dato => {
                    const celda = document.createElement("td");
                    celda.textContent = dato ?? "";
                    fila.appendChild(celda);
                });

                tablaDocentes.appendChild(fila);
            });

        } catch (error) {
            console.error("Error al cargar docentes:", error);

            tablaDocentes.innerHTML = `
                <tr>
                    <td colspan="7">
                        No se pudieron cargar los docentes.
                    </td>
                </tr>
            `;
        }
    }

    // Mostrar formulario
    btnRegistrar.addEventListener("click", () => {
        formularioDocente.hidden = false;

        formularioDocente.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        document.getElementById("cedula").focus();
    });

    // Cancelar y limpiar formulario
    btnCancelar.addEventListener("click", () => {
        formularioDocente.hidden = true;
        formDocente.reset();
    });

    // Registrar docente
    formDocente.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const token = sessionStorage.getItem("token");

        const datosDocente = {
            cedula: document.getElementById("cedula").value.trim(),
            codigoDocente: document.getElementById("codigoDocente").value.trim(),
            nombres: document.getElementById("nombres").value.trim(),
            apellidos: document.getElementById("apellidos").value.trim(),
            correo: document.getElementById("correo").value.trim(),
            telefono: document.getElementById("telefono").value.trim()
        };

        try {
            const respuesta = await fetch("http://localhost:3000/api/docentes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(datosDocente)
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(resultado.mensaje);
            }

            // Limpiar y ocultar formulario
            formDocente.reset();
            formularioDocente.hidden = true;

            // Actualizar tabla
            await cargarDocentes();

            // Mostrar contraseña temporal al administrador
            alert(
                resultado.mensaje +
                "\n\nContraseña temporal del docente: " +
                resultado.contrasenaTemporal +
                "\n\nEntrégala al docente para que pueda iniciar sesión y cambiarla."
            );

        } catch (error) {
            console.error("Error al registrar docente:", error);
            alert(error.message);
        }
    });

    // Cargar docentes al entrar en la página
    cargarDocentes();

});
