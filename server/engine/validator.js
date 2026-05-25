const { RANK_VALUE } = require("./deck.js");

// Checks if 3 cards are a valid Set (same rank, different suits)
function isSet(cards) {
  if (cards.length !== 3) return false;
  const ranks = cards.map(c => c.rank);
  const suits = cards.map(c => c.suit);
  const sameRank = ranks.every(r => r === ranks[0]);
  const uniqueSuits = new Set(suits).size === 3;
  return sameRank && uniqueSuits;
}

// Checks if cards are a valid Sequence (same suit, consecutive ascending)
function isSequence(cards) {
  const n = cards.length;
  if (n < 3 || n > 4) return false;

  const sameSuit = cards.every(c => c.suit === cards[0].suit);
  if (!sameSuit) return false;

  const values = cards.map(c => c.value);
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[i - 1] + 1) return false;
  }
  return true;
}

// Zone 1 & 2: must be Set OR Short Sequence (3 cards)
function validateZone3Card(cards) {
  return isSet(cards) || isSequence(cards);
}

// Zone 3: must be Long Sequence ONLY (4 cards, no sets allowed)
function validateZone4Card(cards) {
  return isSequence(cards);
}

// Master validator — reads hand strictly left to right
// hand must be an array of exactly 10 card objects
function validateHand(hand) {
  if (hand.length !== 10) return false;

  const zone1 = hand.slice(0, 3);
  const zone2 = hand.slice(3, 6);
  const zone3 = hand.slice(6, 10);

  return (
    validateZone3Card(zone1) &&
    validateZone3Card(zone2) &&
    validateZone4Card(zone3)
  );
}

module.exports = { validateHand, isSet, isSequence };