const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../database/conexion");

const router = express.Router();

router.post("/login", (req, res, next) => {
    const { usuario, password } = req.body ?? {};

    if (
        typeof usuario !== "string" ||
        usuario.trim() === "" ||
        typeof password !== "string" ||
        password === ""
    ) {
        return res.status(400).json({
            error: "Introduce el usuario y la contraseña"
        });
    }

    db.get(
        "SELECT usuario, password FROM usuarios WHERE usuario = ?",
        [usuario.trim()],
        async (error, cuenta) => {
            if (error) {
                return next(error);
            }

            try {
                const coincide = cuenta &&
                    await bcrypt.compare(password, cuenta.password);

                if (!coincide) {
                    return res.status(401).json({
                        error: "Usuario o contraseña incorrectos"
                    });
                }

                req.session.regenerate((error) => {
                    if (error) {
                        return next(error);
                    }

                    req.session.usuario = cuenta.usuario;

                    req.session.save((error) => {
                        if (error) {
                            return next(error);
                        }

                        return res.json({ mensaje: "Sesión iniciada" });
                    });
                });
            } catch (error) {
                return next(error);
            }
        }
    );
});

module.exports = router;