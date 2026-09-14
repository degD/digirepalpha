"use client";

import { history, historyKeymap, standardKeymap } from "@codemirror/commands";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { useEffect, useRef, useState } from "react";
import { chordEditor } from "../../../lib/chord-editor";
import { demoSongData } from "../../../lib/demo-song-data";
import {
  initializeSongData,
  saveSongData,
  updateSongText,
} from "../../../lib/song-data";

function editorTheme(fontSize: number) {
  return EditorView.theme({
    "&": {
      minHeight: "24rem",
      border: "1px solid var(--color-zinc-300)",
      borderRadius: "0.25rem",
    },
    "&.cm-focused": { outline: "2px solid var(--color-zinc-950)", outlineOffset: "2px" },
    ".cm-content": {
      minHeight: "24rem",
      padding: "0.75rem",
      fontFamily: "inherit",
      fontSize: `${fontSize}px`,
    },
    ".cm-scroller": { fontFamily: "inherit" },
    ".digirep-chord": { color: "#7c3aed", fontWeight: "600" },
  });
}

export function SongEditor({ songId }: { songId: number }) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView>(null);
  const fontSizeCompartment = useRef(new Compartment());
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    const songData = initializeSongData(demoSongData);
    const song = songData.find((item) => item.id === songId);

    if (!editorContainerRef.current || !song) {
      return;
    }

    const editorView = new EditorView({
      state: EditorState.create({
        doc: song.song,
        extensions: [
          history(),
          keymap.of([...standardKeymap, ...historyKeymap]),
          EditorView.lineWrapping,
          chordEditor,
          EditorView.contentAttributes.of({ "aria-label": "Song text" }),
          fontSizeCompartment.current.of(editorTheme(16)),
          EditorView.domEventObservers({
            beforeinput: (event) => {
              const inputEvent = event as InputEvent;

              console.log({ inputType: inputEvent.inputType, data: inputEvent.data });
              return false;
            },
          }),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) {
              return;
            }

            const currentSongData = initializeSongData(demoSongData);
            saveSongData(
              updateSongText(currentSongData, songId, update.state.doc.toString()),
            );
          }),
        ],
      }),
      parent: editorContainerRef.current,
    });

    editorViewRef.current = editorView;

    return () => {
      editorView.destroy();
      editorViewRef.current = null;
    };
  }, [songId]);

  useEffect(() => {
    editorViewRef.current?.dispatch({
      effects: fontSizeCompartment.current.reconfigure(editorTheme(fontSize)),
    });
  }, [fontSize]);

  return (
    <>
      <div aria-label="Editor tools" className="flex flex-wrap gap-2">
        <button
          className="h-10 rounded border border-zinc-300 px-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
          disabled
          type="button"
        >
          Transpose -
        </button>
        <button
          className="h-10 rounded border border-zinc-300 px-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
          disabled
          type="button"
        >
          Transpose +
        </button>
        <button
          className="h-10 rounded border border-zinc-300 px-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
          disabled={fontSize === 12}
          onClick={() => setFontSize((size) => size - 2)}
          type="button"
        >
          Size -
        </button>
        <button
          className="h-10 rounded border border-zinc-300 px-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
          disabled={fontSize === 32}
          onClick={() => setFontSize((size) => size + 2)}
          type="button"
        >
          Size +
        </button>
      </div>
      <div ref={editorContainerRef} />
    </>
  );
}
