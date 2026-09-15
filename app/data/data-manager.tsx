"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { loadSongData, saveSongData } from "../../lib/song-data";
import {
  parseSongDataBackup,
  serializeSongData,
} from "../../lib/song-data-transfer";
import { exportSongDataBackup } from "../../lib/song-data-export";

export function DataManager() {
  const [status, setStatus] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleExport() {
    try {
      const songData = loadSongData();
      setStatus(await exportSongDataBackup(serializeSongData(songData)));
    } catch {
      setStatus("Could not export the song database.");
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsImporting(true);
    setStatus("");

    try {
      const importedSongData = parseSongDataBackup(await file.text());
      const songCount = importedSongData.length;
      const confirmed = window.confirm(
        `Replace the current database with ${songCount} imported ${songCount === 1 ? "song" : "songs"}? This cannot be undone.`,
      );

      if (!confirmed) {
        setStatus("Import cancelled.");
        return;
      }

      saveSongData(importedSongData);
      router.push("/");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Could not import the selected file.",
      );
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 border-t border-zinc-200 pt-6">
        <div>
          <h2 className="font-semibold">Export</h2>
          <p className="text-sm text-zinc-600">
            Export all songs as a <code>db.songs</code> backup file.
          </p>
        </div>
        <button
          className="h-10 w-fit rounded border border-zinc-300 px-3 font-medium focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
          onClick={handleExport}
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
          <span className="block pb-1 text-sm font-medium">
            Choose a song database backup
          </span>
          <input
            accept=".songs,application/json"
            disabled={isImporting}
            onChange={handleImport}
            ref={fileInputRef}
            type="file"
          />
        </label>
      </section>
      {status && (
        <p aria-live="polite" className="text-sm text-zinc-600" role="status">
          {status}
        </p>
      )}
    </div>
  );
}
