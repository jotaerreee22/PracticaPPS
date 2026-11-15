
CREATE TABLE IF NOT EXISTS grupos (
    id_grupo INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT
);

CREATE TABLE IF NOT EXISTS usuarios (
    usuario TEXT PRIMARY KEY,
    nombre TEXT,
    password TEXT,
    grupo INTEGER,
    admin NUMERIC,
    FOREIGN KEY (grupo) REFERENCES grupos(id_grupo)
);

CREATE TABLE IF NOT EXISTS mensajes (
    id_mensaje INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha_hora TEXT,
    grupo INTEGER,
    usuario TEXT,
    texto TEXT,
    FOREIGN KEY (grupo) REFERENCES grupos(id_grupo),
    FOREIGN KEY (usuario) REFERENCES usuarios(usuario)
);
