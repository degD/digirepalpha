import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  nonWhitespaceTokenAt,
  tokenRangeAt,
} from "../long-press-selection";

describe("non-whitespace token selection", () => {
  it("selects the whole chord when pressing on a slash", () => {
    assert.deepEqual(nonWhitespaceTokenAt("<C/Am>", 2), { from: 1, to: 5 });
  });

  it("selects a plain slash token", () => {
    assert.deepEqual(nonWhitespaceTokenAt("C/Am", 2), { from: 0, to: 4 });
  });

  it("includes punctuation up to the surrounding whitespace", () => {
    assert.deepEqual(nonWhitespaceTokenAt("So, so you think", 1), {
      from: 0,
      to: 3,
    });
  });

  it("stops at chord markers so they are not selected", () => {
    assert.deepEqual(nonWhitespaceTokenAt("<Em>hold tight", 6), {
      from: 4,
      to: 8,
    });
  });

  it("covers the full chord content when pressing an inner letter", () => {
    assert.deepEqual(nonWhitespaceTokenAt("<A#m7>", 3), { from: 1, to: 5 });
  });

  it("returns undefined for marker and out-of-range positions", () => {
    assert.equal(nonWhitespaceTokenAt("<Em>", 0), undefined);
    assert.equal(nonWhitespaceTokenAt("<Em>", 3), undefined);
    assert.equal(nonWhitespaceTokenAt("abc", -1), undefined);
    assert.equal(nonWhitespaceTokenAt("abc", 4), undefined);
  });
});

describe("token range clamping", () => {
  it("expands a boundary inside a marker to the visible token", () => {
    assert.deepEqual(tokenRangeAt("<C/Am>", 5), { from: 1, to: 5 });
  });

  it("expands an inside position to the full token", () => {
    assert.deepEqual(tokenRangeAt("<C/Am>", 2), { from: 1, to: 5 });
  });

  it("clamps positions at the document end", () => {
    assert.deepEqual(tokenRangeAt("abc", 3), { from: 0, to: 3 });
  });

  it("falls back to a collapsed range when no token exists", () => {
    assert.deepEqual(tokenRangeAt("<Em>", 0), { from: 0, to: 0 });
  });
});
