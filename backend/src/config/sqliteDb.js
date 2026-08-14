const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const crypto = require("crypto");

const os = require("os");
const dbPath = process.env.VERCEL
  ? ":memory:"
  : path.join(__dirname, "../../netflix_clone.db");

let db = null;
try {
  db = new sqlite3.Database(dbPath);
} catch (e) {
  console.warn("Falling back to in-memory SQLite DB:", e.message);
  db = new sqlite3.Database(":memory:");
}

let initPromise = null;

const GENRES = ["Action", "Comedy", "Horror", "Sci-Fi", "Drama", "Romance", "Thriller", "Animation"];
const WORDS = {
  Action: ["Die Hard", "Mad Max: Fury Road", "John Wick", "The Dark Knight", "Baahubali: The Beginning", "RRR"],
  Comedy: ["Superbad", "The Hangover", "3 Idiots", "Anchorman", "Hera Pheri", "Dumb and Dumber"],
  Horror: ["The Shining", "Hereditary", "Tumbbad", "A Quiet Place", "Stree", "Halloween"],
  "Sci-Fi": ["Inception", "Interstellar", "Blade Runner 2049", "The Matrix", "Koi... Mil Gaya", "Dune"],
  Drama: ["The Shawshank Redemption", "Forrest Gump", "Dangal", "Good Will Hunting", "Taare Zameen Par", "12 Years a Slave"],
  Romance: ["The Notebook", "La La Land", "Titanic", "Dilwale Dulhania Le Jayenge", "Jab We Met", "About Time"],
  Thriller: ["Se7en", "Gone Girl", "Andhadhun", "Shutter Island", "Drishyam", "No Country for Old Men"],
  Animation: ["Spirited Away", "Toy Story", "Coco", "Inside Out", "The Lion King", "Up"],
};

const POSTER_MAP = {
  "Die Hard": "https://m.media-amazon.com/images/M/MV5BNjg0NjU5MTE0MV5BMl5BanBnXkFtZTgwNTUxNDQxMDE@._V1_SX300.jpg",
  "Mad Max: Fury Road": "https://m.media-amazon.com/images/M/MV5BN2EwM2I5OWMtMGQyMi00Zjg1LWJkNTctZTdjYTA4OGUwZjMyXkEyXkFqcGc@._V1_SX300.jpg",
  "John Wick": "https://m.media-amazon.com/images/M/MV5BMTU2NjA1ODgzMF5BMl5BanBnXkFtZTgwMTM2MTI4MjE@._V1_SX300.jpg",
  "The Dark Knight": "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg",
  "Baahubali: The Beginning": "https://m.media-amazon.com/images/M/MV5BYWVlMjVhZWYtNWViNC00ODFkLTk1MmItYjU1MDY5ZDdhMTU3XkEyXkFqcGc@._V1_SX300.jpg",
  "RRR": "https://m.media-amazon.com/images/M/MV5BODUwNDNjYzctODUxNy00ZTA2LWIyYTEtMDc5Y2E5ZjBmNTMzXkEyXkFqcGc@._V1_SX300.jpg",
  "Superbad": "https://m.media-amazon.com/images/M/MV5BMTc0NjIyNDExMV5BMl5BanBnXkFtZTcwMzQ3MTc1MQ@@._V1_SX300.jpg",
  "The Hangover": "https://m.media-amazon.com/images/M/MV5BNGQwZjg5YmYtY2VkNC00NzliLTljYTctNzI5NmU3MjE2ODQzXkEyXkFqcGc@._V1_SX300.jpg",
  "3 Idiots": "https://m.media-amazon.com/images/M/MV5BNTkyOGVjMGEtNmQzZi00NzFlLTlhOWQtODYyMDc2ZGJmYzFhXkEyXkFqcGc@._V1_SX300.jpg",
  "Anchorman": "https://m.media-amazon.com/images/M/MV5BMTQ2MzYwMzk5Ml5BMl5BanBnXkFtZTcwOTI4NzUyMw@@._V1_SX300.jpg",
  "Hera Pheri": "https://m.media-amazon.com/images/M/MV5BNmU4MmVjZGUtODc0ZC00MjgzLWFmOTQtOGRhNjg3MGVkOTM3XkEyXkFqcGc@._V1_SX300.jpg",
  "Dumb and Dumber": "https://m.media-amazon.com/images/M/MV5BZDQwMjNiMTQtY2UwYy00NjhiLTg0ZWEtZWM5ZmMxNDMKZWQ2XkEyXkFqcGc@._V1_SX300.jpg",
  "The Shining": "https://m.media-amazon.com/images/M/MV5BNmM5ZjgxY2ItMGVlNy00MTk4LTg2YjQtZjg4NTA3MmNmODc2XkEyXkFqcGc@._V1_SX300.jpg",
  "Hereditary": "https://m.media-amazon.com/images/M/MV5BOTU5MDg3OGItZWQ1Ny00ZGVmLTg2YTUtMzBkYzQ1YWIwZjlhXkEyXkFqcGc@._V1_SX300.jpg",
  "Tumbbad": "https://m.media-amazon.com/images/M/MV5BYmQxNmU4AC00NDRhLTk1YjEtOTY0ZDFkNDQwYmE0XkEyXkFqcGc@._V1_SX300.jpg",
  "A Quiet Place": "https://m.media-amazon.com/images/M/MV5BMjI0MDMzNTQ0M15BMl5BanBnXkFtZTgwMTM5NzM3NDM@._V1_SX300.jpg",
  "Stree": "https://m.media-amazon.com/images/M/MV5BNWExYzQyMTQtYmNjMS00ZTFjLWE5MGItMDlhMDBlNmI0YzcyXkEyXkFqcGc@._V1_SX300.jpg",
  "Halloween": "https://m.media-amazon.com/images/M/MV5BNzk1OGU2NmMtNTdhZC00NjdlLWE5YTMtZTQ0MGExZTQzOGQyXkEyXkFqcGc@._V1_SX300.jpg",
  "Inception": "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
  "Interstellar": "https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_SX300.jpg",
  "Blade Runner 2049": "https://m.media-amazon.com/images/M/MV5BNzA1Njg4NzYxOV5BMl5BanBnXkFtZTgwODk5NjU3MzI@._V1_SX300.jpg",
  "The Matrix": "https://m.media-amazon.com/images/M/MV5BN2NmN2VhMTQtMDNiOS00NDlhLTliMjgtODE2ZTY0ODQyNDRhXkEyXkFqcGc@._V1_SX300.jpg",
  "Koi... Mil Gaya": "https://m.media-amazon.com/images/M/MV5BMWE3YjRiOGItMDY2Mi00MTNkLWIxYzItZTVlMjRiY2I0OGViXkEyXkFqcGc@._V1_SX300.jpg",
  "Dune": "https://m.media-amazon.com/images/M/MV5BMDQ0NjgyN2YtNWVmYi00YDRmLWE5YzItNWVkM2ExY2Q3ZDM2XkEyXkFqcGc@._V1_SX300.jpg",
  "The Shawshank Redemption": "https://m.media-amazon.com/images/M/MV5BMDAyY2FhYjctNDc5OS00MDNlLThiMGUtYTEzNTAyOTFCYjA3XkEyXkFqcGc@._V1_SX300.jpg",
  "Forrest Gump": "https://m.media-amazon.com/images/M/MV5BNDYwNzVjMTItZmU5YS00YjQ5LTljYjgtMjY2NDVmYWMyNWFmXkEyXkFqcGc@._V1_SX300.jpg",
  "Dangal": "https://m.media-amazon.com/images/M/MV5BMTQ4MzQzMzM2Nl5BMl5BanBnXkFtZTgwMTQ1NzU3MDI@._V1_SX300.jpg",
  "Good Will Hunting": "https://m.media-amazon.com/images/M/MV5BOGZhZDIzNWMtNjkxMS00NWQ5LThjNYtNWY1NDVmOTU3ZGY2XkEyXkFqcGc@._V1_SX300.jpg",
  "Taare Zameen Par": "https://m.media-amazon.com/images/M/MV5BMDhjZWViN2MtNzgxNy00NmI5LWFmZTAtMjExNDQxZjU1NDY0XkEyXkFqcGc@._V1_SX300.jpg",
  "12 Years a Slave": "https://m.media-amazon.com/images/M/MV5BMjExMTEzODkyN15BMl5BanBnXkFtZTcwNTU4NTc4OQ@@._V1_SX300.jpg",
  "The Notebook": "https://m.media-amazon.com/images/M/MV5BMTk3OTM5Njg5M15BMl5BanBnXkFtZTYwMzA0ODI3._V1_SX300.jpg",
  "La La Land": "https://m.media-amazon.com/images/M/MV5BMzUzNDM2NzM2MV5BMl5BanBnXkFtZTgwNTM3NTg4OTE@._V1_SX300.jpg",
  "Titanic": "https://m.media-amazon.com/images/M/MV5BYzYyN2FiZmItY2Y0Ni00NDAzLTg5N2MtODE3ZDRiNjE1M2JlXkEyXkFqcGc@._V1_SX300.jpg",
  "Dilwale Dulhania Le Jayenge": "https://m.media-amazon.com/images/M/MV5BMDQ2ZmE2NTMtZDE3NC00YzFjLWJhNmEtNDE0OGQ0YjMyN2NmXkEyXkFqcGc@._V1_SX300.jpg",
  "Jab We Met": "https://m.media-amazon.com/images/M/MV5BYzA2YzIwODUtY2JhZi00ZDUxLWIzODEtYjYyMDc4MDJmNjE1XkEyXkFqcGc@._V1_SX300.jpg",
  "About Time": "https://m.media-amazon.com/images/M/MV5BMTA1ODUzMDA3NzFeQTJeQWpwZ15BbWU3MDkxMTYxNTk@._V1_SX300.jpg",
  "Se7en": "https://m.media-amazon.com/images/M/MV5BY2IzNzMxZjctZjUxZi00YzAxLTk3ZjMtYzFjNzExMTUxZDUwXkEyXkFqcGc@._V1_SX300.jpg",
  "Gone Girl": "https://m.media-amazon.com/images/M/MV5BMTk0MDQ3OTAzOV5BMl5BanBnXkFtZTgwNzU1NzE3MjE@._V1_SX300.jpg",
  "Andhadhun": "https://m.media-amazon.com/images/M/MV5BNmVhNWVlOTYtMGEzNy00OWVmLWE5ZTgtNmNmNDBiZTM3NWRmXkEyXkFqcGc@._V1_SX300.jpg",
  "Shutter Island": "https://m.media-amazon.com/images/M/MV5BN2FjNWExZjEtYjc4Yi00NmYxLWFmOGEtMzdjMzVkNmVhNmFlXkEyXkFqcGc@._V1_SX300.jpg",
  "Drishyam": "https://m.media-amazon.com/images/M/MV5BMDRlZWFkMjEtYmYyZi00MmE5LWIzMzUtYmM2N2M5Y2UxZDJjXkEyXkFqcGc@._V1_SX300.jpg",
  "No Country for Old Men": "https://m.media-amazon.com/images/M/MV5BMjA5Njk3MjM4OV5BMl5BanBnXkFtZTcwMTc5MTE1MQ@@._V1_SX300.jpg",
  "Spirited Away": "https://m.media-amazon.com/images/M/MV5BNTEyNmEwOWUtYzkyOC00ZTQ4LTllZmUtMjk0Y2YwOGUzYjRiXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg",
  "Toy Story": "https://m.media-amazon.com/images/M/MV5BZTA3OWVjOWItNjE1NS00NzZiLWE1MjgtZDZhMWI1ZTlkNzYwXkEyXkFqcGc@._V1_SX300.jpg",
  "Coco": "https://m.media-amazon.com/images/M/MV5BMDIyM2E2NTAtMzlhNy00ZGUxLWI1NjgtZDY5MzhiMDc5NGU3XkEyXkFqcGc@._V1_QL75_UY562_CR7,0,380,562_.jpg",
  "Inside Out": "https://m.media-amazon.com/images/M/MV5BOTgxMDQwMDk0OF5BMl5BanBnXkFtZTgwNjU5OTg2NDE@._V1_SX300.jpg",
  "The Lion King": "https://m.media-amazon.com/images/M/MV5BZGRiZDZhZjItM2M3ZC00Y2IyLTk3Y2MtMWY5YjliNDFkZTJlXkEyXkFqcGc@._V1_SX300.jpg",
  "Up": "https://m.media-amazon.com/images/M/MV5BNmI1ZTc5MWMtMDYyOS00ZDc2LTkzOTAtNjQ4NWIxNjYyNDgzXkEyXkFqcGc@._V1_SX300.jpg"
};

const CAST_POOL = ["A. Marlow", "R. Achebe", "J. Vance", "N. Okafor", "T. Reyes", "S. Lindqvist", "M. Duarte", "K. Halvorsen"];

function titleFor(g, n) {
  const list = WORDS[g] || ["Untitled"];
  return list[n % list.length] + (n >= list.length ? ` ${Math.floor(n / list.length) + 1}` : "");
}

function autoSeedData() {
  return new Promise((resolve) => {
    db.get("SELECT COUNT(*) as count FROM movies", (err, row) => {
      if (!err && row && row.count === 0) {
        const stmt = db.prepare(`
          INSERT INTO movies (title, type, year, rating, duration, director, cast, genres, description, poster_url, is_kid_safe)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        let id = 1;
        GENRES.forEach((g) => {
          for (let i = 0; i < 6; i++) {
            const genres = [g, GENRES[(GENRES.indexOf(g) + 1 + i) % GENRES.length]];
            const title = titleFor(g, i);
            const type = id % 5 === 0 ? "tv" : "movie";
            const year = 2016 + ((id * 7) % 9);
            const rating = Number((6.2 + ((id * 13) % 38) / 10).toFixed(1));
            const duration = `${1 + (id % 2)}h ${10 + ((id * 3) % 45)}m`;
            const director = CAST_POOL[id % CAST_POOL.length];
            const cast = JSON.stringify([CAST_POOL[id % CAST_POOL.length], CAST_POOL[(id + 2) % CAST_POOL.length], CAST_POOL[(id + 4) % CAST_POOL.length]]);
            const desc = `A ${g.toLowerCase()} story of ambition, loss, and the choices that follow. Set across three cities and ten years.`;
            const poster = POSTER_MAP[title] || null;
            const isKidSafe = genres.includes("Animation") || genres.includes("Comedy") ? 1 : 0;

            stmt.run([title, type, year, rating, duration, director, cast, JSON.stringify(genres), desc, poster, isKidSafe]);
            id++;
          }
        });
        stmt.finalize();

        // Seed default demo user
        const bcrypt = require("bcryptjs");
        const hash = bcrypt.hashSync("password123", 10);
        const userId = crypto.randomUUID();
        db.run("INSERT OR IGNORE INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)", [
          userId, "Demo User", "demo@example.com", hash
        ], () => {
          db.run("INSERT OR IGNORE INTO profiles (id, user_id, name, is_kids) VALUES (?, ?, ?, ?)", [crypto.randomUUID(), userId, "Primary", 0]);
          db.run("INSERT OR IGNORE INTO profiles (id, user_id, name, is_kids) VALUES (?, ?, ?, ?)", [crypto.randomUUID(), userId, "Kids", 1], () => {
            resolve();
          });
        });
      } else {
        resolve();
      }
    });
  });
}

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
      `, async (err) => {
        if (err) reject(err);
        else {
          await autoSeedData();
          resolve();
        }
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
