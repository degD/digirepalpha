"use client";

import { useEffect, useRef, type FormEvent } from "react";
import { demoSongData } from "../../../lib/demo-song-data";
import {
  initializeSongData,
  saveSongData,
  updateSongText,
} from "../../../lib/song-data";

export function SongEditor({ songId }: { songId: number }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    <textarea
      className="min-h-96 w-full resize-y rounded border border-zinc-300 p-3 outline-none focus:border-zinc-950"
      id="song-editor"
      onInput={handleInput}
      placeholder="Write song text"
      ref={textareaRef}
    />
  );
}
