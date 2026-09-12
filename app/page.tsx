"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { demoSongData } from "../lib/demo-song-data";
import { initializeSongData } from "../lib/song-data";
import { searchSongs } from "../lib/song-search";

export default function Home() {
  const [query, setQuery] = useState("");

  useEffect(() => {
    initializeSongData(demoSongData);
  }, []);

  const matchingSongs = searchSongs(demoSongData, query);

  return (
    <main className="flex h-dvh flex-col bg-white text-zinc-950">
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
              onClick={() => console.log("New Song")}
              type="button"
            >
              New Song
            </button>
            <button
              className="h-10 rounded border border-zinc-300 px-3 font-medium focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
              onClick={() => console.log("Data")}
              type="button"
            >
              Data
            </button>
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
              <li key={song.id}>
                <Link
                  className="block rounded py-3 outline-none hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
                  href={`/editor/${song.id}`}
                >
                  <strong className="block">{song.title}</strong>
                  <p className="text-sm text-zinc-600">{song.tags.join(", ")}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
