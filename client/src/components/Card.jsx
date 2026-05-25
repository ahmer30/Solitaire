const SUITS = {
  S: { symbol: "♠", color: "#1a1a2e" },
  H: { symbol: "♥", color: "#c0392b" },
  D: { symbol: "♦", color: "#c0392b" },
  C: { symbol: "♣", color: "#1a1a2e" },
};

export default function Card({ card, selected, onClick, faceDown = false }) {
  if (faceDown) {
    return (
      <div
        style={{
          width: 56, height: 80,
          borderRadius: 8,
          border: "2px solid #4a5568",
          background: "linear-gradient(135deg, #1a365d 0%, #2a4a8a 50%, #1a365d 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "default", userSelect: "none", flexShrink: 0,
          boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{
          width: 44, height: 68, borderRadius: 5,
          border: "1px solid #3a5a9a",
          background: "repeating-linear-gradient(45deg, #1e3a6e, #1e3a6e 3px, #2a4a8a 3px, #2a4a8a 6px)",
        }} />
      </div>
    );
  }

  const { symbol, color } = SUITS[card.suit];
  const borderStyle = selected
    ? "3px solid #f6c90e"
    : "1px solid #cbd5e0";
  const transform = selected ? "translateY(-12px)" : "translateY(0)";

  return (
    <div
      onClick={onClick}
      style={{
        width: 56, height: 80,
        borderRadius: 8,
        border: borderStyle,
        background: "#ffffff",
        display: "flex", flexDirection: "column",
        justifyContent: "space-between",
        padding: "3px 4px",
        cursor: "pointer", userSelect: "none",
        flexShrink: 0,
        transform,
        transition: "transform 0.15s ease, border 0.1s ease",
        boxShadow: selected
          ? "0 0 0 2px #f6c90e, 0 4px 12px rgba(0,0,0,0.3)"
          : "0 2px 6px rgba(0,0,0,0.25)",
      }}
    >
      {/* Top left */}
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1, color }}>
        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "Arial" }}>{card.rank}</span>
        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "Arial" }}>{symbol}</span>
      </div>

      {/* Center suit */}
      <div style={{ textAlign: "center", color, fontSize: 22, lineHeight: 1, fontFamily: "Arial" }}>
        {symbol}
      </div>

      {/* Bottom right (rotated) */}
      <div style={{
        display: "flex", flexDirection: "column", lineHeight: 1,
        color, alignSelf: "flex-end", transform: "rotate(180deg)"
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "Arial" }}>{card.rank}</span>
        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "Arial" }}>{symbol}</span>
      </div>
    </div>
  );
}