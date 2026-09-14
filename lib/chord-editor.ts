import { EditorState, Prec, StateField, type Transaction } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  keymap,
  type KeyBinding,
} from "@codemirror/view";
import {
  escapeLiteralBrackets,
  hiddenMarkerRanges,
  plainTextClipboardContent,
  scanChordFormat,
  type SourceRange,
} from "./chord-format";

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

export function markerSkipPosition(
  source: string,
  position: number,
  direction: "backward" | "forward",
): number | undefined {
  const marker = hiddenMarkerRanges(source).find((range) =>
    direction === "backward" ? range.to === position : range.from === position,
  );

  if (!marker) {
    return undefined;
  }

  return direction === "backward" ? marker.from : marker.to;
}

export function escapedBracketDeletionRange(
  source: string,
  position: number,
  direction: "backward" | "forward",
): SourceRange | undefined {
  const escapedBracket = scanChordFormat(source).escapedBrackets.find((range) =>
    direction === "backward" ? range.to === position : range.from === position,
  );

  return escapedBracket && {
    from: escapedBracket.from,
    to: escapedBracket.to,
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

function removeNewlyEmptyChords(transaction: Transaction) {
  if (!transaction.docChanged) {
    return transaction;
  }

  const newSource = transaction.newDoc.toString();
  const changes = scanChordFormat(transaction.startState.doc.toString()).chords
    .filter((chord) => chord.contentFrom !== chord.contentTo)
    .flatMap((chord) => {
      const from = transaction.changes.mapPos(chord.from, -1);
      const to = transaction.changes.mapPos(chord.to, 1);

      return newSource.slice(from, to) === "<>" ? [{ from, to, insert: "" }] : [];
    });

  return changes.length === 0
    ? transaction
    : [transaction, { changes, sequential: true }];
}

function skipHiddenMarker(direction: "backward" | "forward") {
  return (view: EditorView): boolean => {
    const selection = view.state.selection.main;

    if (!selection.empty) {
      return false;
    }

    const position = markerSkipPosition(
      view.state.doc.toString(),
      selection.head,
      direction,
    );

    if (position === undefined) {
      return false;
    }

    view.dispatch({ selection: { anchor: position } });
    return true;
  };
}

function deleteEscapedBracket(direction: "backward" | "forward") {
  return (view: EditorView): boolean => {
    const selection = view.state.selection.main;

    if (!selection.empty) {
      return false;
    }

    const range = escapedBracketDeletionRange(
      view.state.doc.toString(),
      selection.head,
      direction,
    );

    if (!range) {
      return false;
    }

    view.dispatch({
      changes: { ...range, insert: "" },
      selection: { anchor: range.from },
      userEvent: `delete.${direction}`,
    });
    return true;
  };
}

function protectedDeletion(direction: "backward" | "forward") {
  const deleteEscaped = deleteEscapedBracket(direction);
  const skipMarker = skipHiddenMarker(direction);

  return (view: EditorView) => deleteEscaped(view) || skipMarker(view);
}

const protectedDeletionKeys: KeyBinding[] = [
  { key: "Backspace", run: protectedDeletion("backward") },
  { key: "Delete", run: protectedDeletion("forward") },
];

export const chordProtectedEditing = [
  EditorState.transactionFilter.of(removeNewlyEmptyChords),
  EditorView.inputHandler.of((view, from, to, text) => {
    const escapedText = escapeLiteralBrackets(text);

    if (escapedText === text) {
      return false;
    }

    view.dispatch({
      changes: { from, to, insert: escapedText },
      selection: { anchor: from + escapedText.length },
      userEvent: "input.type",
    });
    return true;
  }),
  EditorView.clipboardInputFilter.of(escapeLiteralBrackets),
  EditorView.clipboardOutputFilter.of(plainTextClipboardContent),
  Prec.highest(keymap.of(protectedDeletionKeys)),
];
