const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT,
  DB_SSL,
} = process.env;

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: Number(DB_PORT) || 3306,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  ssl:
    DB_SSL === "true"
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
});

module.exports = pool;