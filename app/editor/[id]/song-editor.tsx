"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { demoSongData } from "../../../lib/demo-song-data";
import {
  initializeSongData,
  saveSongData,
  updateSongText,
} from "../../../lib/song-data";

export function SongEditor({ songId }: { songId: number }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    const songData = initializeSongData(demoSongData);
    const song = songData.find((item) => item.id === songId);

    if (textareaRef.current && song) {
      textareaRef.current.value = song.song;
    }
  }, [songId]);

  function handleInput(event: FormEvent<HTMLTextAreaElement>) {
    const inputEvent = event.nativeEvent as InputEvent;
    const text = event.currentTarget.value;
    const songData = initializeSongData(demoSongData);

    console.log({ inputType: inputEvent.inputType, data: inputEvent.data });
    saveSongData(updateSongText(songData, songId, text));
  }

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
          onClick={() => setFontSize(fontSize - 2)}
          type="button"
        >
          Size -
        </button>
        <button
          className="h-10 rounded border border-zinc-300 px-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
          disabled={fontSize === 32}
          onClick={() => setFontSize(fontSize + 2)}
          type="button"
        >
          Size +
        </button>
      </div>
      <textarea
        className="min-h-96 w-full resize-y rounded border border-zinc-300 p-3 outline-none focus:border-zinc-950"
        id="song-editor"
        onInput={handleInput}
        placeholder="Write song text"
        ref={textareaRef}
        style={{ fontSize }}
      />
    </>
  );
}
