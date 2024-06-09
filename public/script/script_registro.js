$(document).ready(function() {
    // Manejar clics en las etiquetas
    $('.tag').click(function() {
        $(this).toggleClass('selected');
    });

    // Manejar la selección de planes
    $('.select-plan').click(function() {
        $('.plan-card').removeClass('selected-plan');
        $(this).closest('.plan-card').addClass('selected-plan');
    });
});

function registrarUsuario() {
    // Capturar los valores del formulario
    var nombre = document.getElementById("nombre").value;
    var apellidos = document.getElementById("apellidos").value;
    var usuario = document.getElementById("nickUsuario").value;
    var fechaNacimiento = document.getElementById("fechaNacimiento").value;
    var contraseña = document.getElementById("contraseña").value;
    var repetirContraseña = document.getElementById("repetirContraseña").value;

    // Validaciones
    if (!nombre || !apellidos || !usuario || !fechaNacimiento || !contraseña || !repetirContraseña) {
        Swal.fire({
            icon: 'error',
            title: 'Campos incompletos',
            html: '<ul>' +
                  (nombre ? '<li><i class="fas fa-check"></i> Nombre</li>' : '<li><i class="fas fa-times"></i> Nombre</li>') +
                  (apellidos ? '<li><i class="fas fa-check"></i> Apellidos</li>' : '<li><i class="fas fa-times"></i> Apellidos</li>') +
                  (usuario ? '<li><i class="fas fa-check"></i> Usuario</li>' : '<li><i class="fas fa-times"></i> Usuario</li>') +
                  (fechaNacimiento ? '<li><i class="fas fa-check"></i> Fecha de Nacimiento</li>' : '<li><i class="fas fa-times"></i> Fecha de Nacimiento</li>') +
                  (contraseña ? '<li><i class="fas fa-check"></i> Contraseña</li>' : '<li><i class="fas fa-times"></i> Contraseña</li>') +
                  (repetirContraseña ? '<li><i class="fas fa-check"></i> Repetir Contraseña</li>' : '<li><i class="fas fa-times"></i> Repetir Contraseña</li>') +
                  '</ul>',
            customClass: {
                popup: 'swal-wide'
            }
        });
        return;
    }

    if (contraseña !== repetirContraseña) {
        Swal.fire({
            icon: 'error',
            title: 'Error de Contraseña',
            text: 'Las contraseñas no coinciden.'
        });
        return;
    }

    // Construir el objeto de etiquetas seleccionadas
    var etiquetasSeleccionadas = {
        landscape: false,
        retrato: false,
        macro: false,
        arquitectura: false,
        naturaleza: false
    };

    // Marcar las etiquetas seleccionadas como true en el objeto
    $('.tag.selected').each(function() {
        etiquetasSeleccionadas[$(this).data('tag')] = true;
    });

    // Obtener el plan seleccionado
    var planDescargas = $('.plan-card.selected-plan').data('plan');
    if (!planDescargas) {
        Swal.fire({
            icon: 'error',
            title: 'Error de Registro',
            text: 'Debes seleccionar un plan de descargas.'
        });
        return;
    }

    // Hacer la petición al servidor
    var promise = $.ajax({
        type: "POST",
        url: "/registrar",
        // Datos a enviar al servidor
        data: JSON.stringify({
            nombre: nombre,
            apellidos: apellidos,
            username: usuario,
            fechaNacimiento: fechaNacimiento,
            password: contraseña,
            etiquetas: etiquetasSeleccionadas,
            planDescargas: planDescargas
        }),
        contentType: "application/json;charset=UTF-8",
        dataType: "json"
    });

    // Tratar la respuesta del servidor
    promise.always(function(data) {
        if (data.res == "register true") {
            Swal.fire({
                icon: 'success',
                title: 'Registro Exitoso',
                text: 'Serás redirigido en breve...',
                timer: 2000,
                timerProgressBar: true,
                willClose: () => {
                    window.location.replace("/");
                }
            });
        } else if (data.res == "usuario ya existe") {
            Swal.fire({
                icon: 'error',
                title: 'Error de Registro',
                text: 'El usuario ya existe.'
            });
        } else if (data.res == "register failed") {
            Swal.fire({
                icon: 'error',
                title: 'Error de Registro',
                text: 'Debes introducir todos los campos correctamente.'
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error Desconocido',
                text: 'Ha ocurrido un error inesperado.'
            });
        }
    });
}
