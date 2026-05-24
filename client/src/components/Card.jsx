const SUIT_SYMBOLS = { S: "♠", H: "♥", D: "♦", C: "♣" };
const SUIT_COLORS  = { S: "text-white", H: "text-red-400", D: "text-red-400", C: "text-white" };

export default function Card({ card, selected, onClick, faceDown = false }) {
  if (faceDown) {
    return (
      <div className="
        w-14 h-20 rounded-lg border-2 border-gray-600
        bg-gradient-to-br from-blue-900 to-blue-700
        flex items-center justify-center cursor-default select-none
      ">
        <span className="text-blue-400 text-2xl">🂠</span>
      </div>
    );
  }

  const suit   = SUIT_SYMBOLS[card.suit];
  const color  = SUIT_COLORS[card.suit];
  const border = selected ? "border-yellow-400 border-2" : "border-gray-400 border";

  return (
    <div
      onClick={onClick}
      className={`
        w-14 h-20 rounded-lg bg-gray-100 flex flex-col
        justify-between p-1 cursor-pointer select-none
        hover:scale-105 transition-transform ${border}
        ${selected ? "ring-2 ring-yellow-300 -translate-y-2" : ""}
      `}
    >
      <div className={`text-xs font-bold leading-none ${color}`}>
        <div>{card.rank}</div>
        <div>{suit}</div>
      </div>
      <div className={`text-lg font-bold text-center ${color}`}>{suit}</div>
      <div className={`text-xs font-bold leading-none self-end rotate-180 ${color}`}>
        <div>{card.rank}</div>
        <div>{suit}</div>
      </div>
    </div>
  );
}