const express = require('express');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const app = express();

// Configuración para subir fotos
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Vistas y motor EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'secreto_seguro_express',
    resave: false,
    saveUninitialized: true
}));

// Base de datos simulada en memoria
let bd = {
    usuarios: [
        { id: 1, email: 'admin@app.com', pass: 'admin123', nombre: 'Admin', rol: 'admin', grupo: null, foto: 'default.png' },
        { id: 2, email: 'user1@app.com', pass: '123', nombre: 'Carlos Hurtado', rol: 'user', grupo: 1, foto: 'default.png' },
        { id: 3, email: 'user2@app.com', pass: '123', nombre: 'Ana Gómez', rol: 'user', grupo: 1, foto: 'default.png' }
    ],
    grupos: [{ id: 1, nombre: 'Grupo Desarrollo' }],
    mensajes: [{ id: 1, remitenteNombre: 'Ana Gómez', texto: '¡Hola! ¿Cómo vais con la interfaz?', grupoId: 1 }]
};

// --- RUTAS DE LA APLICACIÓN ---

// Login
app.get('/', (req, res) => res.render('login'));

app.post('/login', (req, res) => {
    const { email, pass } = req.body;
    const usuario = bd.usuarios.find(u => u.email === email && u.pass === pass);
    if (!usuario) return res.redirect('/');
    
    req.session.user = usuario;
    if (usuario.rol === 'admin') {
        res.redirect('/admin/usuarios');
    } else {
        res.redirect('/dashboard');
    }
});

// Admin - Usuarios
app.get('/admin/usuarios', (req, res) => {
    res.render('admin_usuarios', { usuarios: bd.usuarios, grupos: bd.grupos });
});

app.post('/admin/usuario/alta', upload.single('foto'), (req, res) => {
    const { nombre, email, pass, grupoId } = req.body;
    const foto = req.file ? req.file.filename : 'default.png';
    bd.usuarios.push({
        id: bd.usuarios.length + 1,
        nombre, email, pass, rol: 'user',
        grupo: parseInt(grupoId),
        foto
    });
    res.redirect('/admin/usuarios');
});

// Admin - Grupos
app.get('/admin/grupos', (req, res) => {
    res.render('admin_grupos', { grupos: bd.grupos });
});

app.post('/admin/grupo/alta', (req, res) => {
    bd.grupos.push({ id: bd.grupos.length + 1, nombre: req.body.nombre });
    res.redirect('/admin/grupos');
});

// Dashboard de Usuario (Chat)
app.get('/dashboard', (req, res) => {
    const usuarioLogueado = req.session.user || bd.usuarios[1]; // Carlos por defecto si no hay sesión activa
    const compañeros = bd.usuarios.filter(u => u.grupo === usuarioLogueado.grupo && u.id !== usuarioLogueado.id);
    const misMensajes = bd.mensajes.filter(m => m.grupoId === usuarioLogueado.grupo);
    
    res.render('dashboard', { usuario: usuarioLogueado, compañeros, mensajes: misMensajes });
});

app.post('/mensaje/enviar', (req, res) => {
    const { texto } = req.body;
    const remitente = req.session.user || bd.usuarios[1];
    bd.mensajes.push({
        id: bd.mensajes.length + 1,
        remitenteNombre: remitente.nombre,
        texto,
        grupoId: remitente.grupo
    });
    res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(3000, () => console.log('🚀 Servidor Express Generator listo en http://localhost:3000'));

module.exports = app;
