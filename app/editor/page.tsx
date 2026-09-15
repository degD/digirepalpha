import Link from "next/link";
import { Suspense } from "react";
import { EditorRoute } from "./editor-route";

function BackIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}

export default function EditorPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col bg-zinc-50 px-4 py-6 text-zinc-950">
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm sm:p-6">
        <Link
          className="inline-flex w-fit items-center gap-1.5 rounded-lg font-medium text-indigo-600 transition hover:text-indigo-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600"
          href="/"
        >
          <BackIcon />
          Back
        </Link>
        <Suspense fallback={<p className="text-sm text-zinc-600">Loading song...</p>}>
          <EditorRoute />
        </Suspense>
      </div>
    </main>
  );
}
