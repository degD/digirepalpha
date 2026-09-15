"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { demoSongData } from "../lib/demo-song-data";
import {
  createSong,
  deleteSong,
  formatSongTags,
  initializeSongData,
  saveSongData,
  type SongData,
} from "../lib/song-data";
import { searchSongs } from "../lib/song-search";

export default function Home() {
  const [query, setQuery] = useState("");
  const [songData, setSongData] = useState<SongData>([]);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressLinkClickRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(() => {
      if (!cancelled) {
        setSongData(initializeSongData(demoSongData));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current);
      }
    };
  }, []);

  const matchingSongs = searchSongs(songData, query);

  function handleNewSong() {
    const title = window.prompt("Song title");

    if (!title?.trim()) {
      return;
    }

    const song = createSong(songData, title);
    const updatedSongData = [...songData, song];

    saveSongData(updatedSongData);
    setSongData(updatedSongData);
    router.push(`/editor/?id=${song.id}`);
  }

  function cancelDeleteTimer() {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
  }

  function handleSongPointerDown(songId: number) {
    cancelDeleteTimer();
    deleteTimerRef.current = setTimeout(() => {
      deleteTimerRef.current = null;
      suppressLinkClickRef.current = true;
      setSelectedSongId(songId);
    }, 500);
  }

  function handleSongClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!suppressLinkClickRef.current) {
      return;
    }

    event.preventDefault();
    suppressLinkClickRef.current = false;
  }

  function handleSongContextMenu(
    event: MouseEvent<HTMLAnchorElement>,
    songId: number,
  ) {
    event.preventDefault();
    cancelDeleteTimer();
    setSelectedSongId(songId);
  }

  function handleSongDelete(songId: number) {
    const updatedSongData = deleteSong(songData, songId);

    saveSongData(updatedSongData);
    setSongData(updatedSongData);
    setSelectedSongId(null);
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-white text-zinc-950">
      <header className="shrink-0 border-b border-zinc-200">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
          <h1 className="text-lg font-semibold">DigiRep</h1>
          <label className="sr-only" htmlFor="song-search">
            Search songs
          </label>
          <input
            className="h-10 flex-1 rounded border border-zinc-300 px-3 outline-none focus:border-zinc-950"
            id="song-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles and tags"
            type="search"
            value={query}
          />
          <div className="flex gap-2">
            <button
              className="h-10 rounded border border-zinc-300 px-3 font-medium focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
              onClick={handleNewSong}
              type="button"
            >
              New Song
            </button>
            <Link
              className="h-10 rounded border border-zinc-300 px-3 font-medium focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
              href="/data"
            >
              Data
            </Link>
          </div>
        </div>
      </header>
      <section
        className="mx-auto min-h-0 w-full max-w-4xl flex-1 overflow-y-auto px-4 py-8"
        aria-label="Song results"
      >
        {matchingSongs.length === 0 ? (
          <p className="text-sm text-zinc-600">No songs found.</p>
        ) : (
          <ul className="divide-y divide-zinc-200">
            {matchingSongs.map((song) => (
              <li className="flex items-center gap-2" key={song.id}>
                <Link
                  className="block min-w-0 flex-1 rounded py-3 outline-none hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
                  href={`/editor/?id=${song.id}`}
                  onClick={handleSongClick}
                  onContextMenu={(event) => handleSongContextMenu(event, song.id)}
                  onPointerCancel={cancelDeleteTimer}
                  onPointerDown={() => handleSongPointerDown(song.id)}
                  onPointerMove={cancelDeleteTimer}
                  onPointerUp={cancelDeleteTimer}
                >
                  <strong className="block">{song.title}</strong>
                  <p className="text-sm text-zinc-600">{formatSongTags(song.tags)}</p>
                </Link>
                {selectedSongId === song.id && (
                  <button
                    className="h-10 shrink-0 rounded border border-red-300 px-3 font-medium text-red-700 focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
                    onClick={() => handleSongDelete(song.id)}
                    type="button"
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
