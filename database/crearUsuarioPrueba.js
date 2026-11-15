
const bcrypt = require('bcrypt');
const db = require('./conexion');

async function crearUsuario() {
    try {
        const usuario = 'prueba';
        const nombre = 'Usuario de prueba';
        const password = 'Prueba1234!';

        // Generar hash seguro de la contraseña
        const hash = await bcrypt.hash(password, 12);

        const sql = `
            INSERT INTO usuarios
            (usuario, nombre, password, grupo, admin)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.run(
            sql,
            [usuario, nombre, hash, null, 0],
            function(error) {
                if (error) {
                    console.error('Error:', error.message);
                } else {
                    console.log('Usuario creado correctamente');
                    console.log('Usuario:', usuario);
                    console.log('Contraseña:', password);
                }

                db.close();
            }
        );
    } catch (error) {
        console.error(error);
        db.close();
    }
}

crearUsuario();
