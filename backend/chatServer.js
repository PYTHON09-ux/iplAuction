/**
 * chatServer.js
 *
 * Attaches Socket.IO to your existing Express HTTP server.
 * Usage in your server entry point (e.g. server.js or index.js):
 *
 *   const http    = require('http');
 *   const app     = require('./api/index');          // your existing express app
 *   const { attachChat } = require('./chatServer');
 *
 *   const server = http.createServer(app);
 *   attachChat(server);
 *   server.listen(process.env.PORT || 4000);
 *
 * If you are deploying to Vercel (serverless), WebSockets won't work there.
 * You'll need a separate long-running process (Railway, Render, Fly.io, etc.)
 * just for the Socket.IO server, or use Vercel's Edge runtime with Ably/Pusher.
 * The simplest path: keep your REST API on Vercel and run THIS file on Railway/Render.
 */

const { Server } = require('socket.io');
const ChatMessage = require('./models/ChatMessage');

/* ── Colour palette for guests ── */
const GUEST_COLORS = [
  '#38d9f5', '#16d975', '#f5a623', '#c084fc',
  '#f87171', '#34d399', '#60a5fa', '#fbbf24',
  '#a78bfa', '#fb923c', '#4ade80', '#e879f9',
];

/* Per-room state: Map<eventToken, Map<socketId, { name, colorIndex }>> */
const rooms = new Map();

/* Simple profanity list (extend as needed) */
const BAD_WORDS = ['spam', 'abuse']; // keep light; replace with a proper lib if needed
function sanitize(text) {
  let out = text.trim().slice(0, 400);
  BAD_WORDS.forEach(w => {
    out = out.replace(new RegExp(w, 'gi'), '***');
  });
  return out;
}

/* Rate limiter: max 5 messages per 5 seconds per socket */
const rateLimits = new Map(); // socketId → { count, resetAt }
function isRateLimited(socketId) {
  const now = Date.now();
  const entry = rateLimits.get(socketId) || { count: 0, resetAt: now + 5000 };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + 5000;
  }
  entry.count += 1;
  rateLimits.set(socketId, entry);
  return entry.count > 5;
}

function attachChat(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
  });

  /* ── Namespace: /chat ── */
  const chat = io.of('/chat');

  chat.on('connection', (socket) => {
    let currentRoom  = null;
    let guestName    = null;
    let colorIndex   = 0;

    /* ────────────────────────────────────────
       JOIN ROOM
       Client sends: { token: string, name: string }
    ──────────────────────────────────────── */
    socket.on('join', async ({ token, name } = {}) => {
      if (!token || typeof token !== 'string') return;

      /* Validate & sanitize name */
      const rawName = typeof name === 'string' ? name.trim().slice(0, 30) : '';
      guestName = rawName || `Guest${Math.floor(Math.random() * 9000) + 1000}`;

      /* Assign colour */
      if (!rooms.has(token)) rooms.set(token, new Map());
      const room = rooms.get(token);
      colorIndex = room.size % GUEST_COLORS.length;
      room.set(socket.id, { name: guestName, colorIndex });

      currentRoom = token;
      socket.join(token);

      /* Send last 50 messages from DB */
      try {
        const history = await ChatMessage.find({ eventToken: token })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        socket.emit('history', history.reverse());
      } catch (_) {
        socket.emit('history', []);
      }

      /* Broadcast join notice */
      const count = room.size;
      chat.to(token).emit('system', {
        text: `${guestName} joined the chat`,
        viewers: count,
        ts: Date.now(),
      });

      /* Confirm join to the joining socket */
      socket.emit('joined', {
        name: guestName,
        colorIndex,
        color: GUEST_COLORS[colorIndex],
        viewers: count,
      });
    });

    /* ────────────────────────────────────────
       SEND MESSAGE
       Client sends: { text: string }
    ──────────────────────────────────────── */
    socket.on('message', async ({ text } = {}) => {
      if (!currentRoom || !guestName) return;
      if (typeof text !== 'string' || !text.trim()) return;
      if (isRateLimited(socket.id)) {
        socket.emit('error', { message: 'Slow down! You\'re sending too fast.' });
        return;
      }

      const clean = sanitize(text);

      /* Persist to MongoDB */
      let saved;
      try {
        saved = await ChatMessage.create({
          eventToken: currentRoom,
          sender: guestName,
          senderType: 'guest',
          text: clean,
          colorIndex,
        });
      } catch (_) {
        socket.emit('error', { message: 'Failed to send message.' });
        return;
      }

      /* Broadcast to everyone in the room */
      chat.to(currentRoom).emit('message', {
        _id: saved._id,
        sender: guestName,
        senderType: 'guest',
        text: clean,
        colorIndex,
        color: GUEST_COLORS[colorIndex],
        createdAt: saved.createdAt,
      });
    });

    /* ────────────────────────────────────────
       TYPING INDICATOR
       Client sends: { typing: boolean }
    ──────────────────────────────────────── */
    socket.on('typing', ({ typing } = {}) => {
      if (!currentRoom || !guestName) return;
      socket.to(currentRoom).emit('typing', {
        name: guestName,
        colorIndex,
        typing: !!typing,
      });
    });

    /* ────────────────────────────────────────
       DISCONNECT
    ──────────────────────────────────────── */
    socket.on('disconnect', () => {
      if (!currentRoom) return;
      const room = rooms.get(currentRoom);
      if (room) {
        room.delete(socket.id);
        const count = room.size;
        if (room.size === 0) rooms.delete(currentRoom);

        chat.to(currentRoom).emit('system', {
          text: `${guestName} left the chat`,
          viewers: count,
          ts: Date.now(),
        });
      }
      rateLimits.delete(socket.id);
    });
  });

  console.log('✅ Chat WebSocket server attached');
  return io;
}

module.exports = { attachChat };