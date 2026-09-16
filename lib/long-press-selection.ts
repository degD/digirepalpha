import { EditorSelection } from "@codemirror/state";
import { ViewPlugin } from "@codemirror/view";
import { hiddenMarkerRanges, type SourceRange } from "./chord-format";

export const LONG_PRESS_DELAY_MS = 200;
export const LONG_PRESS_MOVE_TOLERANCE_PX = 5;

interface PendingPress {
  position: number;
  x: number;
  y: number;
  pointerType: string;
}

export function nonWhitespaceTokenAt(
  source: string,
  position: number,
): SourceRange | undefined {
  if (position < 0 || position > source.length) {
    return undefined;
  }

  const markers = hiddenMarkerRanges(source);
  const inMarker = (index: number) =>
    markers.some((marker) => marker.from <= index && index < marker.to);

  if (inMarker(position)) {
    return undefined;
  }

  let from = position;
  let to = position;

  while (from > 0 && !/\s/.test(source[from - 1]) && !inMarker(from - 1)) {
    from--;
  }

  while (to < source.length && !/\s/.test(source[to]) && !inMarker(to)) {
    to++;
  }

  return from < to ? { from, to } : undefined;
}

export function tokenRangeAt(source: string, position: number): SourceRange {
  const clamped = Math.max(0, Math.min(position, source.length));

  return (
    nonWhitespaceTokenAt(source, clamped) ??
    nonWhitespaceTokenAt(source, clamped - 1) ?? {
      from: clamped,
      to: clamped,
    }
  );
}

export const longPressWordSelection = ViewPlugin.define((view) => {
  const viewWindow = view.dom.ownerDocument.defaultView ?? window;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let press: PendingPress | undefined;

  function handlePointerMove(event: PointerEvent) {
    if (!press) {
      return;
    }

    const movedX = Math.abs(event.clientX - press.x);
    const movedY = Math.abs(event.clientY - press.y);

    if (
      movedX > LONG_PRESS_MOVE_TOLERANCE_PX ||
      movedY > LONG_PRESS_MOVE_TOLERANCE_PX
    ) {
      clearPendingPress();
    }
  }

  function clearPendingPress() {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }

    if (press) {
      press = undefined;
      viewWindow.removeEventListener("pointermove", handlePointerMove);
      viewWindow.removeEventListener("pointerup", clearPendingPress);
      viewWindow.removeEventListener("pointercancel", clearPendingPress);
    }
  }

  function selectTokenRange(from: number, to: number) {
    const source = view.state.doc.toString();
    const start = tokenRangeAt(source, Math.min(from, to));
    const end = tokenRangeAt(source, Math.max(from, to));
    const range = { from: start.from, to: end.to };

    if (range.from >= range.to) {
      return;
    }

    const current = view.state.selection.main;

    if (current.from === range.from && current.to === range.to) {
      return;
    }

    view.dispatch({
      selection: EditorSelection.single(range.from, range.to),
      userEvent: "select.pointer",
    });
  }

  function selectWord() {
    if (!press || !view.state.selection.main.empty) {
      return;
    }

    selectTokenRange(press.position, press.position);
  }

  function handleSelectionChange() {
    if (!press || press.pointerType === "mouse") {
      return;
    }

    const selection = viewWindow.getSelection();

    if (
      !selection ||
      selection.isCollapsed ||
      !selection.anchorNode ||
      !selection.focusNode ||
      !view.contentDOM.contains(selection.anchorNode) ||
      !view.contentDOM.contains(selection.focusNode)
    ) {
      return;
    }

    let anchor: number;
    let head: number;

    try {
      anchor = view.posAtDOM(selection.anchorNode, selection.anchorOffset);
      head = view.posAtDOM(selection.focusNode, selection.focusOffset);
    } catch {
      return;
    }

    selectTokenRange(anchor, head);
  }

  function handlePointerDown(event: PointerEvent) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    clearPendingPress();

    const position = view.posAtCoords({
      x: event.clientX,
      y: event.clientY,
    });

    if (position === null) {
      return;
    }

    press = {
      position,
      x: event.clientX,
      y: event.clientY,
      pointerType: event.pointerType,
    };
    viewWindow.addEventListener("pointermove", handlePointerMove);
    viewWindow.addEventListener("pointerup", clearPendingPress);
    viewWindow.addEventListener("pointercancel", clearPendingPress);
    timer = setTimeout(() => {
      timer = undefined;
      selectWord();
    }, LONG_PRESS_DELAY_MS);
  }

  view.contentDOM.addEventListener("pointerdown", handlePointerDown);
  viewWindow.document.addEventListener("selectionchange", handleSelectionChange);

  return {
    destroy() {
      clearPendingPress();
      view.contentDOM.removeEventListener("pointerdown", handlePointerDown);
      viewWindow.document.removeEventListener("selectionchange", handleSelectionChange);
    },
  };
});
