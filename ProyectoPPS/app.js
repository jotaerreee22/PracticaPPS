var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var multer = require('multer');

var app = express();
const bcrypt = require('bcrypt');
const db = require('../database/conexion');

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

// Base de datos simulada en memoria (Usuarios sin @)
let bd = {
    usuarios: [
        { id: 1, email: 'admin', pass: 'admin123', nombre: 'Admin', rol: 'admin', grupo: null, foto: 'default.png' },
        { id: 2, email: 'carlos', pass: '123', nombre: 'Carlos Hurtado', rol: 'user', grupo: 1, foto: 'default.png' },
        { id: 3, email: 'ana', pass: '123', nombre: 'Ana Gómez', rol: 'user', grupo: 1, foto: 'default.png' }
    ],
    grupos: [{ id: 1, nombre: 'Grupo Desarrollo' }],
    mensajes: [{ id: 1, remitenteNombre: 'Ana Gómez', texto: '¡Hola! Bienvenidos al sistema.', grupoId: 1 }]
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
app.post('/login', function(req, res, next) {
    const { email, pass } = req.body;
 
    db.get(
        'SELECT usuario, nombre, password, grupo, admin FROM usuarios WHERE usuario = ?',
        [email],
        async (error, usuario) => {
            if (error) return next(error);
 
            try {
                const correcto = usuario &&
                    await bcrypt.compare(pass, usuario.password);
 
                if (!correcto) {
                    return res.status(401).send(
                        'Usuario o contraseña incorrectos'
                    );
                }
 
                req.session.regenerate((error) => {
                    if (error) return next(error);
 
                    req.session.usuario = {
                        id: usuario.usuario,
                        email: usuario.usuario,
                        nombre: usuario.nombre,
                        grupo: usuario.grupo,
                        rol: Number(usuario.admin) === 1
                            ? 'admin'
                            : 'user'
                    };
 
                    req.session.save((error) => {
                        if (error) return next(error);
 
                        if (req.session.usuario.rol === 'admin') {
                            return res.redirect('/admin/usuarios');
                        }
 
                        return res.redirect('/dashboard');
                    });
                });
            } catch (error) {
                next(error);
            }
        }
    );
});
/* LISTADO DE USUARIOS - SQLITE3 */
 
app.get('/admin/usuarios', function(req, res, next) {
 
    if (!req.session.usuario ||
        req.session.usuario.rol !== 'admin') {
        return res.redirect('/');
    }
 
    const sqlUsuarios = `
        SELECT
            usuario AS id,
            usuario AS email,
            nombre,
            grupo,
            CASE
                WHEN admin = 1 THEN 'admin'
                ELSE 'user'
            END AS rol
        FROM usuarios
        ORDER BY nombre
    `;
 
    db.all(sqlUsuarios, [], (err, usuarios) => {
        if (err) return next(err);
 
        db.all(
            'SELECT id_grupo AS id, nombre FROM grupos ORDER BY nombre',
            [],
            (err, grupos) => {
                if (err) return next(err);
 
                res.render('admin_usuarios', {
                    usuarios,
                    grupos
                });
            }
        );
    });
});
/* ALTA DE USUARIOS - SQLITE3 */
 
app.post('/admin/usuario/alta', upload.single('foto'),
    async function(req, res, next) {
 
    const administrador = req.session.usuario;
 
    if (!administrador) {
        return res.redirect('/');
    }
 
    if (administrador.rol !== 'admin') {
        return res.status(403).send('Acceso denegado');
    }
 
    const { nombre, email, pass, grupoId } = req.body;
 
    const nombreLimpio = (nombre || '').trim();
    const nuevoUsuario = (email || '').trim();
    const password = pass || '';
 
    if (!nombreLimpio || !nuevoUsuario || !password) {
        return res.status(400).send(
            'Nombre, usuario y contraseña son obligatorios'
        );
    }
 
    const grupo = grupoId ? Number(grupoId) : null;
 
    if (grupo !== null &&
        (!Number.isSafeInteger(grupo) || grupo <= 0)) {
        return res.status(400).send('Grupo no válido');
    }
 
    try {
        const passwordHash = await bcrypt.hash(password, 12);
 
        const sql = `
            INSERT INTO usuarios
                (usuario, nombre, password, grupo, admin)
            VALUES (?, ?, ?, ?, ?)
        `;
 
        db.run(
            sql,
            [
                nuevoUsuario,
                nombreLimpio,
                passwordHash,
                grupo,
                0
            ],
            function(err) {
                if (err) {
                    if (err.code === 'SQLITE_CONSTRAINT') {
                        return res.status(400).send(
                            'El usuario ya existe o el grupo no es válido'
                        );
                    }
 
                    return next(err);
                }
 
                res.redirect('/admin/usuarios');
            }
        );
    } catch (err) {
        next(err);
    }
});

/* ELIMINAR USUARIO */
app.get('/admin/usuario/eliminar/:id', function(req, res) {
    if (!req.session.usuario || req.session.usuario.rol !== 'admin') return res.redirect('/');
    const userId = parseInt(req.params.id);
    
    if (userId === req.session.usuario.id) {
        return res.redirect('/admin/usuarios');
    }

    bd.usuarios = bd.usuarios.filter(u => u.id !== userId);
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
/* DASHBOARD DE USUARIO - SQLITE3 */
 
app.get('/dashboard', function(req, res, next) {
    const usuarioLogueado = req.session.usuario;
 
    if (!usuarioLogueado) {
        return res.redirect('/');
    }
 
    // Buscar compañeros del mismo grupo
    const sqlCompaneros = `
        SELECT usuario, nombre, admin
        FROM usuarios
        WHERE grupo = ?
          AND usuario != ?
    `;
 
    db.all(
        sqlCompaneros,
        [usuarioLogueado.grupo, usuarioLogueado.id],
        (err, filasCompaneros) => {
            if (err) return next(err);
 
            const companeros = filasCompaneros.map(u => ({
                nombre: u.nombre,
                rol: Number(u.admin) === 1 ? 'admin' : 'user'
            }));
 
            // Buscar mensajes del grupo
            const sqlMensajes = `
                SELECT
                    m.texto,
                    m.fecha_hora,
                    u.nombre AS remitenteNombre
                FROM mensajes m
                JOIN usuarios u ON m.usuario = u.usuario
                WHERE m.grupo = ?
                ORDER BY m.fecha_hora ASC, m.id_mensaje ASC
            `;
 
            db.all(
                sqlMensajes,
                [usuarioLogueado.grupo],
                (err, mensajes) => {
                    if (err) return next(err);
 
                    res.render('dashboard', {
                        usuario: usuarioLogueado,
                        companeros,
                        mensajes
                    });
                }
            );
        }
    );
});

/* ENVÍO DE MENSAJES */
/* ENVIAR MENSAJES - SQLITE3 */
 
app.post('/mensaje/enviar', function(req, res, next) {
    const remitente = req.session.usuario;
 
    if (!remitente) {
        return res.redirect('/');
    }
 
    const texto = (req.body.texto || '').trim();
 
    if (!texto) {
        return res.status(400).send('El mensaje no puede estar vacío');
    }
 
    // Cada usuario debe pertenecer a un grupo
    if (remitente.grupo == null) {
        return res.status(403).send(
            'Debes pertenecer a un grupo para enviar mensajes'
        );
    }
 
    const sql = `
        INSERT INTO mensajes (fecha_hora, grupo, usuario, texto)
        VALUES (?, ?, ?, ?)
    `;
 
    const fechaHora = new Date().toISOString();
 
    db.run(
        sql,
        [
            fechaHora,
            remitente.grupo,
            remitente.id,
            texto
        ],
        function(err) {
            if (err) return next(err);
 
            res.redirect('/dashboard');
        }
    );
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

// Manejador de errores interno
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send(`<h1>Error ${err.status || 500}: ${err.message}</h1><a href="/">Volver al inicio</a>`);
});

module.exports = app;