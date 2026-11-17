const express = require("express");
const db = require("../database/conexion");

const router = express.Router();

router.get("/usuarios", (req, res, next) => {
    if (!req.session?.usuario) {
        return res.status(401).json({ error: "Inicia sesión primero" });
    }

    db.all(
        "SELECT usuario, nombre, grupo FROM usuarios ORDER BY usuario",
        (error, usuarios) => {
            if (error) return next(error);
            return res.json(usuarios);
        }
    );
});

module.exports = router;