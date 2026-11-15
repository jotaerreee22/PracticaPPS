const express = require("express");
const db = require("../db");

const router = express.Router();

router.post("/grupos", (req, res, next) => {
    const nombre = req.body?.nombre;

    if (typeof nombre !== "string" || nombre.trim() === "") {
        return res.status(400).json({ error: "Introduce un nombre de grupo" });
    }

    db.run("INSERT INTO grupos (nombre) VALUES (?)", [nombre.trim()], function (error) {
        if (error) {
            return next(error);
        }

        res.status(201).json({ id_grupo: this.lastID, nombre: nombre.trim() });
    });
});

router.delete("/grupos/:id", (req, res, next) => {
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