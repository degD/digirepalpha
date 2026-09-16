"use client";

import { useSearchParams } from "next/navigation";
import { SongEditor } from "./song-editor";

export function EditorRoute() {
  const searchParams = useSearchParams();
  const songId = Number(searchParams.get("id"));

  if (!Number.isSafeInteger(songId) || songId < 1) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">Invalid song.</p>;
  }

  return <SongEditor songId={songId} />;
}
