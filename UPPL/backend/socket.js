// socket.js
const { Server } = require('socket.io');
const Match = require('./models/matchModel'); // adjust to actual filename: ./models/Match or ./models/matchModel
let io = null;

/**
 * initSocket(server, { allowedOrigins })
 * - call once after HTTP server is created
 */
function initSocket(server, opts = {}) {
  const allowedOrigins = opts.allowedOrigins || (process.env.FRONTEND_ORIGIN ? [process.env.FRONTEND_ORIGIN] : '*');

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET','POST'],
    },
    maxHttpBufferSize: 1e6
  });

  io.on('connection', (socket) => {
    console.log('⚡ socket connected', socket.id);

    // Clients join a match room to receive live updates
    socket.on('join-match', ({ matchId }) => {
      if (!matchId) return;
      socket.join(`match:${matchId}`);
      console.log(`${socket.id} joined match:${matchId}`);
    });

    socket.on('leave-match', ({ matchId }) => {
      if (!matchId) return;
      socket.leave(`match:${matchId}`);
    });

    /**
     * ball-event:
     * - Expected payload: { matchId, batsman, bowler, runs, extras, wicket, over, ball, battingTeam }
     * - This handler persists event to DB and broadcasts updated match state.
     */
    socket.on('ball-event', async (event) => {
      try {
        const { matchId } = event;
        if (!matchId) {
          socket.emit('error', { message: 'matchId required' });
          return;
        }

        // Basic server-side validation
        if (typeof event.over !== 'number' || typeof event.ball !== 'number') {
          socket.emit('error', { message: 'over and ball must be numeric' });
          return;
        }

        // Fetch match (ensure you have Match model with events[] and score{})
        const match = await Match.findById(matchId);
        if (!match) {
          socket.emit('error', { message: 'Match not found' });
          return;
        }

        // Compute runs to add (runs + extras.runs if present)
        const runs = Number(event.runs || 0) + Number((event.extras && event.extras.runs) || 0);

        const update = { $push: { events: event } };

        // Decide which team to increment — app expects either 'teamA'/'teamB' or you can use team IDs
        const battingTeam = event.battingTeam || event.battingSide || event.batting; // flexible
        const inc = {};
        if (!battingTeam) {
          // fallback: you might want to require battingTeam in the payload
        } else {
          // If payload contains literal 'teamA' or 'teamB'
          if (battingTeam === 'teamA' || String(battingTeam) === String(match.teamA)) {
            inc['score.teamA.runs'] = runs;
            if (event.wicket) inc['score.teamA.wickets'] = 1;
          } else {
            inc['score.teamB.runs'] = runs;
            if (event.wicket) inc['score.teamB.wickets'] = 1;
          }
        }

        if (Object.keys(inc).length) update.$inc = inc;

        // Atomic DB update + return new doc
        const updated = await Match.findByIdAndUpdate(matchId, update, { new: true });

        // Broadcast event + latest match snapshot to subscribed clients
        io.to(`match:${matchId}`).emit('ball-event', { event, match: updated });
      } catch (err) {
        console.error('socket ball-event error', err);
        socket.emit('error', { message: err.message || 'Server error' });
      }
    });

    socket.on('disconnect', () => {
      // optional cleanup / logging
      console.log('⚡ socket disconnected', socket.id);
    });
  });

  return io;
}

function getIo() {
  if (!io) throw new Error('Socket.io not initialized. Call initSocket(server) first.');
  return io;
}

module.exports = { initSocket, getIo };
