import Link from "next/link";
import { Suspense } from "react";
import { EditorRoute } from "./editor-route";

export default function EditorPage() {
  return (
    <main className="min-h-0 flex-1 bg-white px-4 py-4 text-zinc-950">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <Link
          className="w-fit rounded px-1 py-1 font-medium underline focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
          href="/"
        >
          Back
        </Link>
        <Suspense fallback={<p className="text-sm text-zinc-600">Loading song...</p>}>
          <EditorRoute />
        </Suspense>
      </div>
    </main>
  );
}
