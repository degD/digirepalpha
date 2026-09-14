import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applySourceChanges,
  chordifySelection,
  escapeLiteralBrackets,
  hiddenMarkerRanges,
  plainTextClipboardContent,
  scanChordFormat,
  touchesHiddenMarker,
  unchordSelection,
} from "../chord-format";

describe("chord format scanner", () => {
  it("finds ordinary, empty, and whitespace-containing chords", () => {
    assert.deepEqual(scanChordFormat("<Em> <> <A minor>").chords, [
      { from: 0, to: 4, contentFrom: 1, contentTo: 3 },
      { from: 5, to: 7, contentFrom: 6, contentTo: 6 },
      { from: 8, to: 17, contentFrom: 9, contentTo: 16 },
    ]);
  });

  it("finds multiline and adjacent chords", () => {
    assert.deepEqual(scanChordFormat("<A\nminor><B>").chords, [
      { from: 0, to: 9, contentFrom: 1, contentTo: 8 },
      { from: 9, to: 12, contentFrom: 10, contentTo: 11 },
    ]);
  });

  it("ignores escaped brackets and unmatched delimiters", () => {
    const format = scanChordFormat("\\<Em\\> <A \\> B> <unfinished");

    assert.deepEqual(format.chords, [
      { from: 7, to: 15, contentFrom: 8, contentTo: 14 },
    ]);
    assert.deepEqual(format.escapedBrackets, [
      { from: 0, to: 2, bracket: "<" },
      { from: 4, to: 6, bracket: ">" },
      { from: 10, to: 12, bracket: ">" },
    ]);
  });

  it("handles repeated backslashes using odd/even escape rules", () => {
    assert.equal(scanChordFormat("\\\\<Em>").chords.length, 1);
    assert.equal(scanChordFormat("\\\\\\<Em>").chords.length, 0);
  });
});

describe("literal bracket escaping", () => {
  it("escapes raw brackets while preserving escaped brackets", () => {
    assert.equal(escapeLiteralBrackets("<Em> \\<ok\\>"), "\\<Em\\> \\<ok\\>");
  });

  it("adds an escape after an even backslash run", () => {
    assert.equal(escapeLiteralBrackets("\\\\<"), "\\\\\\<");
  });
});

describe("hidden markers", () => {
  it("returns chord delimiters and literal escape characters", () => {
    const source = "<Em> \\<";

    assert.deepEqual(hiddenMarkerRanges(source), [
      { from: 0, to: 1 },
      { from: 3, to: 4 },
      { from: 5, to: 6 },
    ]);
    assert.equal(touchesHiddenMarker(source, { from: 3, to: 4 }), true);
    assert.equal(touchesHiddenMarker(source, { from: 1, to: 3 }), false);
  });
});

describe("clipboard content", () => {
  it("copies rendered text without hidden chord markup", () => {
    assert.equal(plainTextClipboardContent("<Em> \\<literal\\>"), "Em <literal>");
  });

  it("preserves visible malformed delimiters", () => {
    assert.equal(plainTextClipboardContent("<unfinished"), "<unfinished");
  });
});

describe("source transformations", () => {
  it("applies changes and maps the selection", () => {
    assert.deepEqual(
      applySourceChanges("one two", { from: 0, to: 7 }, [
        { from: 4, to: 7, insert: "<two>" },
      ]),
      { source: "one <two>", selection: { from: 0, to: 9 } },
    );
  });

  it("chordifies one selected chord per non-whitespace token", () => {
    assert.deepEqual(
      chordifySelection("A  minor\nB7", { from: 0, to: 11 }),
      { source: "<A>  <minor>\n<B7>", selection: { from: 0, to: 17 } },
    );
  });

  it("leaves existing chords unchanged in mixed selections", () => {
    assert.deepEqual(
      chordifySelection("one <Em> two", { from: 0, to: 12 }),
      { source: "<one> <Em> <two>", selection: { from: 0, to: 16 } },
    );
  });

  it("reverts selected chords when no plain tokens are selected", () => {
    assert.deepEqual(
      chordifySelection("<Em> <A minor>", { from: 0, to: 14 }),
      { source: "Em A minor", selection: { from: 0, to: 10 } },
    );
  });

  it("supports explicitly removing chord delimiters", () => {
    assert.deepEqual(
      unchordSelection("x <Em> y", { from: 3, to: 5 }),
      { source: "x Em y", selection: { from: 2, to: 4 } },
    );
  });

  it("does nothing for a collapsed selection", () => {
    assert.deepEqual(chordifySelection("one", { from: 1, to: 1 }), {
      source: "one",
      selection: { from: 1, to: 1 },
    });
  });

  it("preserves Unicode token content", () => {
    assert.deepEqual(chordifySelection("Café 🎸", { from: 0, to: 7 }), {
      source: "<Café> <🎸>",
      selection: { from: 0, to: 11 },
    });
  });
});
