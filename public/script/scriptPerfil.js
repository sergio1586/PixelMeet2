document.addEventListener('DOMContentLoaded', function() {
    if (typeof currentUser !== 'undefined') {
        const nick_usuario = document.getElementById('nick_usuario');
        nick_usuario.innerHTML = `${currentUser}`;
        cargarPerfil(); // Cargar datos del perfil del usuario
        cargarPublicacionesUsuario(); // Cargar publicaciones del usuario
    }

    if (typeof profileUser !== 'undefined') {
        cargarPerfilUsuario(profileUser); // Cargar datos del perfil de otro usuario
        cargarPublicacionesDeUsuario(profileUser); // Cargar publicaciones de otro usuario
        actualizarContadores();
    }
});
$(document).ready(function() {
    $('#confirmDeleteButton').on('click', function() {
        var photoId = $('#confirmDeleteModal').data('photo-id');
        eliminarFoto(photoId);
        $('#confirmDeleteModal').modal('hide');
    });
});
function cargarPerfil() {
    $.ajax({
        type: 'GET',
        url: '/perfil',
        success: function (response) {
            if (response) {
                $('#nick_usuario').text(response.username);
                $('#publicaciones').text(`${response.publicaciones} publicaciones`);
                $('#seguidores').text(`${response.seguidores} seguidores`);
                $('#seguidos').text(`${response.seguidos} seguidos`);
                if (response.imagenPerfil) {
                    $('#fotoperfil').attr('src', `/${response.imagenPerfil}`);
                } else {
                    $('#fotoperfil').attr('src', 'images/default-profile.png'); // Imagen de perfil predeterminada
                }
            } else {
                console.error('Error al cargar el perfil del usuario.');
            }
        },
        error: function (error) {
            console.error('Error al cargar el perfil del usuario:', error);
        }
    });
}
function actualizarContadores() {
    $.ajax({
        type: 'GET',
        url: '/perfil',
        success: function (response) {
            if (response) {
                $('#seguidores').text(`${response.seguidores} seguidores`);
                $('#seguidos').text(`${response.seguidos} seguidos`);
            } else {
                console.error('Error al actualizar los contadores del perfil del usuario.');
            }
        },
        error: function (error) {
            console.error('Error al actualizar los contadores del perfil del usuario:', error);
        }
    });
}
function cargarPerfilUsuario(username) {
    $.ajax({ 
        type: 'GET',
        url: `/perfil-data/${username}`,
        success: function (response) {
            if (response) {
                $('#nick_usuario').text(response.username);
                $('#publicaciones').text(`${response.publicaciones} publicaciones`);
                $('#seguidores').text(`${response.seguidores} seguidores`);
                $('#seguidos').text(`${response.seguidos} seguidos`);
                if (response.imagenPerfil) {
                    $('#fotoperfil').attr('src', `/${response.imagenPerfil}`);
                } else {
                    $('#fotoperfil').attr('src', '/images/default-profile.png'); // Imagen de perfil predeterminada
                }
            } else {
                console.error('Error al cargar el perfil del usuario.');
            }
        },
        error: function (error) {
            console.error('Error al cargar el perfil del usuario:', error);
        } 
    });
}

function cargarPublicacionesUsuario() {
    $.ajax({
        type: 'GET',
        url: '/publicaciones-usuario',
        success: function (response) {
            if (response && response.publicaciones && response.publicaciones.length > 0) {
                var galeria = $('#galeria');
                galeria.empty();

                $.each(response.publicaciones, function(index, publicacion) {
                    const imgContainer = $('<div>', {
                        'class': 'col-md-4 col-sm-6 image-container',
                        'data-publicacion-id': publicacion._id
                    });

                    var imgElement = $('<img>', {
                        src: `/${publicacion.imagePath}`,
                        'class': 'galeria-img',
                        'click': function() {
                            $('#modalImage').attr('src', `/${publicacion.imagePath}`).data('publicacion-id', publicacion._id);
                            $('#modalUserProfilePic').attr('src', `/${publicacion.imagenPerfil}`);
                            $('#modalUserProfileLink').attr('href', `/perfil/${publicacion.username}`).text(`@${publicacion.username}`);
                            $('#modalDescription').html(`<strong>${publicacion.username}</strong> ${publicacion.descripcion}`);
                            $('#modalComments').empty();
                    
                            // Cargar los comentarios más recientes desde el servidor
                            $.ajax({
                                type: 'GET',
                                url: `/obtenerComentarios/${publicacion._id}`,
                                success: function(response) {
                                    if (response && response.comentarios) {
                                        $.each(response.comentarios, function(index, comentario) {
                                            var commentElement = $('<div>', {
                                                'class': 'comment',
                                                'html': `<strong>${comentario.usuario}</strong> ${comentario.texto}`
                                            });
                                            $('#modalComments').append(commentElement);
                                        });
                                        if ($('#modalComments').children('.comment').length > 5) {
                                            $('#modalComments').css({'max-height': '150px', 'overflow-y': 'auto'});
                                        }
                                        scrollToBottom();
                                    }
                                },
                                error: function(error) {
                                    console.error('Error al obtener los comentarios:', error);
                                }
                            });
                    
                            showLike(publicacion._id).then(likeButtonHtml => {
                                $('#modalLikeButton').html(likeButtonHtml);
                                $('#modalLikeButton').off('click').on('click', function() {
                                    toggleLike(publicacion._id);
                                });
                            });
                    
                            $('#modalCommentSubmitButton').off('click').on('click', function() {
                                var comentarioTexto = $('#modalCommentBox').val();
                                if (comentarioTexto) {
                                    addComment(publicacion._id, comentarioTexto);
                                    $('#modalCommentBox').val('');
                                }
                            });
                    
                            $('#imageModal').modal('show');
                        }
                    });

                    // Botón de eliminar imagen
                    var deleteButton = $('<button>', {
                        'class': 'delete-btn',
                        'html': '<img src="images/borrar.png" alt="Eliminar">',
                        'click': function() {
                            Swal.fire({
                                title: '¿Estás seguro?',
                                text: "¡No podrás revertir esto!",
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#3085d6',
                                cancelButtonColor: '#d33',
                                confirmButtonText: 'Sí, eliminarlo!'
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    eliminarFoto(publicacion._id);
                                    Swal.fire(
                                        'Eliminado!',
                                        'Tu imagen ha sido eliminada.',
                                        'success'
                                    )
                                }
                            });
                        }
                    });

                    var likesLabel = $('<div>', {
                        'class': 'likes-label',
                        'text': `${publicacion.meGustas.length} Me gusta`
                    });

                    showLike(publicacion._id).then(likeButtonHtml => {
                        var likeButton = $('<button>', {
                            'class': 'like-button',
                            'html': likeButtonHtml,
                            'click': function() {
                                toggleLike(publicacion._id);
                            }
                        });

                        var commentButton = $('<button>', {
                            'class': 'comment-button',
                            'text': 'Comentar',
                            'click': function() {
                                var comentarioTexto = prompt('Introduce tu comentario:');
                                if (comentarioTexto) {
                                    addComment(publicacion._id, comentarioTexto);
                                }
                            }
                        });

                        var commentsContainer = $('<div>', {
                            'class': 'comments-container',
                            'id': 'comments-container2',
                            'style': publicacion.comentarios.length > 5 ? 'max-height: 150px; overflow-y: auto;' : ''
                        });

                        // Mostrar solo los primeros comentarios en la página principal
                        var comentariosMostrados = publicacion.comentarios.slice(0, 5);
                        $.each(comentariosMostrados, function(index, comentario) {
                            var commentElement = $('<div>', {
                                'class': 'comment',
                                'html': `<strong>${comentario.usuario}</strong> ${comentario.texto}`
                            });
                            commentsContainer.append(commentElement);
                        });

                        // Si hay más de cinco comentarios, añadir botón "Ver más"
                        if (publicacion.comentarios.length > 5) {
                            var verMasButton = $('<button>', {
                                'class': 'ver-mas-button',
                                'text': 'Ver más comentarios',
                                'click': function() {
                                    $('#modalImage').attr('src', `/${publicacion.imagePath}`).data('publicacion-id', publicacion._id);
                                    $('#modalUserProfilePic').attr('src', `/${publicacion.imagenPerfil}`);
                                    $('#modalUserProfileLink').attr('href', `/perfil/${publicacion.username}`).text(`@${publicacion.username}`);
                                    $('#modalDescription').html(`<strong>${publicacion.username}</strong> ${publicacion.descripcion}`);
                                    $('#modalComments').empty();
                                    $.each(publicacion.comentarios, function(index, comentario) {
                                        var commentElement = $('<div>', {
                                            'class': 'comment',
                                            'html': `<strong>${comentario.usuario}</strong> ${comentario.texto}`
                                        });
                                        $('#modalComments').append(commentElement);
                                    });
                                    $('#modalCommentBox').val('');
                                    showLike(publicacion._id).then(likeButtonHtml => {
                                        $('#modalLikeButton').html(likeButtonHtml);
                                        $('#modalLikeButton').off('click').on('click', function() {
                                            toggleLike(publicacion._id);
                                        });
                                    });

                                    $('#modalCommentSubmitButton').off('click').on('click', function() {
                                        var comentarioTexto = $('#modalCommentBox').val();
                                        if (comentarioTexto) {
                                            addComment(publicacion._id, comentarioTexto);
                                            $('#modalCommentBox').val('');
                                        }
                                    });

                                    $('#imageModal').modal('show');
                                }
                            });
                            commentsContainer.append(verMasButton);
                        }

                        var commentBox = $('<textarea>', {
                            'class': 'comment-box',
                            'placeholder': 'Añade un comentario...'
                        });

                        var commentSubmitButton = $('<button>', {
                            'class': 'comment-submit-button',
                            'click': function() {
                                var comentarioTexto = commentBox.val();
                                if (comentarioTexto) {
                                    addComment(publicacion._id, comentarioTexto);
                                }
                            }
                        });

                        var submitButtonImage = $('<img>', {
                            'src': 'images/enviar.png',
                            'alt': 'Enviar',
                            'class': 'submit-button-image'
                        });

                        commentSubmitButton.append(submitButtonImage);

                        var commentContainer = $('<div>', {
                            'class': 'comment-container'
                        });

                        commentContainer.append(commentBox).append(commentSubmitButton);

                        imgContainer.append(imgElement.addClass('galeria-img'))
                            .append(deleteButton) // Añadir el botón de eliminar
                            .append(likesLabel)
                            .append(likeButton)
                            .append(commentButton)
                            .append(commentsContainer)
                            .append(commentContainer);

                        galeria.append(imgContainer);
                    }).catch(error => {
                        console.error('Error al obtener el botón de me gusta:', error);
                    });
                });
            } else {
                console.log('El usuario no tiene imágenes.');
            }
        },
        error: function(error) {
            console.error('Error al cargar las imágenes del usuario:', error);
        }
    });
}

function addLike(publicacionId) {
    $.ajax({
        type: 'POST',
        url: '/me-gusta',
        data: JSON.stringify({ publicacionId: publicacionId }),
        contentType: 'application/json',
        success: function(response) {
            cargarPublicacionesUsuario(); // Recargar las publicaciones para actualizar el número de "me gusta"
        },
        error: function(error) {
            console.error('Error al añadir "me gusta":', error);
        }
    });
}

function showLike(publicacionId) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            url: '/me-gusta-o-no',
            data: JSON.stringify({ publicacionId: publicacionId }),
            contentType: 'application/json',
            success: function(response) {
                var likeButtonHtml;
                if (response.status) {
                    likeButtonHtml = '<img src="/images/me-gusta.png" alt="Me gusta">';
                } else {
                    likeButtonHtml = '<img src="/images/me-gusta2.png" alt="Me gusta">';
                }

                // Actualizar el botón de "me gusta" en el perfil
                var publicacionContainer = $(`[data-publicacion-id="${publicacionId}"]`);
                var likeButton = publicacionContainer.find('.like-button');
                //var likesLabel = publicacionContainer.find('.likes-label');

                likeButton.html(likeButtonHtml);
                //likesLabel.text(`${response.likesCount} Me gusta`);

                likeButton.off('click').on('click', function() {
                    toggleLike(publicacionId);
                });

                // Actualizar el botón de "me gusta" en el modal si está visible
                if ($('#imageModal').hasClass('show') && $('#modalImage').data('publicacion-id') === publicacionId) {
                    var modalLikeButton = $('#modalLikeButton');
                    //var modalLikesLabel = $('#modalLikesLabel');

                    modalLikeButton.html(likeButtonHtml);
                    //modalLikesLabel.text(`${response.likesCount} Me gusta`);

                    modalLikeButton.off('click').on('click', function() {
                        toggleLike(publicacionId);
                    });
                }

                resolve(likeButtonHtml);
            },
            error: function(error) {
                console.error('Error al verificar "me gusta":', error);
                reject(error);
            }
        });
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
        success: function(response) {
            $('#uploadModal').modal('hide');
            cargarPublicacionesUsuario();
            cargarPerfil();
            
            // Mostrar modal de confirmación con SweetAlert
            Swal.fire({
                title: 'Imagen subida',
                text: 'Tu imagen se ha subido correctamente.',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            });
        },
        error: function(error) {
            console.error('Error al subir la imagen:', error);
            // Mostrar modal de error con SweetAlert
            Swal.fire({
                title: 'Error',
                text: 'Hubo un problema al subir la imagen.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        }
    });
}


function eliminarFoto(photoId) {
    $.ajax({
        type: "DELETE",
        url: `/delete-photo/${photoId}`,
        success: function(response) {
            console.log(response.message);
            // Eliminar el contenedor de la imagen eliminada del DOM
            $(`[data-publicacion-id="${photoId}"]`).remove();
            // Volver a cargar las publicaciones del usuario
            cargarPublicacionesUsuario();
            // Actualizar el perfil del usuario
            cargarPerfil();
        },
        error: function(error) {
            console.error('Error al eliminar la foto:', error);
        }
    });
}



function addLike(publicacionId) {
    $.ajax({
        type: 'POST',
        url: '/me-gusta',
        data: JSON.stringify({ publicacionId: publicacionId }),
        contentType: 'application/json',
        success: function(response) {
            alert(response.message);
            cargarPublicacionesUsuario(); // Recargar las publicaciones para actualizar el número de "me gusta"
        },
        error: function(error) {
            console.error('Error al añadir "me gusta":', error);
        }
    });
}

function addComment(publicacionId, texto) {
    $.ajax({
        type: 'POST',
        url: '/comentario',
        data: JSON.stringify({ publicacionId: publicacionId, texto: texto }),
        contentType: 'application/json',
        success: function(response) {
            var comentario = {
                usuario: response.usuario,
                texto: texto,
                fecha: new Date()
            };
            renderComment(publicacionId, comentario);
            $(`[data-publicacion-id="${publicacionId}"] .comment-box`).val('');
            $('#modalCommentBox').val('');
            scrollToBottom();
            scrollToBottomFeed();
        },
        error: function(error) {
            console.error('Error al añadir comentario:', error);
        }
    });
}

function renderComment(publicacionId, comentario) {
    var publicacionContainer = $(`[data-publicacion-id="${publicacionId}"]`);
    var commentsContainer = publicacionContainer.find('.comments-container');

    var commentElement = $('<div>', {
        'class': 'comment',
        'html': `<strong>${comentario.usuario}</strong> ${comentario.texto}`
    });

    commentsContainer.append(commentElement);

    // Actualizar el estilo del contenedor de comentarios si hay más de 5 comentarios
    if (commentsContainer.children('.comment').length > 5) {
        commentsContainer.css({'max-height': '150px', 'overflow-y': 'auto'});
    }

    if ($('#imageModal').hasClass('show') && $('#modalImage').data('publicacion-id') === publicacionId) {
        var modalCommentsContainer = $('#modalComments');

        var modalCommentElement = $('<div>', {
            'class': 'comment',
            'html': `<strong>${comentario.usuario}</strong> ${comentario.texto}`
        });

        modalCommentsContainer.append(modalCommentElement);

        // Actualizar el estilo del contenedor de comentarios en el modal si hay más de 5 comentarios
        if (modalCommentsContainer.children('.comment').length > 5) {
            modalCommentsContainer.css({'max-height': '150px', 'overflow-y': 'auto'});
        }
    }
}
function toggleLike(publicacionId) {
    $.ajax({
        type: 'POST',
        url: '/me-gusta',
        data: JSON.stringify({ publicacionId: publicacionId }),
        contentType: 'application/json',
        success: function(response) {
            if (response && response.likesCount !== undefined) {
                var publicacionContainer = $(`[data-publicacion-id="${publicacionId}"]`);
                var likesLabel = publicacionContainer.find('.likes-label');
                likesLabel.text(`${response.likesCount} Me gusta`);
            }
            showLike(publicacionId);
        },
        error: function(error) {
            console.error('Error al gestionar "me gusta":', error);
        }
    });
}
function scrollToBottom() {
    var commentsContainer = document.getElementById('modalComments');
    commentsContainer.scrollTop = commentsContainer.scrollHeight;
}
function scrollToBottomFeed() {
    var container = document.getElementById('comments-container2');
    container.scrollTop = container.scrollHeight;
}

