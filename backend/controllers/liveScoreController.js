// controllers/liveScoreController.js
const Match = require('../models/matchModel'); // adjust filename
const { getIo } = require('../socket');

exports.addBall = async (req, res) => {
  try {
    const matchId = req.params.id;
    const event = req.body;
    if (!matchId) return res.status(400).json({ message: 'matchId required' });

    // Basic validation
    if (typeof event.over !== 'number' || typeof event.ball !== 'number') {
      return res.status(400).json({ message: 'over and ball must be numbers' });
    }

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    // Compute runs
    const runs = Number(event.runs || 0) + Number((event.extras && event.extras.runs) || 0);
    const update = { $push: { events: event } };
    const inc = {};
    const battingTeam = event.battingTeam || event.battingSide;

    if (battingTeam === 'teamA' || String(battingTeam) === String(match.teamA)) {
      inc['score.teamA.runs'] = runs;
      if (event.wicket) inc['score.teamA.wickets'] = 1;
    } else {
      inc['score.teamB.runs'] = runs;
      if (event.wicket) inc['score.teamB.wickets'] = 1;
    }
    if (Object.keys(inc).length) update.$inc = inc;

    const updated = await Match.findByIdAndUpdate(matchId, update, { new: true });

    // Broadcast via socket if available
    try {
      const io = getIo();
      io.to(`match:${matchId}`).emit('ball-event', { event, match: updated });
    } catch (err) {
      // socket not initialized or other socket error - ignore, we still respond OK
      console.warn('Socket broadcast skipped:', err.message);
    }

    return res.json({ success: true, match: updated });
  } catch (err) {
    console.error('addBall error', err);
    return res.status(500).json({ message: err.message });
  }
};
