"use client";

import { useEffect, useState } from "react";
import { demoSongData } from "../lib/demo-song-data";
import { saveSongData } from "../lib/song-data";
import { searchSongs } from "../lib/song-search";

export default function Home() {
  const [query, setQuery] = useState("");

  useEffect(() => {
    saveSongData(demoSongData);
  }, []);

  const matchingSongs = searchSongs(demoSongData, query);

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <header className="border-b border-zinc-200">
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
      <section className="mx-auto max-w-4xl px-4 py-8" aria-label="Song results">
        {matchingSongs.length === 0 ? (
          <p className="text-sm text-zinc-600">No songs found.</p>
        ) : (
          <ul className="divide-y divide-zinc-200">
            {matchingSongs.map((song) => (
              <li className="py-3" key={song.id}>
                <strong className="block">{song.title}</strong>
                <p className="text-sm text-zinc-600">{song.tags.join(", ")}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
