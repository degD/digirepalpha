"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { demoSongData } from "../lib/demo-song-data";
import {
  createSong,
  deleteSong,
  initializeSongData,
  normalizeSongTags,
  saveSongData,
  type SongData,
} from "../lib/song-data";
import { searchSongs } from "../lib/song-search";

const defaultTagClassName = "bg-zinc-100 text-zinc-600";
const tagClassNames: Record<string, string> = {
  jazz: "bg-violet-100 text-violet-700",
  blues: "bg-blue-100 text-blue-700",
  rock: "bg-red-100 text-red-600",
};

function tagClassName(tag: string): string {
  return tagClassNames[tag.toLowerCase()] ?? defaultTagClassName;
}

function BrandMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6 text-indigo-600"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <rect height="6" rx="1.25" width="2.5" x="1" y="9" />
      <rect height="14" rx="1.25" width="2.5" x="6" y="5" />
      <rect height="20" rx="1.25" width="2.5" x="11" y="2" />
      <rect height="12" rx="1.25" width="2.5" x="16" y="6" />
      <rect height="4" rx="1.25" width="2.5" x="21" y="10" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M5 20v-9M12 20V4M19 20v-6" />
    </svg>
  );
}

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
  const songCountLabel = `${matchingSongs.length} ${
    matchingSongs.length === 1 ? "song" : "songs"
  }`;

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
    <main className="flex min-h-0 flex-1 flex-col bg-zinc-50 text-zinc-950">
      <header className="shrink-0 border-b border-zinc-100 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <BrandMark />
            <span className="text-xl font-bold tracking-tight">DigiRep</span>
          </div>
          <div className="relative sm:flex-1">
            <label className="sr-only" htmlFor="song-search">
              Search songs
            </label>
            <SearchIcon />
            <input
              className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
              id="song-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search titles and tags..."
              type="search"
              value={query}
            />
          </div>
          <div className="flex gap-2">
            <button
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 sm:flex-none"
              onClick={handleNewSong}
              type="button"
            >
              <PlusIcon />
              New Song
            </button>
            <Link
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950 sm:flex-none"
              href="/data"
            >
              <ChartIcon />
              Data
            </Link>
          </div>
        </div>
      </header>
      <section
        aria-label="Song results"
        className="mx-auto min-h-0 w-full max-w-5xl flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Songs</h1>
              <p className="text-sm text-zinc-500">Your repertoire at a glance</p>
            </div>
            <p className="text-sm text-zinc-500">{songCountLabel}</p>
          </div>
          {matchingSongs.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-600">No songs found.</p>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-100">
              {matchingSongs.map((song) => (
                <li className="flex items-center gap-2" key={song.id}>
                  <Link
                    className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2 py-3 outline-none transition hover:bg-zinc-50 focus:bg-zinc-50 focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
                    href={`/editor/?id=${song.id}`}
                    onClick={handleSongClick}
                    onContextMenu={(event) => handleSongContextMenu(event, song.id)}
                    onPointerCancel={cancelDeleteTimer}
                    onPointerDown={() => handleSongPointerDown(song.id)}
                    onPointerMove={cancelDeleteTimer}
                    onPointerUp={cancelDeleteTimer}
                  >
                    <strong className="font-semibold">{song.title}</strong>
                    {normalizeSongTags(song.tags).map((tag) => (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tagClassName(tag)}`}
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </Link>
                  {selectedSongId === song.id && (
                    <button
                      className="h-10 shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus:outline-2 focus:outline-offset-2 focus:outline-red-600"
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
        </div>
      </section>
    </main>
  );
}
