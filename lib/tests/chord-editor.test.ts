import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getChordEditorRanges } from "../chord-editor";

describe("chord editor ranges", () => {
  it("styles chord contents and hides their delimiters", () => {
    assert.deepEqual(getChordEditorRanges("<Em> lyrics"), {
      chordContents: [{ from: 1, to: 3 }],
      hiddenMarkers: [
        { from: 0, to: 1 },
        { from: 3, to: 4 },
      ],
    });
  });

  it("makes empty chords completely invisible", () => {
    assert.deepEqual(getChordEditorRanges("<>"), {
      chordContents: [],
      hiddenMarkers: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
      ],
    });
  });

  it("splits multiline chord content into line-safe decorations", () => {
    assert.deepEqual(getChordEditorRanges("<A\nminor>"), {
      chordContents: [
        { from: 1, to: 2 },
        { from: 3, to: 8 },
      ],
      hiddenMarkers: [
        { from: 0, to: 1 },
        { from: 8, to: 9 },
      ],
    });
  });

  it("hides escape backslashes while keeping literal brackets visible", () => {
    assert.deepEqual(getChordEditorRanges("\\<literal\\>"), {
      chordContents: [],
      hiddenMarkers: [
        { from: 0, to: 1 },
        { from: 9, to: 10 },
      ],
    });
  });

  it("leaves malformed delimiters without chord styling", () => {
    assert.deepEqual(getChordEditorRanges("<unfinished"), {
      chordContents: [],
      hiddenMarkers: [],
    });
  });
});
