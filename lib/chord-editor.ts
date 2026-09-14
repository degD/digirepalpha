import { StateField } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView } from "@codemirror/view";
import { scanChordFormat, type SourceRange } from "./chord-format";

export interface ChordEditorRanges {
  chordContents: SourceRange[];
  hiddenMarkers: SourceRange[];
}

function splitRangeByLine(
  source: string,
  from: number,
  to: number,
): SourceRange[] {
  const ranges: SourceRange[] = [];
  let rangeStart = from;

  for (let index = from; index < to; index++) {
    if (source[index] !== "\n") {
      continue;
    }

    if (rangeStart < index) {
      ranges.push({ from: rangeStart, to: index });
    }

    rangeStart = index + 1;
  }

  if (rangeStart < to) {
    ranges.push({ from: rangeStart, to });
  }

  return ranges;
}

export function getChordEditorRanges(source: string): ChordEditorRanges {
  const format = scanChordFormat(source);

  return {
    chordContents: format.chords.flatMap((chord) =>
      splitRangeByLine(source, chord.contentFrom, chord.contentTo),
    ),
    hiddenMarkers: [
      ...format.chords.flatMap((chord) => [
        { from: chord.from, to: chord.from + 1 },
        { from: chord.to - 1, to: chord.to },
      ]),
      ...format.escapedBrackets.map(({ from }) => ({ from, to: from + 1 })),
    ].sort((first, second) => first.from - second.from),
  };
}

interface ChordDecorations {
  decorations: DecorationSet;
  hiddenMarkers: DecorationSet;
}

function createChordDecorations(source: string): ChordDecorations {
  const ranges = getChordEditorRanges(source);
  const chordContents = ranges.chordContents.map((range) =>
    Decoration.mark({ class: "digirep-chord" }).range(range.from, range.to),
  );
  const hiddenMarkers = ranges.hiddenMarkers.map((range) =>
    Decoration.replace({}).range(range.from, range.to),
  );

  return {
    decorations: Decoration.set([...chordContents, ...hiddenMarkers], true),
    hiddenMarkers: Decoration.set(hiddenMarkers, true),
  };
}

export const chordEditor = StateField.define<ChordDecorations>({
  create(state) {
    return createChordDecorations(state.doc.toString());
  },
  update(value, transaction) {
    return transaction.docChanged
      ? createChordDecorations(transaction.state.doc.toString())
      : value;
  },
  provide: (field) => [
    EditorView.decorations.from(field, (value) => value.decorations),
    EditorView.atomicRanges.of((view) => view.state.field(field).hiddenMarkers),
  ],
});
