import Link from "next/link";
import { DataManager } from "./data-manager";

export default function DataPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-4 text-zinc-950">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <Link
          className="w-fit rounded px-1 py-1 font-medium underline focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
          href="/"
        >
          Back
        </Link>
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Data</h1>
          <p className="text-sm text-zinc-600">
            Export your song database for backup or replace it from a backup
            file.
          </p>
        </header>
        <DataManager />
      </div>
    </main>
  );
}
