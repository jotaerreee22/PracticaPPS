var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var multer = require('multer');

var app = express();

// Motor de vistas Pug
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de Sesiones
app.use(session({
    secret: 'clave-super-secreta',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Configuración de Multer para fotos
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

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

// --- RUTAS INTEGRADAS ---

/* RUTA RAÍZ: Muestra el login o redirige si ya hay sesión */
app.get('/', function(req, res) {
  if (req.session.usuario) {
      if (req.session.usuario.rol === 'admin') {
          return res.redirect('/admin/usuarios');
      } else {
          return res.redirect('/dashboard');
      }
  }
  res.render('login', { title: 'Iniciar Sesión' });
});

/* PROCESAR LOGIN */
app.post('/login', function(req, res) {
    const { email, pass } = req.body;
    const usuario = bd.usuarios.find(u => u.email === email && u.pass === pass);
    if (!usuario) return res.redirect('/');
    
    req.session.usuario = usuario; 
    if (usuario.rol === 'admin') {
        res.redirect('/admin/usuarios');
    } else {
        res.redirect('/dashboard');
    }
});

/* PANEL ADMIN: USUARIOS */
app.get('/admin/usuarios', function(req, res) {
    if (!req.session.usuario || req.session.usuario.rol !== 'admin') return res.redirect('/');
    res.render('admin_usuarios', { usuarios: bd.usuarios, grupos: bd.grupos });
});

app.post('/admin/usuario/alta', upload.single('foto'), function(req, res) {
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

/* PANEL ADMIN: GRUPOS */
app.get('/admin/grupos', function(req, res) {
    if (!req.session.usuario || req.session.usuario.rol !== 'admin') return res.redirect('/');
    res.render('admin_grupos', { grupos: bd.grupos });
});

app.post('/admin/grupo/alta', function(req, res) {
    bd.grupos.push({ id: bd.grupos.length + 1, nombre: req.body.nombre });
    res.redirect('/admin/grupos');
});

/* DASHBOARD DE USUARIO */
app.get('/dashboard', function(req, res) {
    const usuarioLogueado = req.session.usuario;
    if (!usuarioLogueado) return res.redirect('/');

    const compañeros = bd.usuarios.filter(u => u.grupo === usuarioLogueado.grupo && u.id !== usuarioLogueado.id);
    const misMensajes = bd.mensajes.filter(m => m.grupoId === usuarioLogueado.grupo);
    
    res.render('dashboard', { usuario: usuarioLogueado, compañeros, mensajes: misMensajes });
});

/* ENVÍO DE MENSAJES */
app.post('/mensaje/enviar', function(req, res) {
    const { texto } = req.body;
    const remitente = req.session.usuario;
    if (!remitente) return res.redirect('/');

    bd.mensajes.push({
        id: bd.mensajes.length + 1,
        remitenteNombre: remitente.nombre,
        texto,
        grupoId: remitente.grupo
    });
    res.redirect('/dashboard');
});

/* CERRAR SESIÓN */
app.get('/logout', function(req, res) {
    req.session.destroy();
    res.redirect('/');
});

// Capturar error 404
app.use(function(req, res, next) {
  next(createError(404));
});

// Manejador de errores interno (Evita buscar vistas externas de error)
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send(`<h1>Error ${err.status || 500}: ${err.message}</h1><a href="/">Volver al inicio</a>`);
});

module.exports = app;