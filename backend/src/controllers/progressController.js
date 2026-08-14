const pool = require("../config/db");

async function ownsProfile(userId, profileId) {
  const result = await pool.query("SELECT id FROM profiles WHERE id = $1 AND user_id = $2", [profileId, userId]);
  return result.rows.length > 0;
}

// GET /api/progress/:profileId
async function getProgress(req, res, next) {
  try {
    const { profileId } = req.params;
    if (!(await ownsProfile(req.user.id, profileId))) {
      return res.status(403).json({ error: "Not your profile." });
    }

    const result = await pool.query(
      `SELECT movie_id, progress_pct, updated_at FROM watch_progress
       WHERE profile_id = $1 AND progress_pct > 2 AND progress_pct < 98
       ORDER BY updated_at DESC`,
      [profileId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// PUT /api/progress/:profileId/:movieId  { progressPct }
async function upsertProgress(req, res, next) {
  try {
    const { profileId, movieId } = req.params;
    const { progressPct } = req.body;

    if (!(await ownsProfile(req.user.id, profileId))) {
      return res.status(403).json({ error: "Not your profile." });
    }
    if (progressPct == null || progressPct < 0 || progressPct > 100) {
      return res.status(400).json({ error: "progressPct must be between 0 and 100." });
    }

    const result = await pool.query(
      `INSERT INTO watch_progress (profile_id, movie_id, progress_pct)
       VALUES ($1,$2,$3)
       ON CONFLICT (profile_id, movie_id)
       DO UPDATE SET progress_pct = $3, updated_at = now()
       RETURNING profile_id, movie_id, progress_pct, updated_at`,
      [profileId, movieId, progressPct]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { getProgress, upsertProgress };
