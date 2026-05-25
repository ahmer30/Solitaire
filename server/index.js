const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { deal } = require("./engine/deck");
const { validateHand } = require("./engine/validator");

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
});

// rooms[roomId] = { players: [socketId, socketId], state: {...} }
const rooms = {};

function getRoom(socketId) {
  return Object.entries(rooms).find(([, r]) =>
    r.players.includes(socketId)
  );
}

function buildClientState(room, socketId) {
  const { state, players } = room;
  const myIndex    = players.indexOf(socketId);       // 0 or 1
  const oppIndex   = myIndex === 0 ? 1 : 0;
  const myHand     = myIndex === 0 ? state.player1Hand : state.player2Hand;
  const oppCount   = myIndex === 0 ? state.player2Hand.length : state.player1Hand.length;
  const isMyTurn   = state.turn === myIndex + 1;

  return {
    myHand,
    oppCardCount: oppCount,
    stockpileCount: state.stockpile.length,
    topDiscard: state.discardPile.at(-1) ?? null,
    turn: state.turn,
    isMyTurn,
    phase: state.phase,
    playerNumber: myIndex + 1,
    winner: state.winner ?? null,
  };
}

function emitState(room, roomId) {
  room.players.forEach(sid => {
    io.to(sid).emit("game_state_update", buildClientState(room, sid));
  });
}

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  // ── JOIN ROOM ──────────────────────────────────────────────
  socket.on("join_room", (roomId) => {
    if (!rooms[roomId]) {
      rooms[roomId] = { players: [], state: null };
    }

    const room = rooms[roomId];

    if (room.players.length >= 2) {
      socket.emit("room_full");
      return;
    }

    room.players.push(socket.id);
    socket.join(roomId);

    if (room.players.length === 2) {
      const d = deal();
      room.state = {
        ...d,
        turn: 1,
        phase: "draw",
        winner: null,
      };
      io.to(roomId).emit("game_started");
      emitState(room, roomId);
    } else {
      socket.emit("waiting", "Waiting for opponent...");
    }
  });

  // ── DRAW FROM STOCKPILE ────────────────────────────────────
  socket.on("draw_stock", () => {
    const entry = getRoom(socket.id);
    if (!entry) return;
    const [roomId, room] = entry;
    const { state, players } = room;

    const myIndex = players.indexOf(socket.id);
    if (state.turn !== myIndex + 1 || state.phase !== "draw") return;

    // Stockpile refresh
    if (state.stockpile.length === 0) {
      if (state.discardPile.length === 0) return;
      const reshuffled = shuffle([...state.discardPile]);
      state.stockpile  = reshuffled;
      state.discardPile = [];
      io.to(roomId).emit("stockpile_refresh");
    }

    const [card, ...rest] = state.stockpile;
    state.stockpile = rest;

    if (myIndex === 0) state.player1Hand.push(card);
    else               state.player2Hand.push(card);

    state.phase = "discard";
    emitState(room, roomId);
  });

  // ── DRAW FROM DISCARD ──────────────────────────────────────
  socket.on("draw_discard", () => {
    const entry = getRoom(socket.id);
    if (!entry) return;
    const [roomId, room] = entry;
    const { state, players } = room;

    const myIndex = players.indexOf(socket.id);
    if (state.turn !== myIndex + 1 || state.phase !== "draw") return;
    if (state.discardPile.length === 0) return;

    const pile = [...state.discardPile];
    const card = pile.pop();
    state.discardPile = pile;

    if (myIndex === 0) state.player1Hand.push(card);
    else               state.player2Hand.push(card);

    state.phase = "discard";
    emitState(room, roomId);
  });

  // ── DISCARD CARD ───────────────────────────────────────────
  socket.on("discard_card", (cardIndex) => {
    const entry = getRoom(socket.id);
    if (!entry) return;
    const [roomId, room] = entry;
    const { state, players } = room;

    const myIndex = players.indexOf(socket.id);
    if (state.turn !== myIndex + 1 || state.phase !== "discard") return;

    const hand = myIndex === 0 ? state.player1Hand : state.player2Hand;
    if (cardIndex < 0 || cardIndex >= hand.length) return;

    const [discarded] = hand.splice(cardIndex, 1);
    state.discardPile.push(discarded);

    // Win check
    if (validateHand(hand)) {
      state.winner  = myIndex + 1;
      state.phase   = "done";
      emitState(room, roomId);
      return;
    }

    state.turn  = state.turn === 1 ? 2 : 1;
    state.phase = "draw";
    emitState(room, roomId);
  });

  // ── REORDER HAND (drag & drop) ─────────────────────────────
  socket.on("reorder_hand", ({ from, to }) => {
    const entry = getRoom(socket.id);
    if (!entry) return;
    const [roomId, room] = entry;
    const { state, players } = room;

    const myIndex = players.indexOf(socket.id);
    const hand = myIndex === 0 ? state.player1Hand : state.player2Hand;

    if (from < 0 || to < 0 || from >= hand.length || to >= hand.length) return;

    const [moved] = hand.splice(from, 1);
    hand.splice(to, 0, moved);

    emitState(room, roomId);
  });

  // ── REMATCH ────────────────────────────────────────────────
  socket.on("rematch_request", () => {
    const entry = getRoom(socket.id);
    if (!entry) return;
    const [roomId, room] = entry;

    if (!room.rematchVotes) room.rematchVotes = new Set();
    room.rematchVotes.add(socket.id);

    if (room.rematchVotes.size === 2) {
      const d = deal();
      room.state = { ...d, turn: 1, phase: "draw", winner: null };
      room.rematchVotes.clear();
      io.to(roomId).emit("game_started");
      emitState(room, roomId);
    } else {
      socket.emit("waiting", "Waiting for opponent to accept rematch...");
    }
  });

  // ── DISCONNECT ─────────────────────────────────────────────
  socket.on("disconnect", () => {
    const entry = getRoom(socket.id);
    if (!entry) return;
    const [roomId, room] = entry;
    io.to(roomId).emit("opponent_disconnected");
    delete rooms[roomId];
    console.log("disconnected:", socket.id);
  });
});

// Fisher-Yates (needed server-side for stockpile refresh)
function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

app.get("/health", (_, res) => res.json({ status: "ok" }));

server.listen(3001, () => console.log("Server running on port 3001"));