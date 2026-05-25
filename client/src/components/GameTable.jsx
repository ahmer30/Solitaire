import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Card from "./Card";
import { isSet, isSequence } from "../engine/validator";

const socket = io("http://localhost:3001");

export default function GameTable() {
  const [roomId, setRoomId]     = useState("");
  const [screen, setScreen]     = useState("lobby");  // lobby | waiting | game
  const [gameState, setGame]    = useState(null);
  const [selected, setSelected] = useState(null);
  const [message, setMessage]   = useState("");
  const dragIndex = useRef(null);

  useEffect(() => {
    socket.on("waiting",              (msg) => { setMessage(msg); setScreen("waiting"); });
    socket.on("game_started",         ()    => { setScreen("game"); setMessage(""); });
    socket.on("game_state_update",    (s)   => { setGame(s); setSelected(null); });
    socket.on("room_full",            ()    => setMessage("Room is full. Try another room ID."));
    socket.on("opponent_disconnected",()    => { setMessage("Opponent disconnected."); setScreen("lobby"); });
    socket.on("stockpile_refresh",    ()    => setMessage("Stockpile reshuffled!"));

    return () => socket.removeAllListeners();
  }, []);

  function joinRoom() {
    if (!roomId.trim()) return;
    socket.emit("join_room", roomId.trim());
  }

  function drawStock()   { socket.emit("draw_stock"); }
  function drawDiscard() { socket.emit("draw_discard"); }

  function discardCard() {
    if (selected === null) return;
    socket.emit("discard_card", selected);
    setSelected(null);
  }

  function selectCard(i) {
    if (!gameState?.isMyTurn || gameState?.phase !== "discard") return;
    setSelected(s => s === i ? null : i);
  }

  function dragStart(i) { dragIndex.current = i; }
  function dropOn(i) {
    if (dragIndex.current === null || dragIndex.current === i) return;
    socket.emit("reorder_hand", { from: dragIndex.current, to: i });
    dragIndex.current = null;
  }

  function rematch() { socket.emit("rematch_request"); }
function getZoneStatus(hand) {
  if (!hand || hand.length < 10) return { z1: "idle", z2: "idle", z3: "idle" };
  const z1 = hand.slice(0, 3);
  const z2 = hand.slice(3, 6);
  const z3 = hand.slice(6, 10);
  return {
    z1: isSet(z1) || isSequence(z1) ? "valid" : "invalid",
    z2: isSet(z2) || isSequence(z2) ? "valid" : "invalid",
    z3: isSequence(z3)               ? "valid" : "invalid",
  };
}
  // ── LOBBY ──────────────────────────────────────────────────
  if (screen === "lobby" || screen === "waiting") {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-6">
        <div className="text-white text-4xl font-bold">🃏 Solitaire</div>
        <div className="text-gray-400 text-sm">Multiplayer Card Game</div>
        <div className="flex gap-2 mt-4">
          <input
            value={roomId}
            onChange={e => setRoomId(e.target.value)}
            onKeyDown={e => e.key === "Enter" && joinRoom()}
            placeholder="Enter room code..."
            className="px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 outline-none focus:border-blue-400 w-48"
          />
          <button
            onClick={joinRoom}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition"
          >
            Join
          </button>
        </div>
        {message && <div className="text-yellow-400 text-sm">{message}</div>}
        {screen === "waiting" && (
          <div className="text-gray-400 text-sm animate-pulse">Waiting for opponent to join...</div>
        )}
      </div>
    );
  }

  // ── GAME ───────────────────────────────────────────────────
  const g = gameState;
  if (!g) return <div className="h-screen flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="h-screen flex flex-col items-center justify-between py-6 px-4 select-none">

      {/* Winner overlay */}
      {g.winner && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-yellow-400 rounded-2xl p-10 text-center">
            <div className="text-yellow-400 text-5xl mb-3">🏆</div>
            <div className="text-white text-3xl font-bold mb-2">
              {g.winner === g.playerNumber ? "You Win!" : "Opponent Wins!"}
            </div>
            <button
              onClick={rematch}
              className="mt-6 px-8 py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 transition"
            >
              Rematch
            </button>
          </div>
        </div>
      )}

      {/* Opponent hand */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-gray-400 text-sm font-medium">
          Opponent — {g.oppCardCount} cards
        </div>
        <div className="flex gap-1">
          {Array.from({ length: g.oppCardCount }).map((_, i) => <Card key={i} faceDown />)}
        </div>
      </div>

      {/* Center */}
      <div className="flex items-center gap-10">
        <div className="flex flex-col items-center gap-2">
          <div className="text-gray-400 text-xs">STOCK ({g.stockpileCount})</div>
          <div
            onClick={g.isMyTurn && g.phase === "draw" ? drawStock : undefined}
            className={`transition-transform hover:scale-105 ${!g.isMyTurn || g.phase !== "draw" ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {g.stockpileCount > 0
              ? <Card faceDown />
              : <div className="w-14 h-20 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-600 text-xs">Empty</div>
            }
          </div>
        </div>

        <div className="text-center">
          <div className="text-white font-bold">
            {g.isMyTurn ? "Your Turn" : "Opponent's Turn"}
          </div>
          <div className="text-gray-400 text-xs mt-1">
            {g.isMyTurn
              ? g.phase === "draw" ? "Draw a card." : "Select a card to discard."
              : "Waiting..."}
          </div>
          {message && <div className="text-yellow-400 text-xs mt-1">{message}</div>}
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="text-gray-400 text-xs">DISCARD</div>
          <div
            onClick={g.isMyTurn && g.phase === "draw" && g.topDiscard ? drawDiscard : undefined}
            className={`transition-transform hover:scale-105 ${!g.isMyTurn || g.phase !== "draw" || !g.topDiscard ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {g.topDiscard
              ? <Card card={g.topDiscard} />
              : <div className="w-14 h-20 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-600 text-xs">Empty</div>
            }
          </div>
        </div>
      </div>

      {/* Player hand */}
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>

      <div style={{ color: "#9ca3af", fontSize: 13, fontWeight: 500 }}>
    Your Hand — Player {g.playerNumber}
    {g.isMyTurn && g.phase === "discard" && selected !== null && (
      <span style={{ marginLeft: 10, color: "#facc15" }}>Card {selected} selected</span>
    )}
  </div>

  {/* Zone labels with live color feedback */}
  {(() => {
    const zones = getZoneStatus(g.myHand);
    const color = (s) => s === "valid" ? "#22c55e" : s === "invalid" ? "#ef4444" : "#6b7280";
    const label = (s) => s === "valid" ? "✓" : s === "invalid" ? "✗" : "";
    return (
      <div style={{ display: "flex", gap: 4, fontSize: 11 }}>
        <div style={{ width: 172, textAlign: "center", color: color(zones.z1), fontWeight: 600 }}>
          Zone 1 {label(zones.z1)}
        </div>
        <div style={{ width: 8 }} />
        <div style={{ width: 172, textAlign: "center", color: color(zones.z2), fontWeight: 600 }}>
          Zone 2 {label(zones.z2)}
        </div>
        <div style={{ width: 8 }} />
        <div style={{ width: 230, textAlign: "center", color: color(zones.z3), fontWeight: 600 }}>
          Zone 3 {label(zones.z3)}
        </div>
      </div>
    );
  })()}

  {/* Cards */}
  <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
    {g.myHand.map((card, i) => (
  <div key={i} style={{ display: "flex", alignItems: "flex-end" }}>
    {(i === 3 || i === 6) && (
      <div style={{
        width: 2, height: 80, background: "#4b5563",
        borderRadius: 2, margin: "0 4px", alignSelf: "center"
      }} />
    )}
    <div
      draggable
      onDragStart={() => dragStart(i)}
      onDragOver={e => e.preventDefault()}
      onDrop={() => dropOn(i)}
    >
      <Card
        card={card}
        selected={selected === i}
        onClick={() => selectCard(i)}
      />
    </div>
  </div>
))}
  </div>

  {g.isMyTurn && g.phase === "discard" && (
    <button
      onClick={discardCard}
      disabled={selected === null}
      style={{
        marginTop: 4, padding: "8px 32px",
        background: selected !== null ? "#dc2626" : "#6b7280",
        color: "#fff", fontWeight: 700, fontSize: 14,
        border: "none", borderRadius: 12, cursor: selected !== null ? "pointer" : "not-allowed",
        transition: "background 0.2s",
          }}
        >
         Discard Selected Card
       </button>
      )}
    </div>
    </div>
  );
}