const path = require("node:path");
const sqlite3 = require("sqlite3");

const archivoBD = path.join(__dirname, "practicaPPS.db");
const db = new sqlite3.Database(archivoBD, sqlite3.OPEN_READWRITE);

module.exports = db;