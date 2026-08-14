const express = require("express");
const { listProfiles, createProfile, updateProfile, deleteProfile } = require("../controllers/profileController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", listProfiles);
router.post("/", createProfile);
router.patch("/:id", updateProfile);
router.delete("/:id", deleteProfile);

module.exports = router;
