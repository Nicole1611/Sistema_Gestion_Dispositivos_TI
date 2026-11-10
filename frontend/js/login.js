
// Obtener los elementos del formulario
const loginForm = document.getElementById("loginForm");
const correoInstitucional = document.getElementById("correoInstitucional");
const contrasena = document.getElementById("contrasena");

// Detectar el envío del formulario
loginForm.addEventListener("submit", async (evento) => {

    evento.preventDefault();

    // Obtener los valores ingresados
    const correo = correoInstitucional.value.trim();
    const password = contrasena.value;

    // Validar campos vacíos
    if (!correo || !password) {
        alert("Ingrese su correo y contraseña.");
        return;
    }

    try {
        // Enviar los datos al backend
        const respuesta = await fetch(
            "http://localhost:3000/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    correo: correo,
                    contrasena: password
                })
            }
        );

        const resultado = await respuesta.json();

        // Comprobar respuesta del servidor
        if (!respuesta.ok) {
            alert(resultado.mensaje);
            return;
        }

        // Guardar información de sesión
        sessionStorage.setItem("token", resultado.token);

        sessionStorage.setItem(
            "usuario",
            JSON.stringify(resultado.usuario)
        );

        // Comprobar si debe cambiar su contraseña
    if (resultado.usuario.debe_cambiar_contrasena) {
        window.location.href = "pages/auth/cambiar-contrasena.html";
    } else {
    alert("Bienvenido/a " + resultado.usuario.nombres);
    // Redirigir al inicio
    window.location.href = "pages/inicio.html";
}
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        alert("No se pudo conectar con el servidor.");
    }
});
