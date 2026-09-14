"use client";

export function DataManager() {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 border-t border-zinc-200 pt-6">
        <div>
          <h2 className="font-semibold">Export</h2>
          <p className="text-sm text-zinc-600">
            Download all songs as a <code>db.songs</code> backup file.
          </p>
        </div>
        <button
          className="h-10 w-fit rounded border border-zinc-300 px-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
          disabled
          type="button"
        >
          Export database
        </button>
      </section>
      <section className="flex flex-col gap-3 border-t border-zinc-200 pt-6">
        <div>
          <h2 className="font-semibold">Import</h2>
          <p className="text-sm text-zinc-600">
            Importing a backup replaces every song currently stored on this
            device.
          </p>
        </div>
        <label className="w-fit">
          <span className="sr-only">Choose a song database backup</span>
          <input accept=".songs,application/json" disabled type="file" />
        </label>
      </section>
      <p aria-live="polite" className="text-sm text-zinc-600" role="status">
        Backup controls will be available shortly.
      </p>
    </div>
  );
}
