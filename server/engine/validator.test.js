import { describe, it, expect } from "vitest";
import { validateHand, isSet, isSequence } from "./validator.js";

// helpers
const c = (suit, rank, value) => ({ suit, rank, value });

const AS = c("S","A",1), AH = c("H","A",1), AD = c("D","A",1);
const H2 = c("H","2",2), H3 = c("H","3",3), H4 = c("H","4",4);
const D7 = c("D","7",7), D8 = c("D","8",8), D9 = c("D","9",9), D10 = c("D","10",10);
const KH = c("H","K",13);

describe("isSet", () => {
  it("valid set — same rank different suits", () => {
    expect(isSet([AS, AH, AD])).toBe(true);
  });
  it("invalid — two same suits", () => {
    expect(isSet([AS, c("S","A",1), AD])).toBe(false);
  });
  it("invalid — different ranks", () => {
    expect(isSet([AS, H2, AD])).toBe(false);
  });
});

describe("isSequence", () => {
  it("valid 3-card sequence", () => {
    expect(isSequence([c("H","A",1), H2, H3])).toBe(true);
  });
  it("valid 4-card sequence", () => {
    expect(isSequence([D7, D8, D9, D10])).toBe(true);
  });
  it("invalid — out of order", () => {
    expect(isSequence([H2, c("H","4",4), H3])).toBe(false);
  });
  it("invalid — corner wrap K-A-2", () => {
    expect(isSequence([KH, c("H","A",1), H2])).toBe(false);
  });
  it("invalid — different suits", () => {
    expect(isSequence([c("S","2",2), H3, c("D","4",4)])).toBe(false);
  });
});

describe("validateHand", () => {
  it("valid — set + set + long sequence", () => {
    const hand = [
      AS, AH, AD,                    // zone1: set
      c("S","K",13), c("H","K",13), c("D","K",13), // zone2: set
      D7, D8, D9, D10                // zone3: long sequence
    ];
    expect(validateHand(hand)).toBe(true);
  });

  it("valid — short seq + set + long sequence", () => {
    const hand = [
      c("H","A",1), H2, H3,
      AS, AH, AD,
      D7, D8, D9, D10
    ];
    expect(validateHand(hand)).toBe(true);
  });

  it("invalid — zone3 is a set of 4, not sequence", () => {
    const hand = [
      AS, AH, AD,
      c("S","K",13), c("H","K",13), c("D","K",13),
      c("S","J",11), c("H","J",11), c("D","J",11), c("C","J",11) // 4-of-a-kind
    ];
    expect(validateHand(hand)).toBe(false);
  });

  it("invalid — wrong hand size", () => {
    expect(validateHand([])).toBe(false);
  });

  it("invalid — zone1 out of order sequence", () => {
    const hand = [
      H2, c("H","4",4), H3,          // wrong order
      AS, AH, AD,
      D7, D8, D9, D10
    ];
    expect(validateHand(hand)).toBe(false);
  });
});