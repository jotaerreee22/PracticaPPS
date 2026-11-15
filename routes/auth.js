const express = require("express");
const db = require("../db");

const router = express.Router();

router.post("/login", (req, res, next) => {
    const { usuario, password } = req.body ?? {};

    if (
        typeof usuario !== "string" || usuario.trim() === "" ||
        typeof password !== "string" || password === ""
    ) {
        return res.status(400).json({
            error: "Introduce el usuario y la contraseña"
        });
    }

    db.get(
        "SELECT usuario FROM usuarios WHERE usuario = ?",
        [usuario.trim()],
        (error, cuenta) => {
            if (error) {
                return next(error);
            }

            console.log("¿Se encontró la cuenta?", Boolean(cuenta));
            return res.status(503).json({
                mensaje: "La verificación de la contraseña está pendiente"
            });
        }
    );
});

module.exports = router;


    

