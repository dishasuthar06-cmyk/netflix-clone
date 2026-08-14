const pool = require("../config/db");

// GET /api/profiles
async function listProfiles(req, res, next) {
  try {
    const result = await pool.query(
      "SELECT id, name, is_kids, avatar_seed FROM profiles WHERE user_id = $1 ORDER BY created_at",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/profiles
async function createProfile(req, res, next) {
  try {
    const { name, isKids = false } = req.body;
    if (!name) return res.status(400).json({ error: "name is required." });

    const result = await pool.query(
      "INSERT INTO profiles (user_id, name, is_kids) VALUES ($1,$2,$3) RETURNING id, name, is_kids",
      [req.user.id, name, isKids]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/profiles/:id
async function updateProfile(req, res, next) {
  try {
    const { id } = req.params;
    const { name, isKids } = req.body;

    const result = await pool.query(
      `UPDATE profiles SET
         name = COALESCE($1, name),
         is_kids = COALESCE($2, is_kids)
       WHERE id = $3 AND user_id = $4
       RETURNING id, name, is_kids`,
      [name ?? null, isKids ?? null, id, req.user.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Profile not found." });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/profiles/:id
async function deleteProfile(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM profiles WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Profile not found." });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listProfiles, createProfile, updateProfile, deleteProfile };
