const express = require("express");
const {
  listMovies, trending, popular, getMovie, createMovie, updateMovie, deleteMovie,
} = require("../controllers/movieController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Public browsing
router.get("/trending", trending);
router.get("/popular", popular);
router.get("/", listMovies);
router.get("/:id", getMovie);

// Catalog management (require auth — add an admin check here for production)
router.post("/", requireAuth, createMovie);
router.put("/:id", requireAuth, updateMovie);
router.delete("/:id", requireAuth, deleteMovie);

module.exports = router;
