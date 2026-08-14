const express = require("express");
const { getList, addToList, removeFromList } = require("../controllers/listController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/:profileId", getList);
router.post("/:profileId/:movieId", addToList);
router.delete("/:profileId/:movieId", removeFromList);

module.exports = router;
