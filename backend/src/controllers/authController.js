const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { signToken } = require("../utils/jwt");

// POST /api/auth/signup
async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRes = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email, created_at",
      [name, email.toLowerCase(), passwordHash]
    );
    const user = userRes.rows[0];

    // Every new user gets a default profile
    const profileRes = await pool.query(
      "INSERT INTO profiles (user_id, name, is_kids) VALUES ($1,$2,false) RETURNING id, name, is_kids",
      [user.id, "Primary"]
    );

    const token = signToken({ sub: user.id, email: user.email });
    res.status(201).json({ token, user, profiles: profileRes.rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required." });
    }

    const userRes = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    const user = userRes.rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const profilesRes = await pool.query(
      "SELECT id, name, is_kids FROM profiles WHERE user_id = $1 ORDER BY created_at",
      [user.id]
    );

    const token = signToken({ sub: user.id, email: user.email });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
      profiles: profilesRes.rows,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function me(req, res, next) {
  try {
    const userRes = await pool.query("SELECT id, name, email, created_at FROM users WHERE id = $1", [req.user.id]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: "User not found." });

    const profilesRes = await pool.query(
      "SELECT id, name, is_kids FROM profiles WHERE user_id = $1 ORDER BY created_at",
      [req.user.id]
    );

    res.json({ user: userRes.rows[0], profiles: profilesRes.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, me };
