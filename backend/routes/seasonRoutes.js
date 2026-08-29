const express = require("express");
const router = express.Router();
const seasonController = require("../controllers/seasonController");
const { protect, requireAdminOrSuperAdmin } = require("../middleware/authMiddleware");

// ✅ Get current season (public)
router.get("/current", seasonController.getCurrentSeason);

// ✅ Get all seasons (public — needed for leaderboard dropdown)
router.get("/", seasonController.getAllSeasons);

router.use(protect);
router.use(requireAdminOrSuperAdmin);
// ✅ 🔄 NEW: Get seasons that have teams with players
router.get("/with-teams-and-players", protect, requireAdminOrSuperAdmin, seasonController.getSeasonsWithTeamsAndPlayers);

router.get("/:seasonId/teams-with-players", protect, requireAdminOrSuperAdmin, seasonController.getTeamsWithPlayersBySeason);


// ✅ Create a new season
router.post("/", seasonController.createSeason);

// ✅ Get a single season by ID
router.get("/:id", seasonController.getSeasonById);

// ✅ Update a season by ID
router.put("/:id", seasonController.updateSeason);

// ✅ Delete a season by ID
router.delete("/:id", seasonController.deleteSeason);

// ✅ Set current season — must be a different route!
router.put('/:id/set-current', seasonController.setCurrentSeason);



module.exports = router;
