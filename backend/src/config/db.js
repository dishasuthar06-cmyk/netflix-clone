const { Pool } = require("pg");
const sqliteDb = require("./sqliteDb");
require("dotenv").config();

let activeDb = null;
let isPostgres = false;

if (process.env.USE_SQLITE === "true") {
  console.log("ℹ️ USE_SQLITE=true: Using SQLite database.");
  activeDb = sqliteDb;
} else {
  const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/netflix_clone",
    connectionTimeoutMillis: 1500,
  });

  // Proxy pool methods to support smooth fallback
  activeDb = {
    query: async (sql, params) => {
      if (isPostgres) {
        return pgPool.query(sql, params);
      }
      try {
        const res = await pgPool.query(sql, params);
        isPostgres = true;
        return res;
      } catch (err) {
        if (!isPostgres && (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND" || err.message.includes("connect"))) {
          // Switch to SQLite fallback
          console.warn("⚠️ PostgreSQL connection failed. Using local SQLite database (netflix_clone.db).");
          activeDb = sqliteDb;
          return sqliteDb.query(sql, params);
        }
        throw err;
      }
    },
    connect: async () => {
      if (isPostgres) {
        return pgPool.connect();
      }
      try {
        const client = await pgPool.connect();
        isPostgres = true;
        return client;
      } catch (err) {
        console.warn("⚠️ PostgreSQL connection failed. Using local SQLite database (netflix_clone.db).");
        activeDb = sqliteDb;
        return sqliteDb.connect();
      }
    },
    end: async () => {
      if (isPostgres) {
        return pgPool.end();
      }
      return sqliteDb.end();
    },
  };
}

module.exports = activeDb;
