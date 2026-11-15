
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ruta donde estará la base de datos
const rutaBD = path.join(__dirname, 'practicaPPS.db');

// Abrimos la conexión
const db = new sqlite3.Database(rutaBD, (error) => {
    if (error) {
        console.error('Error al conectar:', error.message);
    } else {
        console.log('Conectado a SQLite3');

        // Activar las claves foráneas
        db.run('PRAGMA foreign_keys = ON');
    }
});

// Exportar la conexión para el backend
module.exports = db;
