-- ============================================
-- Netflix Clone - Database Schema (PostgreSQL)
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------- Users ----------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Profiles (a user can have multiple, e.g. Kids profile) ----------
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(60) NOT NULL,
  is_kids     BOOLEAN NOT NULL DEFAULT false,
  avatar_seed VARCHAR(30) DEFAULT 'default',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Movies / TV shows ----------
CREATE TABLE IF NOT EXISTS movies (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  type        VARCHAR(10) NOT NULL DEFAULT 'movie' CHECK (type IN ('movie', 'tv')),
  year        INT NOT NULL,
  rating      NUMERIC(3,1) NOT NULL DEFAULT 0,
  duration    VARCHAR(20),
  director    VARCHAR(100),
  cast        TEXT[] DEFAULT '{}',
  genres      TEXT[] DEFAULT '{}',
  description TEXT,
  poster_url  TEXT,
  is_kid_safe BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movies_genres ON movies USING GIN (genres);
CREATE INDEX IF NOT EXISTS idx_movies_title_trgm ON movies USING GIN (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_movies_type ON movies (type);

-- ---------- My List (per profile) ----------
CREATE TABLE IF NOT EXISTS my_list (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  movie_id   INT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  added_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, movie_id)
);

-- ---------- Watch progress (per profile, resume / continue watching) ----------
CREATE TABLE IF NOT EXISTS watch_progress (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  movie_id     INT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  progress_pct NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, movie_id)
);
