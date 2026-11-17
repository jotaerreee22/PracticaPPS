const express = require("express");
const db = require("../database/conexion");

const router = express.Router();

function soloAdmin(req, res, next) {
    const usuario = req.session?.usuario;

    if (!usuario) {
        return res.status(401).json({ error: "Inicia sesión primero" });
    }

    db.get("SELECT admin FROM usuarios WHERE usuario = ?", [usuario], (error, cuenta) => {
        if (error) {
            return next(error);
        }

        if (cuenta?.admin !== 1) {
            return res.status(403).json({ error: "Se requiere una cuenta de administrador" });
        }

        next();
    });
}

router.post("/grupos", soloAdmin, (req, res, next) => {
    const nombre = req.body?.nombre;

    if (typeof nombre !== "string" || nombre.trim() === "") {
        return res.status(400).json({ error: "Introduce un nombre de grupo" });
    }

    db.run("INSERT INTO grupos (nombre) VALUES (?)", [nombre.trim()], function (error) {
        if (error) {
            return next(error);
        }

        return res.status(201).json({ id_grupo: this.lastID, nombre: nombre.trim() });
    });
});

router.delete("/grupos/:id", soloAdmin, (req, res, next) => {
    const idGrupo = Number(req.params.id);

    if (!Number.isSafeInteger(idGrupo) || idGrupo <= 0) {
        return res.status(400).json({ error: "ID de grupo inválido" });
    }

    db.run("DELETE FROM grupos WHERE id_grupo = ?", [idGrupo], function (error) {
        if (error) {
            return next(error);
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: "El grupo no existe" });
        }

        return res.status(204).end();
    });
});

module.exports = router;