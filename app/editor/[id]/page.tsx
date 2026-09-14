import Link from "next/link";
import { notFound } from "next/navigation";
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

  return (
    <main className="min-h-screen bg-white px-4 py-4 text-zinc-950">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <Link
          className="w-fit rounded px-1 py-1 font-medium underline focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
          href="/"
        >
          Back
        </Link>
        <SongEditor songId={songId} />
      </div>
    </main>
  );
}
