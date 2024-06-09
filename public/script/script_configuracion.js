document.addEventListener('DOMContentLoaded', function() {
    cargarDatosUsuario();
});

function cargarDatosUsuario() {
    $.ajax({
        type: 'GET',
        url: '/perfil',
        success: function(response) {
            $('#nombre').val(response.nombre);
            $('#apellidos').val(response.apellidos);
            $('#nickUsuario').val(response.username);
            
            // Asegúrate de que la fecha de nacimiento está en el formato correcto (YYYY-MM-DD)
            var fechaNacimiento = new Date(response.fechaNacimiento);
            var dia = ("0" + fechaNacimiento.getDate()).slice(-2);
            var mes = ("0" + (fechaNacimiento.getMonth() + 1)).slice(-2);
            var fechaFormateada = fechaNacimiento.getFullYear() + "-" + mes + "-" + dia;
            $('#fechaNacimiento').val(fechaFormateada);

            // Manejar etiquetas
            const etiquetas = response.etiquetas;
            for (const etiqueta in etiquetas) {
                if (etiquetas[etiqueta]) {
                    $(`.tag[data-tag=${etiqueta}]`).addClass('selected');
                }
            }

            // Seleccionar el plan de descargas actual
            $('#planDescargas').val(response.planDescargas); // Asegúrate de que el valor del select es el correcto
        },
        error: function(error) {
            console.error('Error al cargar los datos del usuario:', error);
        }
    });
}



function actualizarPerfil() {
    var nombre = $('#nombre').val();
    var apellidos = $('#apellidos').val();
    var fechaNacimiento = $('#fechaNacimiento').val();
    var planDescargas = $('#planDescargas').val(); // Obtener el plan de descargas seleccionado

    var etiquetasSeleccionadas = {
        landscape: false,
        retrato: false,
        macro: false,
        arquitectura: false,
        naturaleza: false
    };

    $('.tag.selected').each(function() {
        etiquetasSeleccionadas[$(this).data('tag')] = true;
    });

    var formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('apellidos', apellidos);
    formData.append('fechaNacimiento', fechaNacimiento);
    formData.append('planDescargas', planDescargas); // Añadir el plan de descargas al formData
    formData.append('etiquetas', JSON.stringify(etiquetasSeleccionadas));
    var imagenPerfil = $('#imagenPerfil')[0].files[0];
    if (imagenPerfil) {
        formData.append('imagenPerfil', imagenPerfil);
    }

    Swal.fire({
        title: '¿Estás seguro?',
        text: "¿Quieres actualizar tu perfil?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, actualizar',
        cancelButtonText: 'No, cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                type: 'POST',
                url: '/actualizar-perfil',
                data: formData,
                contentType: false,
                processData: false,
                success: function(response) {
                    Swal.fire(
                        'Actualizado',
                        'Tu perfil ha sido actualizado.',
                        'success'
                    ).then(() => {
                        window.location.replace('/home');
                    });
                },
                error: function(error) {
                    console.error('Error al actualizar el perfil:', error);
                    Swal.fire(
                        'Error',
                        'Hubo un problema al actualizar tu perfil.',
                        'error'
                    );
                }
            });
        }
    });
}

function subirImagen() {
    const fileInput = document.getElementById('inputImagen');
    const descripcion = document.getElementById('inputDescripcion');
    const categoriaInput = document.getElementById('categoria');
    const formData = new FormData();
    formData.append('imagen', fileInput.files[0]);
    formData.append('descripcion', descripcion.value); 
    formData.append('categoria', categoriaInput.value);

    $.ajax({
        type: 'POST',
        url: '/upload',
        data: formData,
        contentType: false,
        processData: false,
        success: function (response) {
            console.log('Imagen subida correctamente');
            console.log('Ruta de la imagen:', response.imagePath);
            alert('Imagen subida correctamente');

            // Cerrar el modal después de la subida exitosa
            $('#uploadModal').modal('hide');
            cargarPublicacionesUsuario();
            cargarPerfil(); // Actualizar datos del perfil después de subir la imagen
        },
        error: function (error) {
            console.error('Error al subir la imagen:', error);
        }
    });
}

$(document).ready(function() {
    $('.tag').click(function() {
        $(this).toggleClass('selected');
    });
});
