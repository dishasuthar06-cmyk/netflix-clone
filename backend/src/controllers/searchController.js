const pool = require("../config/db");

// GET /api/search?q=&kidsOnly=
async function search(req, res, next) {
  try {
    const { q, kidsOnly } = req.query;
    if (!q || !q.trim()) {
      return res.json([]);
    }

    const conditions = ["(title ILIKE $1 OR $2 = ANY(genres))"];
    const values = [`%${q}%`, q];

    if (kidsOnly === "true") {
      conditions.push("is_kid_safe = true");
    }

    const result = await pool.query(
      `SELECT * FROM movies WHERE ${conditions.join(" AND ")} ORDER BY rating DESC LIMIT 40`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { search };
