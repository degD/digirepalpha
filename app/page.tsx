"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createSong,
  deleteSong,
  loadSongData,
  normalizeSongTags,
  saveSongData,
  type SongData,
} from "../lib/song-data";
import { searchSongs } from "../lib/song-search";
import { tagClassName } from "../lib/tag-style";
import { BrandMark } from "./brand-mark";
import { ThemeToggle } from "./theme-toggle";

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
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

function PlusIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
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

function CloseIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M6 6l12 12M18 6 6 18" />
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
  const [isAddingSong, setIsAddingSong] = useState(false);
  const [newSongTitle, setNewSongTitle] = useState("");
  const [newSongTags, setNewSongTags] = useState<string[]>([]);
  const [newSongTagInput, setNewSongTagInput] = useState("");
  const [newSongTagOptions, setNewSongTagOptions] = useState<string[]>([]);
  const [newSongError, setNewSongError] = useState("");
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressLinkClickRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(() => {
      if (!cancelled) {
        setSongData(loadSongData());
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
    setNewSongTitle("");
    setNewSongTags([]);
    setNewSongTagInput("");
    setNewSongTagOptions(normalizeSongTags(songData.flatMap((song) => song.tags)));
    setNewSongError("");
    setIsAddingSong(true);
  }

  function handleAddNewSongTag() {
    setNewSongTags((tags) => normalizeSongTags([...tags, newSongTagInput]));
    setNewSongTagInput("");
  }

  function handleCreateSong(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = newSongTitle.trim();

    if (!title) {
      setNewSongError("A song title is required.");
      return;
    }

    const song = createSong(songData, title, newSongTags);
    const updatedSongData = [...songData, song];

    saveSongData(updatedSongData);
    setSongData(updatedSongData);
    setIsAddingSong(false);
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
    <main className="flex min-h-0 flex-1 flex-col bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="shrink-0 border-b border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg dark:bg-white">
              <BrandMark className="h-6 w-6" />
            </span>
            <span className="text-xl font-bold tracking-tight">DigiRep</span>
          </div>
          <div className="relative sm:flex-1">
            <label className="sr-only" htmlFor="song-search">
              Search songs
            </label>
            <SearchIcon />
            <input
              className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-400 dark:focus:bg-zinc-800"
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
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950 sm:flex-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus:outline-zinc-100"
              href="/data"
            >
              <ChartIcon />
              Data
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <section
        aria-label="Song results"
        className="mx-auto min-h-0 w-full max-w-5xl flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Songs</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Your repertoire at a glance</p>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{songCountLabel}</p>
          </div>
          {matchingSongs.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">No songs found.</p>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-100">
              {matchingSongs.map((song) => (
                <li className="flex items-center gap-2" key={song.id}>
                  <Link
                    className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2 py-3 outline-none transition hover:bg-zinc-50 focus:bg-zinc-50 focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800 dark:focus:outline-zinc-100"
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
                      className="h-10 shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus:outline-2 focus:outline-offset-2 focus:outline-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
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
      {isAddingSong && (
        <div
          aria-labelledby="add-song-title"
          aria-modal="true"
          className="fixed inset-0 z-10 flex items-end bg-black/40 sm:items-center sm:justify-center sm:p-4 dark:bg-black/60"
          role="dialog"
        >
          <form
            className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-zinc-900"
            onSubmit={handleCreateSong}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold tracking-tight" id="add-song-title">
                Add new song
              </h2>
              <button
                aria-label="Close"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus:outline-zinc-100"
                onClick={() => setIsAddingSong(false)}
                type="button"
              >
                <CloseIcon />
              </button>
            </div>
            <label
              className="mt-5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              htmlFor="new-song-title"
            >
              Song title
            </label>
            <input
              autoFocus
              className="mt-2 h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-indigo-900"
              id="new-song-title"
              onChange={(event) => setNewSongTitle(event.target.value)}
              placeholder="Enter song title..."
              value={newSongTitle}
            />
            <label
              className="mt-5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              htmlFor="new-song-tag-select"
            >
              Tags
            </label>
            <select
              className="mt-2 h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900"
              id="new-song-tag-select"
              onChange={(event) => {
                if (event.target.value) {
                  setNewSongTags((tags) =>
                    normalizeSongTags([...tags, event.target.value]),
                  );
                  event.target.value = "";
                }
              }}
              value=""
            >
              <option value="">Select existing tag</option>
              {newSongTagOptions.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            {newSongTags.length > 0 && (
              <ul aria-label="Selected tags" className="mt-3 flex flex-wrap gap-2">
                {newSongTags.map((tag) => (
                  <li key={tag}>
                    <button
                      aria-label={`Remove ${tag}`}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium ${tagClassName(tag)} focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950 dark:focus:outline-zinc-100`}
                      onClick={() =>
                        setNewSongTags((tags) => tags.filter((item) => item !== tag))
                      }
                      type="button"
                    >
                      {tag}
                      <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5 flex gap-2">
              <input
                aria-label="Or add a new tag"
                className="h-11 min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-indigo-900"
                id="new-song-tag-input"
                onChange={(event) => setNewSongTagInput(event.target.value)}
                placeholder="Or add a new tag..."
                value={newSongTagInput}
              />
              <button
                aria-label="Add tag"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition hover:bg-indigo-100 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900"
                onClick={handleAddNewSongTag}
                type="button"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
            {newSongError && (
              <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">
                {newSongError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="h-10 rounded-lg bg-zinc-100 px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-200 focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus:outline-zinc-100"
                onClick={() => setIsAddingSong(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="h-10 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600"
                type="submit"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
