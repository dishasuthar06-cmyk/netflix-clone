const pool = require("../config/db");

// GET /api/movies?type=&genre=&kidsOnly=&page=&limit=
async function listMovies(req, res, next) {
  try {
    const { type, genre, kidsOnly, page = 1, limit = 24 } = req.query;
    const conditions = [];
    const values = [];

    if (type) {
      values.push(type);
      conditions.push(`type = $${values.length}`);
    }
    if (genre) {
      values.push(genre);
      conditions.push(`$${values.length} = ANY(genres)`);
    }
    if (kidsOnly === "true") {
      conditions.push("is_kid_safe = true");
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (Number(page) - 1) * Number(limit);

    values.push(Number(limit));
    values.push(offset);

    const query = `
      SELECT id, title, type, year, rating, duration, director, cast, genres,
             description, poster_url, is_kid_safe
      FROM movies
      ${where}
      ORDER BY id
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/movies/trending
async function trending(req, res, next) {
  try {
    const result = await pool.query("SELECT * FROM movies ORDER BY id LIMIT 12");
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/movies/popular
async function popular(req, res, next) {
  try {
    const result = await pool.query("SELECT * FROM movies ORDER BY rating DESC LIMIT 12");
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/movies/:id
async function getMovie(req, res, next) {
  try {
    const result = await pool.query("SELECT * FROM movies WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Movie not found." });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/movies  (catalog management)
async function createMovie(req, res, next) {
  try {
    const {
      title, type = "movie", year, rating = 0, duration, director,
      cast = [], genres = [], description, posterUrl, isKidSafe = false,
    } = req.body;

    if (!title || !year) {
      return res.status(400).json({ error: "title and year are required." });
    }

    const result = await pool.query(
      `INSERT INTO movies (title, type, year, rating, duration, director, cast, genres, description, poster_url, is_kid_safe)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [title, type, year, rating, duration, director, cast, genres, description, posterUrl, isKidSafe]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// PUT /api/movies/:id
async function updateMovie(req, res, next) {
  try {
    const { id } = req.params;
    const {
      title, type, year, rating, duration, director, cast, genres, description, posterUrl, isKidSafe,
    } = req.body;

    const result = await pool.query(
      `UPDATE movies SET
         title = COALESCE($1, title),
         type = COALESCE($2, type),
         year = COALESCE($3, year),
         rating = COALESCE($4, rating),
         duration = COALESCE($5, duration),
         director = COALESCE($6, director),
         cast = COALESCE($7, cast),
         genres = COALESCE($8, genres),
         description = COALESCE($9, description),
         poster_url = COALESCE($10, poster_url),
         is_kid_safe = COALESCE($11, is_kid_safe)
       WHERE id = $12
       RETURNING *`,
      [title, type, year, rating, duration, director, cast, genres, description, posterUrl, isKidSafe, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Movie not found." });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/movies/:id
async function deleteMovie(req, res, next) {
  try {
    const result = await pool.query("DELETE FROM movies WHERE id = $1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Movie not found." });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listMovies, trending, popular, getMovie, createMovie, updateMovie, deleteMovie };
