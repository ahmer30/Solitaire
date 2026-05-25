// Suits and ranks for a standard 52-card deck
const SUITS = ["S", "H", "D", "C"]; // Spades, Hearts, Diamonds, Clubs
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

// Numeric value of each rank (Ace is strictly 1)
const RANK_VALUE = {
  A: 1, "2": 2, "3": 3, "4": 4, "5": 5,
  "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
  J: 11, Q: 12, K: 13
};

// Creates a single card object
function createCard(suit, rank) {
  return Object.freeze({ suit, rank, value: RANK_VALUE[rank] });
}

// Builds a full 52-card deck in order
function buildDeck() {
  const deck = [];
  for (const suit of SUITS)
    for (const rank of RANKS)
      deck.push(createCard(suit, rank));
  return deck;
}

// Fisher-Yates shuffle — returns a new shuffled array
function shuffle(deck) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// Deals initial game state from a shuffled deck
function deal() {
  const deck = shuffle(buildDeck());
  return {
    player1Hand: deck.slice(0, 10),
    player2Hand: deck.slice(10, 20),
    stockpile: deck.slice(20),   // 32 cards
    discardPile: [],
  };
}

module.exports = { buildDeck, shuffle, deal, createCard, RANK_VALUE, SUITS, RANKS };