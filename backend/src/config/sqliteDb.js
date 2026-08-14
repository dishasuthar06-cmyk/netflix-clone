const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const crypto = require("crypto");

const dbPath = path.join(__dirname, "../../netflix_clone.db");
const db = new sqlite3.Database(dbPath);

let initPromise = null;

function initTables() {
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("PRAGMA foreign_keys = ON;");
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS profiles (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          is_kids INTEGER NOT NULL DEFAULT 0,
          avatar_seed TEXT DEFAULT 'default',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS movies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'movie',
          year INTEGER NOT NULL,
          rating REAL NOT NULL DEFAULT 0,
          duration TEXT,
          director TEXT,
          cast TEXT DEFAULT '[]',
          genres TEXT DEFAULT '[]',
          description TEXT,
          poster_url TEXT,
          is_kid_safe INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS my_list (
          id TEXT PRIMARY KEY,
          profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
          added_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE (profile_id, movie_id)
        );
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS watch_progress (
          id TEXT PRIMARY KEY,
          profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
          progress_pct REAL NOT NULL DEFAULT 0,
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE (profile_id, movie_id)
        );
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  return initPromise;
}

function formatRow(row) {
  if (!row) return row;
  const formatted = { ...row };
  if (typeof formatted.genres === "string") {
    try {
      formatted.genres = JSON.parse(formatted.genres);
    } catch (_) {
      formatted.genres = [];
    }
  }
  if (typeof formatted.cast === "string") {
    try {
      formatted.cast = JSON.parse(formatted.cast);
    } catch (_) {
      formatted.cast = [];
    }
  }
  if (formatted.is_kids !== undefined) {
    formatted.is_kids = Boolean(formatted.is_kids);
  }
  if (formatted.is_kid_safe !== undefined) {
    formatted.is_kid_safe = Boolean(formatted.is_kid_safe);
  }
  if (formatted.rating !== undefined) {
    formatted.rating = Number(formatted.rating);
  }
  return formatted;
}

async function query(sql, params = []) {
  await initTables();

  let adaptedSql = sql.trim();
  let adaptedParams = [...params];

  // 1. Replace Postgres now() with datetime('now')
  adaptedSql = adaptedSql.replace(/\bnow\(\)/gi, "datetime('now')");

  // 2. Replace $X = ANY(genres) with genres LIKE '%' || $X || '%'
  adaptedSql = adaptedSql.replace(/\$(\d+)\s*=\s*ANY\(genres\)/gi, (match, p1) => {
    return `genres LIKE '%' || $${p1} || '%'`;
  });

  // 3. Replace ILIKE with LIKE
  adaptedSql = adaptedSql.replace(/\bILIKE\b/g, "LIKE");

  // Replace unquoted cast keyword with "cast"
  adaptedSql = adaptedSql.replace(/(?<!["\w])cast(?!["\w])/gi, '"cast"');

  // 4. Auto-generate UUID if inserting into users, profiles, my_list, watch_progress without id column
  const insertMatch = adaptedSql.match(/^INSERT INTO\s+(users|profiles|my_list|watch_progress)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
  if (insertMatch) {
    const tableName = insertMatch[1];
    const colList = insertMatch[2];
    const valList = insertMatch[3];
    const cols = colList.split(",").map((c) => c.trim().toLowerCase());

    if (!cols.includes("id")) {
      const newUuid = crypto.randomUUID();
      adaptedSql = adaptedSql.replace(
        /^INSERT INTO\s+(users|profiles|my_list|watch_progress)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i,
        () => `INSERT INTO ${tableName} (id, ${colList}) VALUES (?, ${valList})`
      );
      adaptedParams.unshift(newUuid);
    }
  }

  // 5. Convert remaining $1, $2, $3... placeholders to ?
  adaptedSql = adaptedSql.replace(/\$\d+/g, "?");

  // Serialize array and boolean params
  adaptedParams = adaptedParams.map((p) => {
    if (Array.isArray(p)) return JSON.stringify(p);
    if (typeof p === "boolean") return p ? 1 : 0;
    return p;
  });

  // Handle RETURNING clause if present
  let returningClause = null;
  const returningMatch = adaptedSql.match(/\s+RETURNING\s+(.+)$/i);
  if (returningMatch) {
    returningClause = returningMatch[1].trim();
    adaptedSql = adaptedSql.replace(/\s+RETURNING\s+.+$/i, "");
  }

  return new Promise((resolve, reject) => {
    const isSelect = /^SELECT/i.test(adaptedSql);

    if (isSelect) {
      db.all(adaptedSql, adaptedParams, (err, rows) => {
        if (err) return reject(err);
        const formattedRows = (rows || []).map(formatRow);
        resolve({ rows: formattedRows });
      });
    } else {
      db.run(adaptedSql, adaptedParams, function (err) {
        if (err) return reject(err);
        const lastID = this.lastID;
        const changes = this.changes;

        if (returningClause) {
          let selectSql = "";
          let selectParams = [];
          const upperSql = adaptedSql.toUpperCase();
          if (upperSql.includes("INTO MOVIES")) {
            selectSql = `SELECT * FROM movies WHERE id = ?`;
            selectParams = [lastID];
          } else if (upperSql.includes("INTO USERS")) {
            selectSql = `SELECT * FROM users WHERE id = ?`;
            selectParams = [adaptedParams[0]];
          } else if (upperSql.includes("INTO PROFILES")) {
            selectSql = `SELECT * FROM profiles WHERE id = ?`;
            selectParams = [adaptedParams[0]];
          } else if (upperSql.includes("INTO WATCH_PROGRESS")) {
            selectSql = `SELECT * FROM watch_progress WHERE profile_id = ? AND movie_id = ?`;
            selectParams = [adaptedParams[0], adaptedParams[1]];
          } else if (upperSql.includes("UPDATE MOVIES")) {
            const idParam = adaptedParams[adaptedParams.length - 1];
            selectSql = `SELECT * FROM movies WHERE id = ?`;
            selectParams = [idParam];
          } else if (upperSql.includes("UPDATE PROFILES")) {
            const idParam = adaptedParams[2];
            selectSql = `SELECT * FROM profiles WHERE id = ?`;
            selectParams = [idParam];
          } else if (upperSql.includes("DELETE FROM MOVIES") || upperSql.includes("DELETE FROM PROFILES")) {
            resolve({ rows: changes > 0 ? [{ id: adaptedParams[0] }] : [] });
            return;
          } else {
            resolve({ rows: changes > 0 ? [{ id: lastID }] : [] });
            return;
          }

          db.all(selectSql, selectParams, (selectErr, rows) => {
            if (selectErr) return reject(selectErr);
            const formattedRows = (rows || []).map(formatRow);
            resolve({ rows: formattedRows });
          });
        } else {
          resolve({ rows: [], lastID, changes });
        }
      });
    }
  });
}

async function connect() {
  await initTables();
  return {
    query: (sql, params) => query(sql, params),
    release: () => {},
  };
}

function end() {
  return new Promise((resolve) => {
    db.close(() => resolve());
  });
}

module.exports = {
  query,
  connect,
  end,
};
