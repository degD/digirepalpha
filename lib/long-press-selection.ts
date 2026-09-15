import { EditorSelection } from "@codemirror/state";
import { ViewPlugin } from "@codemirror/view";

export const LONG_PRESS_DELAY_MS = 500;
export const LONG_PRESS_MOVE_TOLERANCE_PX = 5;

interface PendingPress {
  position: number;
  x: number;
  y: number;
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

  function selectWord() {
    if (!press || !view.state.selection.main.empty) {
      return;
    }

    const position = Math.min(press.position, view.state.doc.length);
    const word = view.state.wordAt(position);

    if (!word) {
      return;
    }

    view.dispatch({
      selection: EditorSelection.single(word.from, word.to),
      userEvent: "select.pointer",
    });
  }

  function handlePointerDown(event: PointerEvent) {
    if (event.pointerType !== "mouse" || event.button !== 0) {
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

    press = { position, x: event.clientX, y: event.clientY };
    viewWindow.addEventListener("pointermove", handlePointerMove);
    viewWindow.addEventListener("pointerup", clearPendingPress);
    viewWindow.addEventListener("pointercancel", clearPendingPress);
    timer = setTimeout(() => {
      timer = undefined;
      selectWord();
    }, LONG_PRESS_DELAY_MS);
  }

  view.contentDOM.addEventListener("pointerdown", handlePointerDown);

  return {
    destroy() {
      clearPendingPress();
      view.contentDOM.removeEventListener("pointerdown", handlePointerDown);
    },
  };
});
