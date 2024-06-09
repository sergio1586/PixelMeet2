const mongoose = require("mongoose");

// URI de conexión a MongoDB
const mongoDBURI = "mongodb+srv://mgonzalezn97:yCd7sRyoc42yFuP8@cluster0.d3aivsk.mongodb.net/MEDAC";

// Esquema de los comentarios
const comentarioSchema = new mongoose.Schema({
    usuario: String,
    texto: String,
    fecha: { type: Date, default: Date.now }
});

// Esquema de las publicaciones
const publicacionSchema = new mongoose.Schema({
    autor: String,
    imagePath: String,
    descripcion: String,
    categoria: String,
    fecha: { type: Date, default: Date.now },
    meGustas: { type: [String], default: [] },
    comentarios: [comentarioSchema]
});

// Esquema de los usuarios
const usuarioSchema = new mongoose.Schema({
    nombre: String,
    apellidos: String,
    username: String,
    fechaNacimiento: Date,
    password: String,
    seguidores: { type: [String], default: [] },
    seguidos: { type: [String], default: [] },
    etiquetas: { type: Object, default: {} },
    imagenPerfil: String,
    publicaciones: [publicacionSchema],
    planDescargas: { type: Number, default: 1 }, // Nuevo atributo
    descargasRestantes: { type: Number, default: 10 }
});

// Modelos basados en los esquemas
const Usuario = mongoose.model('Usuario', usuarioSchema);
const Publicacion = mongoose.model('Publicacion', publicacionSchema);

// Función para conectar a MongoDB
const conectarDB = async () => {
    try {
        await mongoose.connect(mongoDBURI, {});
        console.log("Conectado a MongoDB");
    } catch (err) {
        console.error("Error al conectar a MongoDB:", err);
        process.exit(1); // Detiene la aplicación en caso de error
    }
};

// Exportar los modelos y la función de conexión
module.exports = { Usuario, Publicacion, conectarDB };
