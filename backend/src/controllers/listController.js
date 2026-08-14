const pool = require("../config/db");

async function ownsProfile(userId, profileId) {
  const result = await pool.query("SELECT id FROM profiles WHERE id = $1 AND user_id = $2", [profileId, userId]);
  return result.rows.length > 0;
}

// GET /api/lists/:profileId
async function getList(req, res, next) {
  try {
    const { profileId } = req.params;
    if (!(await ownsProfile(req.user.id, profileId))) {
      return res.status(403).json({ error: "Not your profile." });
    }

    const result = await pool.query(
      `SELECT m.* FROM my_list l
       JOIN movies m ON m.id = l.movie_id
       WHERE l.profile_id = $1
       ORDER BY l.added_at DESC`,
      [profileId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/lists/:profileId/:movieId
async function addToList(req, res, next) {
  try {
    const { profileId, movieId } = req.params;
    if (!(await ownsProfile(req.user.id, profileId))) {
      return res.status(403).json({ error: "Not your profile." });
    }

    await pool.query(
      `INSERT INTO my_list (profile_id, movie_id) VALUES ($1,$2)
       ON CONFLICT (profile_id, movie_id) DO NOTHING`,
      [profileId, movieId]
    );
    res.status(201).json({ added: true });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/lists/:profileId/:movieId
async function removeFromList(req, res, next) {
  try {
    const { profileId, movieId } = req.params;
    if (!(await ownsProfile(req.user.id, profileId))) {
      return res.status(403).json({ error: "Not your profile." });
    }

    await pool.query("DELETE FROM my_list WHERE profile_id = $1 AND movie_id = $2", [profileId, movieId]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getList, addToList, removeFromList };
