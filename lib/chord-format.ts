export interface SourceRange {
  from: number;
  to: number;
}

export interface ChordRange extends SourceRange {
  contentFrom: number;
  contentTo: number;
}

export interface EscapedBracketRange extends SourceRange {
  bracket: "<" | ">";
}

export interface ChordFormat {
  chords: ChordRange[];
  escapedBrackets: EscapedBracketRange[];
}

export interface SourceChange extends SourceRange {
  insert: string;
}

export type SourceSelection = SourceRange;

export interface SourceTransformation {
  source: string;
  selection: SourceSelection;
}

function isEscaped(source: string, position: number): boolean {
  let backslashes = 0;

  for (let index = position - 1; index >= 0 && source[index] === "\\"; index--) {
    backslashes++;
  }

  return backslashes % 2 === 1;
}

function overlaps(first: SourceRange, second: SourceRange): boolean {
  return first.from < second.to && second.from < first.to;
}

export function scanChordFormat(source: string): ChordFormat {
  const escapedBrackets: EscapedBracketRange[] = [];
  const chords: ChordRange[] = [];

  for (let index = 0; index < source.length; index++) {
    const character = source[index];

    if ((character === "<" || character === ">") && isEscaped(source, index)) {
      escapedBrackets.push({ from: index - 1, to: index + 1, bracket: character });
    }
  }

  for (let from = 0; from < source.length; from++) {
    if (source[from] !== "<" || isEscaped(source, from)) {
      continue;
    }

    let to = from + 1;

    while (to < source.length && (source[to] !== ">" || isEscaped(source, to))) {
      to++;
    }

    if (to === source.length) {
      continue;
    }

    chords.push({ from, to: to + 1, contentFrom: from + 1, contentTo: to });
    from = to;
  }

  return { chords, escapedBrackets };
}

export function escapeLiteralBrackets(text: string): string {
  let escapedText = "";

  for (let index = 0; index < text.length; index++) {
    const character = text[index];

    if ((character === "<" || character === ">") && !isEscaped(text, index)) {
      escapedText += "\\";
    }

    escapedText += character;
  }

  return escapedText;
}

export function hiddenMarkerRanges(source: string): SourceRange[] {
  const format = scanChordFormat(source);

  return [
    ...format.chords.flatMap((chord) => [
      { from: chord.from, to: chord.from + 1 },
      { from: chord.to - 1, to: chord.to },
    ]),
    ...format.escapedBrackets.map(({ from }) => ({ from, to: from + 1 })),
  ].sort((first, second) => first.from - second.from);
}

export function plainTextClipboardContent(source: string): string {
  const markers = hiddenMarkerRanges(source);
  let text = "";
  let markerIndex = 0;

  for (let index = 0; index < source.length; index++) {
    while (markers[markerIndex]?.to <= index) {
      markerIndex++;
    }

    if (markers[markerIndex]?.from <= index && index < markers[markerIndex].to) {
      continue;
    }

    text += source[index];
  }

  return text;
}

export function touchesHiddenMarker(
  source: string,
  range: SourceRange,
): boolean {
  return hiddenMarkerRanges(source).some((marker) => overlaps(marker, range));
}

function mapPosition(
  position: number,
  changes: SourceChange[],
  association: -1 | 1,
): number {
  let offset = 0;

  for (const change of changes) {
    if (position < change.from || (position === change.from && association < 0)) {
      break;
    }

    if (position > change.to || (position === change.to && association > 0)) {
      offset += change.insert.length - (change.to - change.from);
      continue;
    }

    return change.from + offset + (association > 0 ? change.insert.length : 0);
  }

  return position + offset;
}

export function applySourceChanges(
  source: string,
  selection: SourceSelection,
  changes: SourceChange[],
): SourceTransformation {
  const sortedChanges = [...changes].sort(
    (first, second) => first.from - second.from || first.to - second.to,
  );
  let cursor = 0;
  let transformedSource = "";

  for (const change of sortedChanges) {
    if (change.from < cursor) {
      throw new Error("Source changes must not overlap.");
    }

    transformedSource += source.slice(cursor, change.from) + change.insert;
    cursor = change.to;
  }

  transformedSource += source.slice(cursor);

  return {
    source: transformedSource,
    selection: {
      from: mapPosition(selection.from, sortedChanges, -1),
      to: mapPosition(selection.to, sortedChanges, 1),
    },
  };
}

function plainTokenRanges(
  source: string,
  selection: SourceSelection,
  chords: ChordRange[],
): SourceRange[] {
  const ranges: SourceRange[] = [];
  let cursor = selection.from;

  for (const chord of chords) {
    if (!overlaps(chord, selection)) {
      continue;
    }

    ranges.push(...tokenRanges(source, cursor, Math.max(cursor, chord.from)));
    cursor = Math.max(cursor, chord.to);
  }

  ranges.push(...tokenRanges(source, cursor, selection.to));
  return ranges;
}

function tokenRanges(source: string, from: number, to: number): SourceRange[] {
  const ranges: SourceRange[] = [];
  const selectedText = source.slice(from, to);
  const tokenPattern = /\S+/g;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(selectedText))) {
    ranges.push({ from: from + match.index, to: from + match.index + match[0].length });
  }

  return ranges;
}

export function unchordSelection(
  source: string,
  selection: SourceSelection,
): SourceTransformation {
  const chords = scanChordFormat(source).chords.filter((chord) =>
    overlaps(chord, selection),
  );
  const changes = chords.flatMap((chord) => [
    { from: chord.from, to: chord.from + 1, insert: "" },
    { from: chord.to - 1, to: chord.to, insert: "" },
  ]);

  return applySourceChanges(source, selection, changes);
}

export function chordifySelection(
  source: string,
  selection: SourceSelection,
): SourceTransformation {
  if (selection.from === selection.to) {
    return { source, selection };
  }

  const chords = scanChordFormat(source).chords;
  const plainTokens = plainTokenRanges(source, selection, chords);

  if (plainTokens.length === 0) {
    return unchordSelection(source, selection);
  }

  return applySourceChanges(
    source,
    selection,
    plainTokens.map((token) => ({
      ...token,
      insert: `<${source.slice(token.from, token.to)}>`,
    })),
  );
}
