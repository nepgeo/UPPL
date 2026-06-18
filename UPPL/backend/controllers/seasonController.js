// controllers/seasonController.js
const Season = require("../models/seasonModel");
const Team = require("../models/teamModel");

// ===============================
// Create a new season
// ===============================
exports.createSeason = async (req, res) => {
  try {
    const { seasonNumber, entryDeadline } = req.body;

    if (!seasonNumber || !entryDeadline) {
      return res.status(400).json({ message: "Season number and entry deadline are required" });
    }

    const existingSeason = await Season.findOne({ seasonNumber });
    if (existingSeason) {
      return res.status(400).json({ message: "Season already exists" });
    }

    const season = new Season({
      seasonNumber,
      entryDeadline: new Date(entryDeadline), // ensure valid Date
    });

    await season.save();
    res.status(201).json(season);
  } catch (error) {
    console.error("❌ Error creating season:", error);
    res.status(500).json({ message: "Error creating season", error: error.message });
  }
};

// ===============================
// Get all seasons (sorted latest first)
// ===============================
exports.getAllSeasons = async (req, res) => {
  try {
    const seasons = await Season.find().sort({ seasonNumber: -1 }).lean();
    res.json(seasons);
  } catch (error) {
    console.error("❌ Error fetching seasons:", error);
    res.status(500).json({ message: "Error fetching seasons", error: error.message });
  }
};

// ===============================
// Get season by ID
// ===============================
exports.getSeasonById = async (req, res) => {
  try {
    const season = await Season.findById(req.params.id)
      .populate("teams")
      .populate("matches")
      .lean();

    if (!season) return res.status(404).json({ message: "Season not found" });

    res.json(season);
  } catch (error) {
    console.error("❌ Error fetching season:", error);
    res.status(500).json({ message: "Error fetching season", error: error.message });
  }
};

// ===============================
// Update season (entryDeadline or seasonNumber)
// ===============================
exports.updateSeason = async (req, res) => {
  try {
    const { seasonNumber, entryDeadline } = req.body;

    const updateFields = {};
    if (seasonNumber !== undefined) updateFields.seasonNumber = seasonNumber;
    if (entryDeadline !== undefined) updateFields.entryDeadline = new Date(entryDeadline);

    const season = await Season.findByIdAndUpdate(req.params.id, updateFields, { new: true });

    if (!season) return res.status(404).json({ message: "Season not found" });

    res.json(season);
  } catch (error) {
    console.error("❌ Error updating season:", error);
    res.status(500).json({ message: "Error updating season", error: error.message });
  }
};

// ===============================
// Delete season
// ===============================
exports.deleteSeason = async (req, res) => {
  try {
    const season = await Season.findByIdAndDelete(req.params.id);
    if (!season) return res.status(404).json({ message: "Season not found" });

    res.json({ message: "✅ Season deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting season:", error);
    res.status(500).json({ message: "Error deleting season", error: error.message });
  }
};

// ===============================
// Set one season as current
// ===============================
exports.setCurrentSeason = async (req, res) => {
  try {
    const { id } = req.params;
    const { entryDeadline } = req.body;

    // Reset all seasons to not current
    await Season.updateMany({}, { isCurrent: false });

    const updatedFields = { isCurrent: true };
    if (entryDeadline) updatedFields.entryDeadline = new Date(entryDeadline);

    const updated = await Season.findByIdAndUpdate(id, updatedFields, { new: true });

    if (!updated) {
      return res.status(404).json({ message: "Season not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("❌ Error setting current season:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ===============================
// Get current active season
// ===============================
exports.getCurrentSeason = async (req, res) => {
  try {
    const currentSeason = await Season.findOne({ isCurrent: true }).lean();
    if (!currentSeason) {
      return res.status(404).json({ message: "No active season found" });
    }
    res.json(currentSeason);
  } catch (error) {
    console.error("🔥 getCurrentSeason Error:", error);
    res.status(500).json({ message: "Error fetching current season", error: error.message });
  }
};

// ===============================
// Get seasons with teams + players
// ===============================
exports.getSeasonsWithTeamsAndPlayers = async (req, res) => {
  try {
    const seasons = await Season.find().sort({ seasonNumber: -1 }).lean();
    const filteredSeasons = [];

    for (const season of seasons) {
      const teams = await Team.find({ seasonNumber: season._id })
        .populate("players.user") // full player user data
        .lean();

      // Only keep teams with at least one registered player
      const validTeams = teams.filter(team => team.players?.some(p => p.user));

      if (validTeams.length > 0) {
        filteredSeasons.push({
          ...season,
          teamCount: validTeams.length,
          teams: validTeams,
        });
      }
    }

    res.json(filteredSeasons);
  } catch (err) {
    console.error("❌ Failed to fetch filtered seasons:", err);
    res.status(500).json({ message: "Error loading filtered seasons", error: err.message });
  }
};

// ===============================
// Get teams with players by season ID
// ===============================
exports.getTeamsWithPlayersBySeason = async (req, res) => {
  try {
    const { seasonId } = req.params;

    const teams = await Team.find({ seasonNumber: seasonId })
      .populate("createdBy", "name email")
      .populate("players.user", "name email playerCode profileImage role documents position verified")
      .lean();

    res.json(teams);
  } catch (error) {
    console.error("❌ Error fetching teams with players:", error);
    res.status(500).json({ message: "Failed to fetch teams with players", error: error.message });
  }
};
