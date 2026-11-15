const express = require("express");
const authRoutes = require("./routes/auth");
const session = require("express-session");

const app = express();

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(authRoutes);


app.get("/", (req, res) => {
    res.send("Servidor PracticaPPS funcionando");
});

app.listen(3000, () => {
    console.log("Servidor iniciado en http://localhost:3000");
});