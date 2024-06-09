const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();
const server = require('http').Server(app);
const { conectarDB, Usuario } = require('./mongo');
const port = process.env.port || 3000;

//CONFIGURACIONES
app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());
app.use(session({
    secret: 'clave_mateo_sergio', 
    resave: false,
    saveUninitialized: true
}));
app.use('/styles', express.static(path.join(__dirname, 'styles')));
var auth = function(req, res, next){
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.sendStatus(401); // No autorizado
    }
}

// Configuración de Multer para imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const username = req.session.user;
        const userFolderPath = `public/images/${username}`;
        fs.mkdir(userFolderPath, { recursive: true }, (err) => {
            if (err) {
                console.error("Error al crear la carpeta del usuario:", err);
            }
            cb(null, userFolderPath);
        });
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

//FUNCIONES GET

app.get('/', (req, res) => {
    var contenido = fs.readFileSync('public/index.html');
    res.setHeader('Content-type', 'text/html');
    res.send(contenido);
});

app.get("/registro", (req, response) => {
    var contenido = fs.readFileSync("public/registro.html");
    response.setHeader("Content-type", "text/html");
    response.send(contenido);
});

app.get('/feed', auth, (req, res) => {
    var contenido = fs.readFileSync('public/feed.html', 'utf8');
    res.setHeader('Content-type', 'text/html');
    res.send(contenido);
});
app.get('/configuracion', auth, (req, res) => {
    var contenido = fs.readFileSync('public/configuracion.html', 'utf8');
    res.setHeader('Content-type', 'text/html');
    res.send(contenido);
});
app.get('/home', auth, (req, res) => {
    const username = req.session.user;
    if (username) {
        var contenido = fs.readFileSync('public/home.html', 'utf8');
        contenido = contenido.replace('</body>', `<script>var currentUser = "${username}";</script></body>`);
        res.setHeader('Content-type', 'text/html');
        res.send(contenido);
    } else {
        res.sendStatus(401);
    }
});app.get('/perfil/:username', auth, async (req, res) => {
    var contenido = fs.readFileSync('public/perfil.html', 'utf8');
    contenido = contenido.replace('</body>', `<script>var profileUser = "${req.params.username}";</script></body>`);
    res.setHeader('Content-type', 'text/html');
    res.send(contenido);
});

//NO SE USA
/*app.get('/imagenes-usuario', auth, async (req, res) => {
    try {
        const username = req.session.user;
        const usuario = await Usuario.findOne({ username });
        if (usuario) {
            const imagenesRelativas = usuario.publicaciones.map(publicacion => publicacion.imagePath.replace('public\\', ''));
            res.json({ imagenes: imagenesRelativas });
        } else {
            res.status(404).json({ error: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener las imágenes del usuario:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});*/
app.get('/obtenerEtiquetasUsuario', auth, async (req, res) => {
    try {
        const username = req.session.user;
        const usuario = await Usuario.findOne({ username: username }, 'etiquetas');

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json({ etiquetas: Object.keys(usuario.etiquetas).filter(key => usuario.etiquetas[key] === true) });
    } catch (error) {
        console.error('Error al obtener las etiquetas del usuario:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});
app.get('/cargarFeed', auth, async (req, res) => {
    try {
        // Incluir imagenPerfil en la consulta
        const usuarios = await Usuario.find({}, 'publicaciones username imagenPerfil').exec();
        
        let publicaciones = [];

        usuarios.forEach(usuario => {
            // Verificar y ajustar la ruta de la imagen de perfil
            let imagenPerfilPublicacion = 'images/default-profile.png';
            if (usuario.imagenPerfil) {
                imagenPerfilPublicacion = usuario.imagenPerfil.replace(/^public[\\/]/, '').replace(/\\/g, '/');
            }
            //console.log(`Usuario: ${usuario.username}, Imagen de perfil: ${imagenPerfilPublicacion}`);

            usuario.publicaciones.forEach(publicacion => {
                const imagePath = publicacion.imagePath.replace(/^public[\\/]/, '').replace(/\\/g, '/');

                publicaciones.push({
                    _id: publicacion._id,
                    username: usuario.username,
                    imagePath: imagePath,
                    meGustas: publicacion.meGustas,
                    comentarios: publicacion.comentarios,
                    descripcion: publicacion.descripcion,
                    categoria: publicacion.categoria,
                    imagenPerfilPublicacion: imagenPerfilPublicacion
                });
            });
        });

        res.json({ publicaciones });
    } catch (error) {
        console.error('Error al obtener el feed:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});


//CREO QUE ESTO ES PARA LAS PUBLICACION EN EL PERFIL ASI QUE ALOMEJOR HAY QUE AÑADIR LA "DESCRIPCIÓN" DE LA FOTO.
app.get('/publicaciones-usuario', auth, async (req, res) => {
    try {
        const username = req.session.user;
        const usuario = await Usuario.findOne({ username });
        if (usuario) {
            const publicaciones = usuario.publicaciones.map(publicacion => ({
                _id: publicacion._id,
                imagePath: publicacion.imagePath.replace('public\\', ''),
                meGustas: publicacion.meGustas,
                comentarios: publicacion.comentarios,
                username: usuario.username,
                descripcion: publicacion.descripcion
            }));
            res.json({ publicaciones });
        } else {
            res.status(404).json({ error: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener las publicaciones del usuario:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});


// Ruta para obtener la información del perfil del usuario
app.get('/perfil', auth, async (req, res) => {
    try {
        const usuarioId = req.session.userId;
        const usuario = await Usuario.findById(usuarioId);

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json({
            nombre: usuario.nombre,
            apellidos: usuario.apellidos,
            username: usuario.username,
            fechaNacimiento: usuario.fechaNacimiento.toISOString().split('T')[0], // Formatear la fecha
            seguidores: usuario.seguidores.length,
            seguidos: usuario.seguidos.length,
            publicaciones: usuario.publicaciones.length,
            imagenPerfil: usuario.imagenPerfil ? usuario.imagenPerfil.replace('public\\', '') : 'images/default-profile.png', // Ruta correcta para la imagen
            etiquetas: usuario.etiquetas,
            planDescargas: usuario.planDescargas
            
        });
        
    } catch (error) {
        console.error('Error al obtener el perfil del usuario:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

app.get('/currentUser', auth, (req, res) => {
    const username = req.session.user;
    res.json({ username });
});
// Ruta para servir la página de perfil del usuario
app.get('/perfil/:username', auth, async (req, res) => {
    var contenido = fs.readFileSync('public/perfil.html', 'utf8');
    contenido = contenido.replace('</body>', `<script>var profileUser = "${req.params.username}";</script></body>`);
    res.setHeader('Content-type', 'text/html');
    res.send(contenido);
});

app.get('/perfil-data/:username', auth, async (req, res) => {
    const username = req.params.username;
    const usuario = await Usuario.findOne({ username });

    if (usuario) {
        //ESTO ES LO QUE TENÍA YO
        //const imagenPerfil = usuario.imagenPerfil ? usuario.imagenPerfil.replace(/\\/g, '/').replace('public/', '') : 'images/default-profile.png';
        //ESTO LO TENÍAS TÚ, LO DEJO QUE A MI NO ME AFECTA CREO
        //const imagenPerfil = usuario.imagenPerfil ? '/'+usuario.imagenPerfil.replace('public\\', '') : 'images/default-profile.png';

        res.status(200).json({
            nombre: usuario.nombre,
            apellidos: usuario.apellidos,
            username: usuario.username,
            seguidores: usuario.seguidores.length,
            seguidos: usuario.seguidos.length,
            publicaciones: usuario.publicaciones.length,
            imagenPerfil: usuario.imagenPerfil ? usuario.imagenPerfil.replace('public\\', '') : 'images/default-profile.png', // Ruta correcta para la imagen
        });
    } else {
        res.status(404).json({ message: 'Usuario no encontrado' });
    }
});

//ALOMEJOR HAY QUE AÑADIR LA DESCRIPCIÓN AQUÍ TAMBIÉN
// Ruta para obtener las publicaciones de un usuario específico
app.get('/publicaciones-de-usuario/:username', auth, async (req, res) => {
    const username = req.params.username;
    const usuario = await Usuario.findOne({ username }, 'publicaciones');

    if (usuario) {
        const publicaciones = usuario.publicaciones.map(publicacion => ({
            _id: publicacion._id,
            imagePath: publicacion.imagePath.replace('public\\', ''),
            meGustas: publicacion.meGustas,
            comentarios: publicacion.comentarios,
            username: username,
            descripcion: publicacion.descripcion
        }));
        res.status(200).json({ publicaciones });
    } else {
        res.status(404).json({ message: 'Usuario no encontrado' });
    }
});
app.get('/obtenerComentarios/:publicacionId', auth, async (req, res) => {
    try {
        const { publicacionId } = req.params;
        const usuario = await Usuario.findOne({ 'publicaciones._id': publicacionId }, { 'publicaciones.$': 1 });

        if (!usuario) {
            return res.status(404).json({ message: 'Publicación no encontrada' });
        }

        const publicacion = usuario.publicaciones.id(publicacionId);

        res.status(200).json({ comentarios: publicacion.comentarios });
    } catch (error) {
        console.error('Error al obtener los comentarios:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

//FUNCIONES POST

app.post("/registrar", async function(req, res){
    console.log("Datos recibidos para registro: ", req.body);
    if (!req.body.username || !req.body.password || !req.body.nombre || !req.body.apellidos || !req.body.fechaNacimiento || !req.body.etiquetas || !req.body.planDescargas) {
        res.send({"res":"register failed"});
    } else {
        try {
            const usuarioExistente = await Usuario.findOne({ username: req.body.username });
            if (usuarioExistente) {
                console.log("Ya existe un usuario con ese nombre");
                res.send({"res":"usuario ya existe"});
            } else {
                const nuevoUsuario = new Usuario({
                    nombre: req.body.nombre,
                    apellidos: req.body.apellidos,
                    username: req.body.username,
                    fechaNacimiento: req.body.fechaNacimiento,
                    password: req.body.password,
                    etiquetas: req.body.etiquetas,
                    planDescargas: req.body.planDescargas,
                    descargasRestantes: req.body.planDescargas === 1 ? 10 : req.body.planDescargas === 2 ? 25 : Infinity
                });
                await nuevoUsuario.save();
                console.log("Nuevo usuario creado: ", nuevoUsuario);
                res.send({"res":"register true"});
            }
        } catch(err) {
            console.error("Error al crear usuario: ", err);
            res.send({"res":"register failed"});
        }
    }
});


app.post("/identificar", async function(req, res){
    if (!req.body.username || !req.body.password) {
        res.send({"res":"login failed"});
    } else {
        const usuarioEncontrado = await Usuario.findOne({ username: req.body.username, password: req.body.password });
        if (usuarioEncontrado) {
            req.session.user = req.body.username;
            req.session.userId = usuarioEncontrado._id;
            req.session.admin = true;
            return res.send({"res":"login true"});
        } else {
            res.send({"res":"usuario no válido"});
        }
    }
});

app.post('/upload', auth, upload.single('imagen'), async (req, res) => {
    try {
        const imagePath = req.file.path;
        const usuarioId = req.session.userId;
        const usuarionick = req.session.user;
        const descripcion = req.body.descripcion;
        //AÑADO LO DE CATEGORÍA QUE TIENES TÚ
        const { categoria } = req.body; 
        if (!categoria) {
            return res.status(400).json({ message: 'La categoría es requerida' });
        }
        const nuevaPublicacion = {
            imagePath: imagePath,
            autor: usuarionick,
            descripcion: descripcion,
            //AÑADO LO DE CATEGORÍA
            categoria: categoria
        };
        console.log("Se ha subido la foto con el nick"+usuarionick);
        await Usuario.findByIdAndUpdate(usuarioId, { $push: { publicaciones: nuevaPublicacion } });
        
        res.status(200).json({ message: 'Imagen subida correctamente', imagePath: imagePath });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al subir la imagen' });
    }
});



// Ruta para añadir un comentario a una publicación
app.post('/comentario', auth, async (req, res) => {
    try {
        const { publicacionId, texto } = req.body;

        // Buscar la publicación en todos los usuarios
        const usuario = await Usuario.findOne({ 'publicaciones._id': publicacionId });

        if (!usuario) {
            return res.status(404).json({ message: 'Publicación no encontrada' });
        }

        const publicacion = usuario.publicaciones.id(publicacionId);

        if (!publicacion) {
            return res.status(404).json({ message: 'Publicación no encontrada' });
        }

        const nuevoComentario = {
            usuario: req.session.user,
            texto: texto,
            fecha: new Date()
        };

        publicacion.comentarios.push(nuevoComentario);

        await usuario.save();

        res.status(200).json({ message: 'Comentario añadido correctamente', usuario: req.session.user });
    } catch (error) {
        console.error('Error al añadir comentario:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

//LA FUNCIÓN ME GUSTA, LA DEJO ENTERA LA MÍA DIGO
// Ruta para añadir un "me gusta" a una publicación
app.post('/me-gusta', auth, async (req, res) => {
    try {
        const { publicacionId } = req.body;
        const usernick = req.session.user;

        // Buscar la publicación en todos los usuarios
        const usuario = await Usuario.findOne({ 'publicaciones._id': publicacionId });

        if (!usuario) {
            return res.status(404).json({ message: 'Publicación no encontrada' });
        }

        const publicacion = usuario.publicaciones.id(publicacionId);

        if (!publicacion) {
            return res.status(404).json({ message: 'Publicación no encontrada' });
        }

        // Verificar si el usuario ya ha dado "me gusta"
        const meGustaIndex = publicacion.meGustas.indexOf(usernick);

        if (meGustaIndex === -1) {
            // No ha dado "me gusta", añadirlo
            publicacion.meGustas.push(usernick);
            await usuario.save();
            res.status(200).json({ success: true, liked: true, likesCount: publicacion.meGustas.length });
            
        } else {
            // Ya ha dado "me gusta", eliminarlo
            publicacion.meGustas.splice(meGustaIndex, 1);
            await usuario.save();
            res.status(200).json({ success: true, liked: false, likesCount: publicacion.meGustas.length });
        }

    } catch (error) {
        console.error('Error al gestionar "me gusta":', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});


//ESTA FUNCIÓN TU NO LA TENÍAS
app.post('/me-gusta-o-no', auth, async (req, res) => {
    try {
        const { publicacionId } = req.body;
        const usernick = req.session.user;

        // Buscar la publicación en todos los usuarios
        const usuario = await Usuario.findOne({ 'publicaciones._id': publicacionId });

        if (!usuario) {
            return res.status(404).json({ message: 'Publicación no encontrada' });
        }

        const publicacion = usuario.publicaciones.id(publicacionId);

        if (!publicacion) {
            return res.status(404).json({ message: 'Publicación no encontrada' });
        }
 
        // Verificar si el usuario ya ha dado "me gusta"
        const meGustaIndex = publicacion.meGustas.indexOf(usernick);

        if (meGustaIndex === -1) {
            // No ha dado "me gusta", añadirlo
            
            res.status(200).json({ status: true});
        } else {
            // Ya ha dado "me gusta", eliminarlo
            
            res.status(200).json({ status: false});
        }

    } catch (error) {
        console.error('Error al gestionar "me gusta":', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});


app.post('/actualizar-perfil', auth, upload.single('imagenPerfil'), async (req, res) => {
    try {
        const usuarioId = req.session.userId;
        const { nombre, apellidos, fechaNacimiento, etiquetas, planDescargas } = req.body;

        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        usuario.nombre = nombre;
        usuario.apellidos = apellidos;
        usuario.fechaNacimiento = new Date(fechaNacimiento);
        usuario.etiquetas = JSON.parse(etiquetas);
        usuario.planDescargas = parseInt(planDescargas, 10); // Asegúrate de convertir a número entero
        usuario.descargasRestantes = usuario.planDescargas === 1 ? 10 : usuario.planDescargas === 2 ? 25 : Infinity; // Actualiza las descargas restantes según el plan

        if (req.file) {
            const imagenPerfilPath = req.file.path;
            usuario.imagenPerfil = imagenPerfilPath;
        }

        await usuario.save();
        res.status(200).json({ message: 'Perfil actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar el perfil:', error);
        res.status(500).json({ message: 'Error al actualizar el perfil' });
    }
});

//PETICIONES DE BORRAR
app.delete('/delete-photo/:photoId', auth, async (req, res) => {
    try {
        const usuarioId = req.session.userId;
        const photoId = req.params.photoId;

        // Buscar la publicación en todos los usuarios
        const usuario = await Usuario.findOne({ 'publicaciones._id': photoId });
        if (!usuario) {
            return res.status(404).json({ message: 'Foto no encontrada' });
        }

        const publicacion = usuario.publicaciones.id(photoId);
        if (!publicacion) {
            return res.status(404).json({ message: 'Publicación no encontrada' });
        }

        const photoPath = publicacion.imagePath;

        // Eliminar la publicación del array de publicaciones
        usuario.publicaciones.pull({ _id: photoId });
        await usuario.save();

        // Eliminar el archivo físicamente
        if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
        }

        res.status(200).json({ message: 'Foto eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar la foto' });
    }
});
// Ruta para verificar el estado de seguimiento
app.get('/follow-status/:username', auth, async (req, res) => {
    try {
        const usuarioId = req.session.userId;
        const username = req.params.username;

        const usuario = await Usuario.findById(usuarioId);
        const isFollowing = usuario.seguidos.includes(username);

        res.status(200).json({ isFollowing: isFollowing });
    } catch (error) {
        console.error('Error al verificar el estado de seguimiento:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Ruta para seguir a un usuario
app.post('/seguir', auth, async (req, res) => {
    try {
        const usuarioId = req.session.userId;
        const seguirUsername = req.body.username; // Nombre de usuario a seguir

        const usuario = await Usuario.findById(usuarioId);
        const usuarioASeguir = await Usuario.findOne({ username: seguirUsername });

        if (!usuarioASeguir) {
            return res.status(404).json({ message: 'Usuario a seguir no encontrado' });
        }

        // Verificar si ya sigue al usuario
        if (usuario.seguidos.includes(usuarioASeguir.username)) {
            return res.status(400).json({ message: 'Ya sigues a este usuario' });
        }

        // Añadir el usuario a la lista de seguidos
        usuario.seguidos.push(usuarioASeguir.username);
        // Añadir este usuario a la lista de seguidores del usuario a seguir
        usuarioASeguir.seguidores.push(usuario.username);

        await usuario.save();
        await usuarioASeguir.save();

        res.status(200).json({ message: 'Usuario seguido correctamente' });
    } catch (error) {
        console.error('Error al seguir al usuario:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Ruta para dejar de seguir a un usuario
app.post('/dejar-de-seguir', auth, async (req, res) => {
    try {
        const usuarioId = req.session.userId;
        const dejarDeSeguirUsername = req.body.username; // Nombre de usuario a dejar de seguir

        const usuario = await Usuario.findById(usuarioId);
        const usuarioADejarDeSeguir = await Usuario.findOne({ username: dejarDeSeguirUsername });

        if (!usuarioADejarDeSeguir) {
            return res.status(404).json({ message: 'Usuario a dejar de seguir no encontrado' });
        }

        // Verificar si no sigue al usuario
        if (!usuario.seguidos.includes(usuarioADejarDeSeguir.username)) {
            return res.status(400).json({ message: 'No sigues a este usuario' });
        }

        // Eliminar el usuario de la lista de seguidos
        usuario.seguidos = usuario.seguidos.filter(username => username !== usuarioADejarDeSeguir.username);
        // Eliminar este usuario de la lista de seguidores del usuario a dejar de seguir
        usuarioADejarDeSeguir.seguidores = usuarioADejarDeSeguir.seguidores.filter(username => username !== usuario.username);

        await usuario.save();
        await usuarioADejarDeSeguir.save();

        res.status(200).json({ message: 'Usuario dejado de seguir correctamente' });
    } catch (error) {
        console.error('Error al dejar de seguir al usuario:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Ruta para iniciar la descarga
app.post('/iniciar-descarga', auth, async (req, res) => {
    try {
        const usuarioId = req.session.userId;
        const usuario = await Usuario.findById(usuarioId);
        const publicacionId = req.body.publicacionId;

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Obtener la publicación a descargar
        const usuarioPublicacion = await Usuario.findOne({ 'publicaciones._id': publicacionId }, { 'publicaciones.$': 1 });
        if (!usuarioPublicacion) {
            return res.status(404).json({ message: 'Publicación no encontrada' });
        }

        const publicacion = usuarioPublicacion.publicaciones.id(publicacionId);
        const imagePath = publicacion.imagePath.replace(/^public[\\/]/, '').replace(/\\/g, '/');

        if (usuario.planDescargas === 3) {
            return res.json({ status: 'ok', downloadUrl: `/${imagePath}` });
        }

        if (usuario.descargasRestantes > 0) {
            return res.json({
                status: 'confirm',
                message: `Te quedan ${usuario.descargasRestantes} descargas. ¿Deseas continuar?`
            });
        } else {
            return res.json({
                status: 'limit',
                message: 'Has alcanzado el límite de descargas para hoy.'
            });
        }
    } catch (error) {
        console.error('Error al iniciar la descarga:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Ruta para confirmar la descarga
app.post('/confirmar-descarga', auth, async (req, res) => {
    try {
        const usuarioId = req.session.userId;
        const usuario = await Usuario.findById(usuarioId);
        const publicacionId = req.body.publicacionId;

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (usuario.descargasRestantes <= 0 && usuario.planDescargas !== 3) {
            return res.status(400).json({ message: 'Has alcanzado el límite de descargas para hoy.' });
        }

        // Obtener la publicación a descargar
        const usuarioPublicacion = await Usuario.findOne({ 'publicaciones._id': publicacionId }, { 'publicaciones.$': 1 });
        if (!usuarioPublicacion) {
            return res.status(404).json({ message: 'Publicación no encontrada' });
        }

        const publicacion = usuarioPublicacion.publicaciones.id(publicacionId);
        const imagePath = publicacion.imagePath.replace(/^public[\\/]/, '').replace(/\\/g, '/');

        if (usuario.planDescargas !== 3) {
            usuario.descargasRestantes -= 1;
            await usuario.save();
        }

        res.json({ downloadUrl: `/${imagePath}` });
    } catch (error) {
        console.error('Error al confirmar la descarga:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Función para reiniciar los contadores de descargas
const reiniciarContadoresDescargas = async () => {
    try {
        const usuarios = await Usuario.find();
        usuarios.forEach(async (usuario) => {
            usuario.descargasRestantes = usuario.planDescargas === 1 ? 10 : usuario.planDescargas === 2 ? 25 : Infinity;
            await usuario.save();
        });
        console.log('Contadores de descargas reiniciados.');
    } catch (error) {
        console.error('Error al reiniciar los contadores de descargas:', error);
    }
};

// Ejecutar la función de reinicio cada 24 horas
setInterval(reiniciarContadoresDescargas, 24 * 60 * 60 * 1000);


conectarDB();
server.listen(port, () => {
    console.log(`App escuchando en el puerto ${port}`);
});
