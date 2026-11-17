var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');

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

/* RUTA RAÍZ: Muestra el login o redirige si ya hay sesión */
router.get('/', function(req, res, next) {
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
router.post('/login', function(req, res) {
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
router.get('/admin/usuarios', function(req, res) {
    if (!req.session.usuario || req.session.usuario.rol !== 'admin') return res.redirect('/');
    res.render('admin_usuarios', { usuarios: bd.usuarios, grupos: bd.grupos });
});

router.post('/admin/usuario/alta', upload.single('foto'), function(req, res) {
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
router.get('/admin/grupos', function(req, res) {
    if (!req.session.usuario || req.session.usuario.rol !== 'admin') return res.redirect('/');
    res.render('admin_grupos', { grupos: bd.grupos });
});

router.post('/admin/grupo/alta', function(req, res) {
    bd.grupos.push({ id: bd.grupos.length + 1, nombre: req.body.nombre });
    res.redirect('/admin/grupos');
});

/* DASHBOARD DE USUARIO */
router.get('/dashboard', function(req, res) {
    const usuarioLogueado = req.session.usuario;
    if (!usuarioLogueado) return res.redirect('/');

    const compañeros = bd.usuarios.filter(u => u.grupo === usuarioLogueado.grupo && u.id !== usuarioLogueado.id);
    const misMensajes = bd.mensajes.filter(m => m.grupoId === usuarioLogueado.grupo);
    
    res.render('dashboard', { usuario: usuarioLogueado, compañeros, mensajes: misMensajes });
});

/* CERRAR SESIÓN */
router.get('/logout', function(req, res) {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;