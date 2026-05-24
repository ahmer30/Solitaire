import { useState } from "react";
import Card from "./Card";
import { deal } from "../engine/deck";
import { validateHand } from "../engine/validator";

export default function GameTable() {
  const [state, setState] = useState(() => {
    const d = deal();
    return { ...d, turn: 1, phase: "draw", selected: null, winner: null, message: "" };
  });

  const active = state.turn === 1 ? state.player1Hand : state.player2Hand;
  const setActive = (hand) =>
    setState(s => s.turn === 1 ? { ...s, player1Hand: hand } : { ...s, player2Hand: hand });

  // Draw from stockpile
  function drawStock() {
    if (state.phase !== "draw") return;
    if (state.stockpile.length === 0) return;

    const [card, ...rest] = state.stockpile;
    setActive([...active, card]);
    setState(s => ({ ...s, stockpile: rest, phase: "discard", message: "Now discard a card." }));
  }

  // Draw from discard pile
  function drawDiscard() {
    if (state.phase !== "draw") return;
    if (state.discardPile.length === 0) return;

    const pile = [...state.discardPile];
    const card = pile.pop();
    setActive([...active, card]);
    setState(s => ({ ...s, discardPile: pile, phase: "discard", message: "Now discard a card." }));
  }

  // Select a card in hand
  function selectCard(i) {
    if (state.phase !== "discard") return;
    setState(s => ({ ...s, selected: s.selected === i ? null : i }));
  }

  // Discard selected card
  function discardCard() {
    if (state.phase !== "discard" || state.selected === null) return;

    const hand = [...active];
    const [discarded] = hand.splice(state.selected, 1);
    const newDiscard = [...state.discardPile, discarded];

    // Check win
    if (validateHand(hand)) {
      setState(s => ({ ...s, winner: s.turn, phase: "done", message: "" }));
      return;
    }

    setActive(hand);
    setState(s => ({
      ...s,
      discardPile: newDiscard,
      turn: s.turn === 1 ? 2 : 1,
      phase: "draw",
      selected: null,
      message: `Player ${s.turn === 1 ? 2 : 1}'s turn — draw a card.`
    }));
  }

  // Drag to reorder hand
  function dragStart(e, i) { e.dataTransfer.setData("index", i); }
  function drop(e, i) {
    const from = parseInt(e.dataTransfer.getData("index"));
    if (from === i) return;
    const hand = [...active];
    const [moved] = hand.splice(from, 1);
    hand.splice(i, 0, moved);
    setActive(hand);
    setState(s => ({ ...s, selected: null }));
  }

  function rematch() {
    const d = deal();
    setState({ ...d, turn: 1, phase: "draw", selected: null, winner: null, message: "Player 1's turn — draw a card." });
  }

  const opponentHand = state.turn === 1 ? state.player2Hand : state.player1Hand;
  const topDiscard   = state.discardPile.at(-1) ?? null;

  return (
    <div className="h-screen flex flex-col items-center justify-between py-6 px-4 select-none">

      {/* Winner overlay */}
      {state.winner && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-yellow-400 rounded-2xl p-10 text-center">
            <div className="text-yellow-400 text-5xl mb-3">🏆</div>
            <div className="text-white text-3xl font-bold mb-2">Player {state.winner} Wins!</div>
            <button onClick={rematch} className="mt-6 px-8 py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 transition">
              Rematch
            </button>
          </div>
        </div>
      )}

      {/* Opponent hand (face down) */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-gray-400 text-sm font-medium">
          Player {state.turn === 1 ? 2 : 1} — {opponentHand.length} cards
        </div>
        <div className="flex gap-1">
          {opponentHand.map((_, i) => <Card key={i} faceDown />)}
        </div>
      </div>

      {/* Center — stockpile & discard */}
      <div className="flex items-center gap-10">
        {/* Stockpile */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-gray-400 text-xs">STOCK ({state.stockpile.length})</div>
          <div
            onClick={drawStock}
            className={`cursor-pointer transition-transform hover:scale-105 ${state.phase !== "draw" ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            {state.stockpile.length > 0
              ? <Card faceDown />
              : <div className="w-14 h-20 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-600 text-xs">Empty</div>
            }
          </div>
        </div>

        {/* Status */}
        <div className="text-center">
          <div className="text-white font-bold text-lg">Player {state.turn}</div>
          <div className="text-gray-300 text-sm mt-1">{state.message || "Draw a card."}</div>
        </div>

        {/* Discard pile */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-gray-400 text-xs">DISCARD</div>
          <div
            onClick={drawDiscard}
            className={`cursor-pointer transition-transform hover:scale-105 ${state.phase !== "draw" || !topDiscard ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            {topDiscard
              ? <Card card={topDiscard} />
              : <div className="w-14 h-20 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-600 text-xs">Empty</div>
            }
          </div>
        </div>
      </div>

      {/* Active player hand */}
      <div className="flex flex-col items-center gap-3">
        <div className="text-gray-300 text-sm font-medium">
          Your Hand — Player {state.turn}
          {state.phase === "discard" && state.selected !== null && (
            <span className="ml-3 text-yellow-400">Card {state.selected} selected</span>
          )}
        </div>

        {/* Zone labels */}
        <div className="flex gap-1 text-xs text-gray-500 w-full justify-center">
          <div className="w-[calc(3*3.5rem+2*0.25rem)] text-center">Zone 1</div>
          <div className="w-2" />
          <div className="w-[calc(3*3.5rem+2*0.25rem)] text-center">Zone 2</div>
          <div className="w-2" />
          <div className="w-[calc(4*3.5rem+3*0.25rem)] text-center">Zone 3</div>
        </div>

        {/* Cards with zone dividers */}
        <div className="flex gap-1 items-end">
          {active.map((card, i) => (
            <>
              {(i === 3 || i === 6) && (
                <div key={`div-${i}`} className="w-0.5 h-20 bg-gray-600 mx-1 self-center rounded" />
              )}
              <div
                key={i}
                draggable
                onDragStart={e => dragStart(e, i)}
                onDragOver={e => e.preventDefault()}
                onDrop={e => drop(e, i)}
              >
                <Card
                  card={card}
                  selected={state.selected === i}
                  onClick={() => selectCard(i)}
                />
              </div>
            </>
          ))}
        </div>

        {/* Discard button */}
        {state.phase === "discard" && (
          <button
            onClick={discardCard}
            disabled={state.selected === null}
            className="mt-1 px-8 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition"
          >
            Discard Selected Card
          </button>
        )}
      </div>
    </div>
  );
}