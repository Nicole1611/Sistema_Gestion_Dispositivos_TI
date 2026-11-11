
document.addEventListener("DOMContentLoaded", () => {

    const btnRegistrar = document.getElementById("btnRegistrar");
    const btnCancelar = document.getElementById("btnCancelar");

    const formularioDispositivo = document.getElementById("formularioDispositivo");
    const formDispositivo = document.getElementById("formDispositivo");
    const tablaDispositivos = document.getElementById("tablaDispositivos");

    // Cargar tipos, marcas y estados desde SQL Server
    async function cargarCatalogos() {
        try {
            const token = sessionStorage.getItem("token");

            const respuesta = await fetch(
                "http://localhost:3000/api/dispositivos/catalogos",
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

            llenarSelect("id_tipo", resultado.datos.tipos, "id_tipo");
            llenarSelect("id_marca", resultado.datos.marcas, "id_marca");
            llenarSelect("id_estado", resultado.datos.estados, "id_estado");

        } catch (error) {
            console.error("Error al cargar catálogos:", error);
            alert(error.message);
        }
    }

    // Llenar listas desplegables
    function llenarSelect(id, datos, campoId) {
        const select = document.getElementById(id);

        datos.forEach(item => {
            const opcion = document.createElement("option");
            opcion.value = item[campoId];
            opcion.textContent = item.nombre;
            select.appendChild(opcion);
        });
    }

    // Consultar dispositivos
    async function cargarDispositivos() {
        try {
            const token = sessionStorage.getItem("token");

            const respuesta = await fetch(
                "http://localhost:3000/api/dispositivos",
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

            tablaDispositivos.innerHTML = "";

            if (resultado.datos.length === 0) {
                tablaDispositivos.innerHTML = `
                    <tr>
                        <td colspan="7">No hay dispositivos registrados.</td>
                    </tr>
                `;
                return;
            }

            resultado.datos.forEach(dispositivo => {
                const fila = document.createElement("tr");

                const datos = [
                    dispositivo.codigo,
                    dispositivo.nombre,
                    dispositivo.tipo,
                    dispositivo.marca,
                    dispositivo.modelo || "—",
                    dispositivo.estado,
                    "—"
                ];

                datos.forEach(dato => {
                    const celda = document.createElement("td");
                    celda.textContent = dato;
                    fila.appendChild(celda);
                });

                tablaDispositivos.appendChild(fila);
            });

        } catch (error) {
            console.error("Error al cargar dispositivos:", error);

            tablaDispositivos.innerHTML = `
                <tr>
                    <td colspan="7">No se pudieron cargar los dispositivos.</td>
                </tr>
            `;
        }
    }

    // Mostrar formulario
    btnRegistrar.addEventListener("click", () => {
        formularioDispositivo.hidden = false;

        formularioDispositivo.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        document.getElementById("codigo").focus();
    });

    // Cancelar registro
    btnCancelar.addEventListener("click", () => {
        formularioDispositivo.hidden = true;
        formDispositivo.reset();
    });

    // Registrar dispositivo
    formDispositivo.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        try {
            const token = sessionStorage.getItem("token");

            const datosDispositivo = {
                codigo: document.getElementById("codigo").value.trim(),
                nombre: document.getElementById("nombre").value.trim(),
                id_tipo: document.getElementById("id_tipo").value,
                id_marca: document.getElementById("id_marca").value,
                modelo: document.getElementById("modelo").value.trim(),
                numero_serie: document.getElementById("numero_serie").value.trim(),
                id_estado: document.getElementById("id_estado").value,
                descripcion: document.getElementById("descripcion").value.trim()
            };

            const respuesta = await fetch(
                "http://localhost:3000/api/dispositivos",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(datosDispositivo)
                }
            );

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(resultado.mensaje);
            }

            alert(resultado.mensaje);

            formDispositivo.reset();
            formularioDispositivo.hidden = true;

            await cargarDispositivos();

        } catch (error) {
            console.error("Error al registrar dispositivo:", error);
            alert(error.message);
        }
    });

    // Cargar información inicial
    cargarCatalogos();
    cargarDispositivos();

});
