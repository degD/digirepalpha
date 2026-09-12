"use client";

export default function Home() {
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
            placeholder="Search titles and tags"
            type="search"
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
        <p className="text-sm text-zinc-600">Your matching songs will appear here.</p>
      </section>
    </main>
  );
}
