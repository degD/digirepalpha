import Link from "next/link";
import { notFound } from "next/navigation";
import { demoSongData } from "../../../lib/demo-song-data";
import { SongEditor } from "./song-editor";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const songId = Number(id);

  if (!Number.isSafeInteger(songId) || songId < 1) {
    notFound();
  }

  const song = demoSongData.find((item) => item.id === songId);

  if (!song) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white px-4 py-4 text-zinc-950">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <Link
          className="w-fit rounded px-1 py-1 font-medium underline focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
          href="/"
        >
          Back
        </Link>
        <header>
          <h1 className="text-xl font-semibold">{song.title}</h1>
          <p className="text-sm text-zinc-600">{song.tags.join(", ")}</p>
        </header>
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
            disabled
            type="button"
          >
            Size -
          </button>
          <button
            className="h-10 rounded border border-zinc-300 px-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
            disabled
            type="button"
          >
            Size +
          </button>
        </div>
        <label className="sr-only" htmlFor="song-editor">
          Song text
        </label>
        <SongEditor songId={song.id} />
      </div>
    </main>
  );
}
