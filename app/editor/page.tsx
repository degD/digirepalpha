import { Suspense } from "react";
import { BackLink } from "../back-link";
import { EditorRoute } from "./editor-route";

export default function EditorPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col bg-zinc-50 px-4 py-6 text-zinc-950">
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm sm:p-6">
        <BackLink />
        <Suspense fallback={<p className="text-sm text-zinc-600">Loading song...</p>}>
          <EditorRoute />
        </Suspense>
      </div>
    </main>
  );
}
