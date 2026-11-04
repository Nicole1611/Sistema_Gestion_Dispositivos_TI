
document.addEventListener("DOMContentLoaded", () => {

    // Obtener los datos de la sesión
    const datosUsuario = sessionStorage.getItem("usuario");
    const token = sessionStorage.getItem("token");

    if (!datosUsuario || !token) {
        window.location.href = "../index.html";
        return;
    }

    const usuario = JSON.parse(datosUsuario);
    const roles = usuario.roles || [];

    // Elementos del HTML
    const nombreUsuario = document.getElementById("nombreUsuario");
    const rolUsuario = document.getElementById("rolUsuario");
    const dashboardCards = document.getElementById("dashboardCards");

    // Mostrar nombre y rol
    nombreUsuario.textContent = `${usuario.nombres} ${usuario.apellidos}`;
    rolUsuario.textContent = roles.join(", ");

    // Configuración de los paneles por rol
    const paneles = {

        Administrador: {
            titulo: "Bienvenido al panel de administración",
            descripcion: "Administra los dispositivos tecnológicos y usuarios de la carrera.",
            informacion: "Desde este panel puedes supervisar los usuarios, dispositivos, solicitudes y asignaciones del sistema.",
            tarjetas: [
                {
                    titulo: "Dispositivos",
                    id: "totalDispositivos",
                    valor: "—",
                    descripcion: "Total registrados"
                },
                {
                    titulo: "Usuarios",
                    id: "totalUsuarios",
                    valor: "—",
                    descripcion: "Usuarios registrados"
                },
                {
                    titulo: "Solicitudes",
                    valor: "—",
                    descripcion: "Solicitudes pendientes"
                },
                {
                    titulo: "Asignaciones",
                    valor: "—",
                    descripcion: "Asignaciones realizadas"
                }
            ]
        },

        Técnico: {
            titulo: "Bienvenido al panel técnico",
            descripcion: "Gestiona y supervisa los dispositivos tecnológicos.",
            informacion: "Desde este panel puedes consultar los dispositivos, controlar su disponibilidad y realizar el seguimiento de mantenimientos.",
            tarjetas: [
                {
                    titulo: "Dispositivos",
                    valor: "—",
                    descripcion: "Total registrados"
                },
                {
                    titulo: "Mantenimientos",
                    valor: "—",
                    descripcion: "Pendientes"
                },
                {
                    titulo: "Dispositivos dañados",
                    valor: "—",
                    descripcion: "Reportados"
                },
                {
                    titulo: "Disponibles",
                    valor: "—",
                    descripcion: "Para asignación"
                }
            ]
        },

        Docente: {
            titulo: "Bienvenido al panel docente",
            descripcion: "Consulta tus dispositivos tecnológicos y solicitudes.",
            informacion: "Desde este panel puedes consultar los dispositivos que tienes asignados, revisar tus solicitudes y acceder a tu historial.",
            tarjetas: [
                {
                    titulo: "Mis dispositivos",
                    valor: "—",
                    descripcion: "Dispositivos asignados"
                },
                {
                    titulo: "Mis solicitudes",
                    valor: "—",
                    descripcion: "Solicitudes pendientes"
                },
                {
                    titulo: "Historial",
                    valor: "—",
                    descripcion: "Asignaciones anteriores"
                }
            ]
        },

        Estudiante: {
            titulo: "Bienvenido al panel estudiantil",
            descripcion: "Consulta y realiza solicitudes de dispositivos tecnológicos.",
            informacion: "Desde este panel puedes realizar solicitudes de dispositivos y consultar el estado de tus solicitudes.",
            tarjetas: [
                {
                    titulo: "Mis solicitudes",
                    valor: "—",
                    descripcion: "Solicitudes realizadas"
                },
                {
                    titulo: "Pendientes",
                    valor: "—",
                    descripcion: "Por atender"
                },
                {
                    titulo: "Aprobadas",
                    valor: "—",
                    descripcion: "Solicitudes aprobadas"
                }
            ]
        }

    };

    // Identificar el panel correspondiente
    const rolActivo = roles[0];
    const panel = paneles[rolActivo];

    if (!panel) {
        dashboardCards.innerHTML = `
            <p>No se encontró un panel para el rol asignado.</p>
        `;
        return;
    }

    // Mostrar bienvenida e información
    document.getElementById("tituloBienvenida").textContent = panel.titulo;
    document.getElementById("descripcionBienvenida").textContent = panel.descripcion;
    document.getElementById("informacionSistema").textContent = panel.informacion;

    // Generar tarjetas
    dashboardCards.innerHTML = "";

    panel.tarjetas.forEach(tarjeta => {

        const article = document.createElement("article");
        article.classList.add("dashboard-card");

        const titulo = document.createElement("h3");
        titulo.textContent = tarjeta.titulo;

        const numero = document.createElement("p");
        numero.classList.add("card-number");
        numero.textContent = tarjeta.valor;

        if (tarjeta.id) {
            numero.id = tarjeta.id;
        }

        const descripcion = document.createElement("span");
        descripcion.textContent = tarjeta.descripcion;

        article.appendChild(titulo);
        article.appendChild(numero);
        article.appendChild(descripcion);

        dashboardCards.appendChild(article);
    });

    // Consultar estadísticas generales solo para el administrador
    async function cargarEstadisticas() {

        if (rolActivo !== "Administrador") {
            return;
        }

        try {
            const respuesta = await fetch(
                "http://localhost:3000/api/dashboard/estadisticas",
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

            document.getElementById("totalUsuarios").textContent =
                resultado.datos.totalUsuarios;

            document.getElementById("totalDispositivos").textContent =
                resultado.datos.totalDispositivos;

        } catch (error) {
            console.error("Error al cargar estadísticas:", error);
        }
    }

    // Cargar estadísticas
    cargarEstadisticas();

});
