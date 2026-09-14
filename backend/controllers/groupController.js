const Team = require("../models/teamModel");
const Season = require("../models/seasonModel");
const Match = require("../models/matchModel");
const GroupSchedule = require("../models/groupScheduleModel");
const mongoose = require("mongoose");

// Utility: shuffle array randomly
function shuffleArray(array) {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

// ================== GROUPS ==================

// POST /api/groups/generate/:seasonId
const generateGroups = async (req, res) => {
  try {
    const { seasonId } = req.params;
    console.log(
      "📩 generateGroups called for seasonId:",
      seasonId,
      "by user:",
      req.user?.id,
      req.user?.role
    );

    if (!seasonId || !mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({ success: false, message: "Invalid season ID" });
    }

    const season = await Season.findById(seasonId);
    if (!season) {
      return res.status(404).json({ success: false, message: "Season not found" });
    }

    const teams = await Team.find({ seasonNumber: seasonId, status: /^approved$/i })
      .select("_id teamName teamCode")
      .lean();

    if (!teams || teams.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Not enough approved teams to form groups",
      });
    }

    const shuffled = shuffleArray(teams);
    const groups = [];

    // First group gets 4 teams
    groups.push({
      groupName: "A",
      teams: shuffled.slice(0, 4).map((t) => ({
        team: t._id,
        teamName: t.teamName,
        teamCode: t.teamCode,
      })),
    });

    // Remaining teams divided into 3 groups
    const remainingTeams = shuffled.slice(4);
    const groupNames = ["B", "C", "D"];
    const baseSize = Math.floor(remainingTeams.length / 3); // minimum size for each group
    let extra = remainingTeams.length % 3; // remainder to distribute

    let startIndex = 0;
    for (let i = 0; i < 3; i++) {
      let size = baseSize + (extra > 0 ? 1 : 0);
      extra--;
      const chunk = remainingTeams.slice(startIndex, startIndex + size);
      if (chunk.length > 0) {
        groups.push({
          groupName: groupNames[i],
          teams: chunk.map((t) => ({
            team: t._id,
            teamName: t.teamName,
            teamCode: t.teamCode,
          })),
        });
      }
      startIndex += size;
    }

    // Clear old group schedule
    await GroupSchedule.deleteMany({ seasonNumber: seasonId });

    const schedule = new GroupSchedule({
      seasonNumber: season._id,
      groups,
    });
    await schedule.save();

    season.groups = groups;
    await season.save();

    return res.json({
      success: true,
      message: "✅ Groups generated successfully",
      schedule,
      season,
    });
  } catch (err) {
    console.error("❌ Group generation failed:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};



// DELETE /api/groups/season/:seasonId
const deleteGroupsBySeason = async (req, res) => {
  try {
    const { seasonId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({ success: false, message: "Invalid season ID" });
    }

    await GroupSchedule.deleteMany({ seasonNumber: seasonId });
    await Season.findByIdAndUpdate(seasonId, { $unset: { groups: 1 } });

    return res.json({ success: true, message: "✅ Groups deleted successfully" });
  } catch (err) {
    console.error("❌ Failed to delete groups:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// ================== SEASON TIME ==================

// PATCH /api/seasons/:id/schedule-time
const setScheduleTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduleGenerationTime } = req.body;

    const season = await Season.findById(id);
    if (!season) return res.status(404).json({ success: false, message: "Season not found" });

    season.scheduleGenerationTime = new Date(scheduleGenerationTime);
    await season.save();

    return res.json({
      success: true,
      message: "✅ Schedule time set successfully",
      season,
    });
  } catch (err) {
    console.error("❌ Failed to set schedule time:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update schedule time",
      error: err.message,
    });
  }
};

// GET /api/schedule
// GET /api/groups/schedule
const getSchedule = async (req, res) => {
  try {
    console.log("📡 [getSchedule] Request received");

    let targetSeasonId = req.query.seasonId;

    // ✅ Step 1: Find target season (by query param or current active)
    let currentSeason;
    if (targetSeasonId) {
      currentSeason = await Season.findById(targetSeasonId);
    } else {
      currentSeason = await Season.findOne({ isCurrent: true });
    }

    if (!currentSeason) {
      console.warn("⚠️ No season found");
      return res.status(404).json({
        success: false,
        message: "No season found. Please create or mark a season as current.",
      });
    }

    console.log("📘 [getSchedule] Season ID:", currentSeason._id.toString());

    // ✅ Step 2: Find the schedule linked to the season
    const schedule = await GroupSchedule.findOne({ seasonNumber: currentSeason._id })
      .sort({ createdAt: -1 })
      .populate("seasonNumber")
      .populate({
        path: "groups.teams.team",
        select: "teamName teamLogo teamCode",
      });

    if (!schedule) {
      console.warn("⚠️ [getSchedule] No schedule found for this season:", currentSeason._id);
      return res.status(404).json({
        success: false,
        message: "No schedule found for the current season",
        season: currentSeason,
      });
    }

    console.log("✅ [getSchedule] Schedule found:", schedule._id);

    return res.json({
      success: true,
      message: "Schedule fetched successfully",
      schedule,
      season: currentSeason,
    });
  } catch (err) {
    console.error("❌ [getSchedule] Failed to fetch schedule:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};


// ================== MATCHES ==================

// POST /api/matches/generate/:seasonId
const generateLeagueMatches = async (req, res) => {
  try {
    const { seasonId } = req.params;
    console.log("📩 generateLeagueMatches called for seasonId:", seasonId, "by user:", req.user?.id, req.user?.role);

    let season;
    if (mongoose.Types.ObjectId.isValid(seasonId)) {
      season = await Season.findById(seasonId);
    } else if (!isNaN(seasonId)) {
      season = await Season.findOne({ seasonNumber: Number(seasonId) });
    } else {
      return res.status(400).json({ success: false, message: "Invalid season identifier" });
    }

    if (!season) {
      return res.status(404).json({ success: false, message: "Season not found" });
    }

    const schedule = await GroupSchedule.findOne({ seasonNumber: season._id })
      .populate({
        path: "groups.teams.team",
        model: "Team",
        select: "_id teamName teamCode teamLogo status",
      });

    // Remove old matches for this season
    await Match.deleteMany({
      seasonNumber: season._id,
      stage: { $in: ["league", "playoff", "final"] },
    });

    let matchesToInsert = [];
    let approvedTeams = [];

    if (schedule && schedule.groups?.length > 0) {
      for (const group of schedule.groups) {
        const groupTeamIds = group.teams
          .filter((t) => t?.team && /^approved$/i.test(t.team.status || ""))
          .map((t) => t.team._id.toString());

        approvedTeams.push(...groupTeamIds);

        for (let i = 0; i < groupTeamIds.length; i++) {
          for (let j = i + 1; j < groupTeamIds.length; j++) {
            matchesToInsert.push({
              seasonNumber: season._id,
              stage: "league",
              groupName: group.groupName,
              teamA: groupTeamIds[i],
              teamB: groupTeamIds[j],
              matchTime: new Date(),
              venue: "",
              result: "upcoming",
            });
          }
        }
      }
    } else {
      approvedTeams = await Team.find(
        { seasonNumber: season._id, status: /^approved$/i },
        "_id"
      ).then((teams) => teams.map((t) => t._id.toString()));
    }

    approvedTeams = [...new Set(approvedTeams.map((id) => id.toString()))];

    let matchNumber = 1;
    const savedLeagueMatches = [];
    for (const matchData of matchesToInsert) {
      const saved = await Match.create({
        ...matchData,
        matchNumber: matchNumber++,
      });
      savedLeagueMatches.push(saved);
    }

    // No auto playoff/final generation here
    season.teams = approvedTeams;
    season.matches = savedLeagueMatches.map((m) => m._id);
    await season.save();

    return res.json({
      success: true,
      message: "✅ League matches generated successfully",
      leagueMatches: savedLeagueMatches.length,
      totalMatches: savedLeagueMatches.length,
      season,
    });
  } catch (err) {
    console.error("❌ Failed to generate league matches:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// DELETE /api/matches/season/:seasonId
const deleteMatchesBySeason = async (req, res) => {
  try {
    const { seasonId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({ success: false, message: "Invalid season ID" });
    }

    await Match.deleteMany({ seasonNumber: seasonId });
    await Season.findByIdAndUpdate(seasonId, { $unset: { matches: 1 } });

    return res.json({ success: true, message: "✅ Matches deleted successfully" });
  } catch (err) {
    console.error("❌ Failed to delete matches:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// ================== APPROVED TEAMS ==================

// GET /api/teams/approved?seasonId=X
const getApprovedTeams = async (req, res) => {
  try {
    const { seasonId } = req.query;

    if (!seasonId || !mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({ success: false, message: "Invalid season ID" });
    }

    const season = await Season.findById(seasonId);
    if (!season) {
      return res.status(404).json({ success: false, message: "Season not found" });
    }

    const teams = await Team.find({ seasonNumber: seasonId, status: /^approved$/i })
      .select("_id teamName teamCode teamLogo")
      .lean();

    const schedule = await GroupSchedule.findOne({ seasonNumber: seasonId });
    const teamGroupMap = {};

    if (schedule && schedule.groups) {
      for (const group of schedule.groups) {
        for (const t of group.teams) {
          const teamId = t.team?.toString() || t.team;
          teamGroupMap[teamId] = group.groupName;
        }
      }
    }

    const teamsWithAssignment = teams.map((t) => ({
      ...t,
      assignedGroup: teamGroupMap[t._id.toString()] || null,
    }));

    return res.json({ success: true, teams: teamsWithAssignment });
  } catch (err) {
    console.error("❌ Failed to fetch approved teams:", err);
    res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
};

// ================== GROUP CRUD ==================

// POST /api/groups/:seasonId/groups
const createGroup = async (req, res) => {
  try {
    const { seasonId } = req.params;
    const { groupName, teamIds } = req.body;

    if (!seasonId || !mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({ success: false, message: "Invalid season ID" });
    }

    const season = await Season.findById(seasonId);
    if (!season) {
      return res.status(404).json({ success: false, message: "Season not found" });
    }

    let schedule = await GroupSchedule.findOne({ seasonNumber: seasonId });
    if (!schedule) {
      schedule = new GroupSchedule({ seasonNumber: seasonId, groups: [] });
    }

    const existingNames = schedule.groups.map((g) => g.groupName);
    let finalGroupName = groupName;
    if (!finalGroupName) {
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      for (let i = 0; i < alphabet.length; i++) {
        if (!existingNames.includes(alphabet[i])) {
          finalGroupName = alphabet[i];
          break;
        }
      }
      if (!finalGroupName) {
        return res.status(400).json({ success: false, message: "Maximum groups (26) reached" });
      }
    } else {
      if (existingNames.includes(finalGroupName)) {
        return res.status(400).json({ success: false, message: `Group ${finalGroupName} already exists` });
      }
    }

    let teamsData = [];
    if (teamIds && teamIds.length > 0) {
      const teams = await Team.find({
        _id: { $in: teamIds },
        seasonNumber: seasonId,
        status: /^approved$/i,
      }).lean();

      if (teams.length !== teamIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more teams are not approved or do not belong to this season",
        });
      }

      const assignedTeamIds = new Set();
      for (const g of schedule.groups) {
        for (const t of g.teams) {
          assignedTeamIds.add(t.team?.toString() || t.team);
        }
      }

      const alreadyAssigned = teamIds.filter((id) => assignedTeamIds.has(id));
      if (alreadyAssigned.length > 0) {
        return res.status(400).json({
          success: false,
          message: "One or more teams are already assigned to another group",
        });
      }

      teamsData = teams.map((t) => ({
        team: t._id,
        teamName: t.teamName,
        teamCode: t.teamCode,
      }));
    }

    schedule.groups.push({ groupName: finalGroupName, teams: teamsData });
    await schedule.save();

    season.groups = schedule.groups.map((g) => ({
      groupName: g.groupName,
      teams: g.teams.map((t) => ({
        team: t.team,
        teamName: t.teamName,
        teamCode: t.teamCode,
      })),
    }));
    await season.save();

    return res.json({
      success: true,
      message: `Group ${finalGroupName} created successfully`,
      schedule,
    });
  } catch (err) {
    console.error("❌ Failed to create group:", err);
    res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
};

// PUT /api/groups/:seasonId/groups/:groupName
const updateGroup = async (req, res) => {
  try {
    const { seasonId, groupName } = req.params;
    const { newName, addTeam, removeTeam } = req.body;

    if (!seasonId || !mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({ success: false, message: "Invalid season ID" });
    }

    const season = await Season.findById(seasonId);
    if (!season) {
      return res.status(404).json({ success: false, message: "Season not found" });
    }

    const schedule = await GroupSchedule.findOne({ seasonNumber: seasonId });
    if (!schedule) {
      return res.status(404).json({ success: false, message: "No groups found for this season" });
    }

    const groupIndex = schedule.groups.findIndex((g) => g.groupName === groupName);
    if (groupIndex === -1) {
      return res.status(404).json({ success: false, message: `Group ${groupName} not found` });
    }

    const group = schedule.groups[groupIndex];

    if (newName && newName !== groupName) {
      const existingNames = schedule.groups.map((g) => g.groupName);
      if (existingNames.includes(newName)) {
        return res.status(400).json({ success: false, message: `Group ${newName} already exists` });
      }
      schedule.groups[groupIndex].groupName = newName;
    }

    if (addTeam) {
      const team = await Team.findOne({
        _id: addTeam,
        seasonNumber: seasonId,
        status: /^approved$/i,
      }).lean();

      if (!team) {
        return res.status(400).json({ success: false, message: "Team not found or not approved" });
      }

      for (const g of schedule.groups) {
        if (g.groupName === (newName || groupName)) continue;
        const found = g.teams.find((t) => (t.team?.toString() || t.team) === addTeam);
        if (found) {
          return res.status(400).json({
            success: false,
            message: "Team is already assigned to another group",
          });
        }
      }

      const alreadyInGroup = group.teams.find(
        (t) => (t.team?.toString() || t.team) === addTeam
      );
      if (alreadyInGroup) {
        return res.status(400).json({ success: false, message: "Team is already in this group" });
      }

      schedule.groups[groupIndex].teams.push({
        team: team._id,
        teamName: team.teamName,
        teamCode: team.teamCode,
      });
    }

    if (removeTeam) {
      const teamIdx = group.teams.findIndex(
        (t) => (t.team?.toString() || t.team) === removeTeam
      );
      if (teamIdx === -1) {
        return res.status(400).json({ success: false, message: "Team not found in this group" });
      }
      schedule.groups[groupIndex].teams.splice(teamIdx, 1);
    }

    await schedule.save();

    season.groups = schedule.groups.map((g) => ({
      groupName: g.groupName,
      teams: g.teams.map((t) => ({
        team: t.team,
        teamName: t.teamName,
        teamCode: t.teamCode,
      })),
    }));
    await season.save();

    return res.json({ success: true, message: "Group updated successfully", schedule });
  } catch (err) {
    console.error("❌ Failed to update group:", err);
    res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
};

// DELETE /api/groups/:seasonId/groups/:groupName
const deleteGroup = async (req, res) => {
  try {
    const { seasonId, groupName } = req.params;
    const { deleteMatches } = req.query;

    if (!seasonId || !mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({ success: false, message: "Invalid season ID" });
    }

    const season = await Season.findById(seasonId);
    if (!season) {
      return res.status(404).json({ success: false, message: "Season not found" });
    }

    const schedule = await GroupSchedule.findOne({ seasonNumber: seasonId });
    if (!schedule) {
      return res.status(404).json({ success: false, message: "No groups found for this season" });
    }

    const groupIndex = schedule.groups.findIndex((g) => g.groupName === groupName);
    if (groupIndex === -1) {
      return res.status(404).json({ success: false, message: `Group ${groupName} not found` });
    }

    const matchCount = await Match.countDocuments({
      seasonNumber: seasonId,
      groupName: groupName,
      stage: "league",
    });

    if (matchCount > 0 && deleteMatches !== "true") {
      return res.status(409).json({
        success: false,
        hasMatches: true,
        matchCount,
        message: `${matchCount} matches exist for Group ${groupName}. Set deleteMatches=true to delete them.`,
      });
    }

    if (matchCount > 0 && deleteMatches === "true") {
      await Match.deleteMany({
        seasonNumber: seasonId,
        groupName: groupName,
        stage: "league",
      });
    }

    schedule.groups.splice(groupIndex, 1);
    await schedule.save();

    season.groups = schedule.groups.map((g) => ({
      groupName: g.groupName,
      teams: g.teams.map((t) => ({
        team: t.team,
        teamName: t.teamName,
        teamCode: t.teamCode,
      })),
    }));
    await season.save();

    return res.json({ success: true, message: `Group ${groupName} deleted successfully`, schedule });
  } catch (err) {
    console.error("❌ Failed to delete group:", err);
    res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
};

// ================== EXPORTS ==================
module.exports = {
  generateGroups,
  deleteGroupsBySeason,
  setScheduleTime,
  getSchedule,
  generateLeagueMatches,
  deleteMatchesBySeason,
  getApprovedTeams,
  createGroup,
  updateGroup,
  deleteGroup,
};
