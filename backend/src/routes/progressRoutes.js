const express = require("express");
const { getProgress, upsertProgress } = require("../controllers/progressController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/:profileId", getProgress);
router.put("/:profileId/:movieId", upsertProgress);

module.exports = router;
