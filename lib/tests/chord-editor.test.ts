import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EditorState } from "@codemirror/state";
import {
  chordProtectedEditing,
  getChordEditorRanges,
  markerSkipPosition,
} from "../chord-editor";

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

describe("chord protected editing", () => {
  it("skips hidden markers without changing source text", () => {
    assert.equal(markerSkipPosition("<Em>", 1, "backward"), 0);
    assert.equal(markerSkipPosition("<Em>", 3, "forward"), 4);
    assert.equal(markerSkipPosition("<Em>", 2, "backward"), undefined);
  });

  it("removes delimiters when an edit empties a non-empty chord", () => {
    const state = EditorState.create({
      doc: "<Em>",
      extensions: [chordProtectedEditing],
    });

    assert.equal(state.update({ changes: { from: 1, to: 3 } }).newDoc.toString(), "");
  });

  it("preserves imported empty chords", () => {
    const state = EditorState.create({
      doc: "<>",
      extensions: [chordProtectedEditing],
    });

    assert.equal(state.update({ changes: { from: 0, insert: "x" } }).newDoc.toString(), "x<>");
  });
});
