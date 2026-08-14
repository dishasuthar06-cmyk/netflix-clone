require("dotenv").config();
const { Pool } = require("pg");

let activeDb = null;
let isPostgres = false;
let fallbackDb = null;
try {
  fallbackDb = require("./sqliteDb");
} catch (e) {
  console.warn("SQLite not available, using pure JS in-memory database:", e.message);
  fallbackDb = require("./jsMemoryDb");
}

if (process.env.USE_MEMORY_DB === "true" || (!process.env.DATABASE_URL && process.env.VERCEL)) {
  console.log("ℹ️ Using in-memory database engine for Vercel.");
  activeDb = require("./jsMemoryDb");
} else if (process.env.USE_SQLITE === "true") {
  console.log("ℹ️ USE_SQLITE=true: Using SQLite database.");
  activeDb = fallbackDb;
} else {
  const isLocalDb = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes("localhost") || process.env.DATABASE_URL.includes("127.0.0.1");
  const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/netflix_clone",
    connectionTimeoutMillis: 3000,
    ssl: isLocalDb ? false : { rejectUnauthorized: false },
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
        if (!isPostgres && (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND" || err.message.includes("connect") || err.message.includes("timeout"))) {
          // Switch to fallback database
          console.warn("⚠️ PostgreSQL connection failed. Using fallback database.");
          activeDb = fallbackDb;
          return fallbackDb.query(sql, params);
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
        console.warn("⚠️ PostgreSQL connection failed. Using fallback database.");
        activeDb = fallbackDb;
        return fallbackDb.connect();
      }
    },
    end: async () => {
      if (isPostgres) {
        return pgPool.end();
      }
      return fallbackDb.end();
    },
  };
}

module.exports = activeDb;
