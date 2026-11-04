
// ==========================================
// CAMBIO ENTRE FORMULARIOS
// ==========================================

const btnUsuarios = document.getElementById('btnUsuarios');
const btnDocentes = document.getElementById('btnDocentes');

const seccionUsuarios = document.getElementById('seccionUsuarios');
const seccionDocentes = document.getElementById('seccionDocentes');

btnUsuarios.addEventListener('click', () => {
    seccionUsuarios.classList.remove('oculto');
    seccionDocentes.classList.add('oculto');

    btnUsuarios.classList.add('activa');
    btnDocentes.classList.remove('activa');
});

btnDocentes.addEventListener('click', () => {
    seccionDocentes.classList.remove('oculto');
    seccionUsuarios.classList.add('oculto');

    btnDocentes.classList.add('activa');
    btnUsuarios.classList.remove('activa');
});


// ==========================================
// REGISTRAR CUENTA DEL PERSONAL - HU-02
// ==========================================

const formUsuario = document.getElementById('formUsuario');

formUsuario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const boton = formUsuario.querySelector('.btn-guardar');
    const mensaje = document.getElementById('mensajeUsuario');

    const datosUsuario = {
        Nombres: document.getElementById('nombresUsuario').value.trim(),
        Apellidos: document.getElementById('apellidosUsuario').value.trim(),
        Cedula: document.getElementById('cedulaUsuario').value.trim(),
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
        mensaje.style.color = '#16834a';

        formUsuario.reset();

    } catch (error) {
        mensaje.textContent = error.message;
        mensaje.style.color = '#dc2626';

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

    const boton = formDocente.querySelector('.btn-guardar');
    const mensaje = document.getElementById('mensajeDocente');

    const datosDocente = {
        Nombres: document.getElementById('nombresDocente').value.trim(),
        Apellidos: document.getElementById('apellidosDocente').value.trim(),
        Cedula: document.getElementById('cedulaDocente').value.trim(),
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
        mensaje.style.color = '#16834a';

        formDocente.reset();

    } catch (error) {
        mensaje.textContent = error.message;
        mensaje.style.color = '#dc2626';

    } finally {
        boton.disabled = false;
        boton.textContent = 'Registrar docente';
    }
});
