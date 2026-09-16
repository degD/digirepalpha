import { BackLink } from "../back-link";
import { DataManager } from "./data-manager";

export default function DataPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col bg-zinc-50 px-4 py-6 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <BackLink />
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Data</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Export your song database for backup or replace it from a backup file.
          </p>
        </header>
        <DataManager />
      </div>
    </main>
  );
}
