function iniciarSesion() {
    var usuario = document.getElementById("usuario").value;
    var contraseña = document.getElementById("contraseña").value;
    
    // Hago la petición al servidor y guardo la respuesta en la variable promise
    var promise = $.ajax({
        type: "POST",
        url: "/identificar",
        data: JSON.stringify({username: usuario, password: contraseña}),
        contentType: "application/json;charset=UTF-8",
        dataType: "json"
    });

    // Tratar la respuesta que me da el servidor
    promise.always(function(data) {
        if (data.res == "login true") { // Si la respuesta del servidor es login true, redirijo al usuario a /rutaSegura
            document.cookie = "usuario=" + data.res.user;
            document.cookie = "contraseña=" + data.res.password;
            Swal.fire({
                icon: 'success',
                title: 'Inicio de sesión exitoso',
                text: 'Serás redirigido en breve...',
                timer: 2000,
                timerProgressBar: true,
                willClose: () => {
                    window.location.replace("/feed"); // vamos al muro lo primero de todo
                }
            });
        } else if (data.res == "usuario no válido") { // Si la respuesta del servidor es "usuario no válido", significa que este usuario no es el correcto.
            Swal.fire({
                icon: 'error',
                title: 'No estás autorizado',
                text: 'El usuario no es correcto.'
            });
        } else if (data.res == "login failed") { // Si la respuesta es "login failed", significa que hay algún campo sin rellenar.
            Swal.fire({
                icon: 'warning',
                title: 'Campos incompletos',
                text: 'Debes introducir el usuario y contraseña.'
            });
        } else { // Esto evita que pete por si acaso
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ha ocurrido un error inesperado.'
            });
        }
    });
}
