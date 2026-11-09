
// ==========================================
// CAMBIO ENTRE LAS TRES PESTAÑAS
// ==========================================

const btnUsuarios = document.getElementById('btnUsuarios');
const btnDocentes = document.getElementById('btnDocentes');
const btnConsultarDocentes = document.getElementById('btnConsultarDocentes');

const seccionUsuarios = document.getElementById('seccionUsuarios');
const seccionDocentes = document.getElementById('seccionDocentes');
const seccionConsultarDocentes = document.getElementById('seccionConsultarDocentes');

const botonesPestanas = [
    btnUsuarios,
    btnDocentes,
    btnConsultarDocentes
];

const secciones = [
    seccionUsuarios,
    seccionDocentes,
    seccionConsultarDocentes
];

// Función para cambiar de pestaña
function cambiarPestana(botonActivo, seccionActiva) {

    botonesPestanas.forEach(boton => {
        boton.classList.remove('activa');
    });

    secciones.forEach(seccion => {
        seccion.classList.add('oculto');
    });

    botonActivo.classList.add('activa');
    seccionActiva.classList.remove('oculto');
}

btnUsuarios.addEventListener('click', () => {
    cambiarPestana(btnUsuarios, seccionUsuarios);
});

btnDocentes.addEventListener('click', () => {
    cambiarPestana(btnDocentes, seccionDocentes);
});

btnConsultarDocentes.addEventListener('click', () => {
    cambiarPestana(btnConsultarDocentes, seccionConsultarDocentes);
    consultarDocentes();
});


// ==========================================
// REGISTRAR CUENTA DEL PERSONAL - HU-02
// ==========================================

const formUsuario = document.getElementById('formUsuario');

formUsuario.addEventListener('submit', async (evento) => {

    evento.preventDefault();

    const boton = formUsuario.querySelector('button[type="submit"]');
    const mensaje = document.getElementById('mensajeUsuario');

    const datosUsuario = {
        Nombres: document.getElementById('nombresUsuario').value.trim(),
        Apellidos: document.getElementById('apellidosUsuario').value.trim(),
        Cedula: document.getElementById('cedulaUsuario').value.trim(),
        Telefono: document.getElementById('telefonoUsuario').value.trim(),
        CorreoInstitucional: document.getElementById('correoUsuario').value.trim(),
        Contrasena: document.getElementById('contrasenaUsuario').value,
        IdRol: Number(document.getElementById('rolUsuario').value)
    };

    mensaje.textContent = '';
    mensaje.className = 'mensaje';

    boton.disabled = true;
    boton.textContent = 'Registrando...';

    try {

        const respuesta = await fetch('/api/usuarios/registrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosUsuario)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || 'No se pudo registrar la cuenta');
        }

        mensaje.textContent = resultado.mensaje;
        mensaje.className = 'mensaje mensaje-exito';

        formUsuario.reset();

    } catch (error) {

        mensaje.textContent = error.message;
        mensaje.className = 'mensaje mensaje-error';

    } finally {

        boton.disabled = false;
        boton.textContent = 'Registrar cuenta';
    }
});


// ==========================================
// REGISTRAR DOCENTE - HU-08
// ==========================================

const formDocente = document.getElementById('formDocente');

formDocente.addEventListener('submit', async (evento) => {

    evento.preventDefault();

    const boton = formDocente.querySelector('button[type="submit"]');
    const mensaje = document.getElementById('mensajeDocente');

    const datosDocente = {
        Nombres: document.getElementById('nombresDocente').value.trim(),
        Apellidos: document.getElementById('apellidosDocente').value.trim(),
        Cedula: document.getElementById('cedulaDocente').value.trim(),
        Telefono: document.getElementById('telefonoDocente').value.trim(),
        CorreoInstitucional: document.getElementById('correoDocente').value.trim(),
        Contrasena: document.getElementById('contrasenaDocente').value
    };

    mensaje.textContent = '';
    mensaje.className = 'mensaje';

    boton.disabled = true;
    boton.textContent = 'Registrando...';

    try {

        const respuesta = await fetch('/api/docentes/registrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosDocente)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || 'No se pudo registrar el docente');
        }

        mensaje.textContent = resultado.mensaje;
        mensaje.className = 'mensaje mensaje-exito';

        formDocente.reset();

    } catch (error) {

        mensaje.textContent = error.message;
        mensaje.className = 'mensaje mensaje-error';

    } finally {

        boton.disabled = false;
        boton.textContent = 'Registrar docente';
    }
});


// ==========================================
// CONSULTAR DOCENTES - HU-09
// ==========================================

const tablaDocentes = document.getElementById('tablaDocentes');
const buscarDocente = document.getElementById('buscarDocente');
const mensajeConsulta = document.getElementById('mensajeConsultaDocentes');

// Almacenar los docentes consultados
let listaDocentes = [];


// ==========================================
// OBTENER DOCENTES DESDE SQL SERVER
// ==========================================

async function consultarDocentes() {

    tablaDocentes.innerHTML = `
        <tr>
            <td colspan="6">Cargando docentes...</td>
        </tr>
    `;

    mensajeConsulta.textContent = '';
    mensajeConsulta.className = 'mensaje';

    try {

        const respuesta = await fetch('/api/docentes/consultar');

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || 'No se pudieron consultar los docentes');
        }

        listaDocentes = resultado.datos || [];

        mostrarDocentes(listaDocentes);

    } catch (error) {

        tablaDocentes.innerHTML = `
            <tr>
                <td colspan="6">No se pudieron cargar los docentes.</td>
            </tr>
        `;

        mensajeConsulta.textContent = error.message;
        mensajeConsulta.className = 'mensaje mensaje-error';
    }
}


// ==========================================
// MOSTRAR DOCENTES EN LA TABLA
// ==========================================

function mostrarDocentes(docentes) {

    tablaDocentes.innerHTML = '';

    if (docentes.length === 0) {

        const fila = document.createElement('tr');
        const celda = document.createElement('td');

        celda.colSpan = 6;
        celda.textContent = 'No hay docentes registrados.';

        fila.appendChild(celda);
        tablaDocentes.appendChild(fila);

        return;
    }

    docentes.forEach(docente => {

        const fila = document.createElement('tr');

        const datos = [
            docente.Nombres,
            docente.Apellidos,
            docente.Cedula,
            docente.Telefono,
            docente.CorreoInstitucional,
            docente.CodigoInstitucional,
            docente.Estado
        ];

        datos.forEach(dato => {

            const celda = document.createElement('td');

            celda.textContent = dato ?? '';

            fila.appendChild(celda);
        });

        tablaDocentes.appendChild(fila);
    });
}


// ==========================================
// BUSCAR DOCENTES EN TIEMPO REAL
// ==========================================

buscarDocente.addEventListener('input', () => {

    const textoBusqueda = buscarDocente.value
        .trim()
        .toLowerCase();

    const docentesFiltrados = listaDocentes.filter(docente => {

        return (
            (docente.CodigoInstitucional || '').toLowerCase().includes(textoBusqueda) ||
            (docente.Cedula || '').toLowerCase().includes(textoBusqueda) ||
            (docente.CorreoInstitucional || '').toLowerCase().includes(textoBusqueda)
        );
    });

    if (docentesFiltrados.length === 0) {

        tablaDocentes.innerHTML = '';

        const fila = document.createElement('tr');
        const celda = document.createElement('td');

        celda.colSpan = 6;
        celda.textContent = 'No se encontraron docentes con los criterios ingresados';

        fila.appendChild(celda);
        tablaDocentes.appendChild(fila);

    } else {

        mostrarDocentes(docentesFiltrados);
    }

});
