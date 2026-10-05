"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { loadSongData, saveSongData } from "../../lib/song-data";
import {
  parseSongDataBackup,
  serializeSongData,
} from "../../lib/song-data-transfer";
import { exportSongDataBackup } from "../../lib/song-data-export";

const actionButtonClassName =
  "inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-50 px-4 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900";

const deleteActionButtonClassName =
  "inline-flex h-11 items-center gap-2 rounded-xl bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-100 focus:outline-2 focus:outline-offset-2 focus:outline-red-600 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900";

function DownloadIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}

function UploadIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M12 21V9" />
      <path d="m7 14 5-5 5 5" />
      <path d="M5 4h14" />
    </svg>
  );
}

function TrashIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function DataManager() {
  const [status, setStatus] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
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

  function handleDeleteAll() {
    const songData = loadSongData();
    const songCount = songData.length;

    if (songCount === 0) {
      setStatus("No songs to delete.");
      return;
    }

    const confirmed = window.confirm(
      `Delete all ${songCount} ${songCount === 1 ? "song" : "songs"}? This cannot be undone.`,
    );

    if (!confirmed) {
      setStatus("Delete cancelled.");
      return;
    }

    saveSongData([]);
    setStatus("Deleted all songs.");
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFileName(file.name);
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
    <div className="flex flex-col gap-4">
      <section className="flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-zinc-800 dark:text-zinc-100">
          <DownloadIcon />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Export</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Export all songs as a db.songs backup file.
          </p>
        </div>
        <button
          className={actionButtonClassName}
          onClick={handleExport}
          type="button"
        >
          <DownloadIcon className="h-4 w-4" />
          Export database
        </button>
      </section>
      <section className="flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-zinc-800 dark:text-zinc-100">
          <UploadIcon />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Import</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Import a backup file to replace your current song database.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <label
            className={`${actionButtonClassName} cursor-pointer ${isImporting ? "opacity-50" : ""}`}
          >
            <UploadIcon className="h-4 w-4" />
            Choose file
            <input
              aria-label="Choose a song database backup"
              accept="*/*"
              className="sr-only"
              disabled={isImporting}
              onChange={handleImport}
              ref={fileInputRef}
              type="file"
            />
          </label>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {selectedFileName || "No file selected."}
          </p>
        </div>
      </section>
      <section className="flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-zinc-800 dark:text-zinc-100">
          <TrashIcon />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Delete</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Delete all songs from this device. This cannot be undone.
          </p>
        </div>
        <button
          className={deleteActionButtonClassName}
          onClick={handleDeleteAll}
          type="button"
        >
          <TrashIcon className="h-4 w-4" />
          Delete all
        </button>
      </section>
      {status && (
        <p aria-live="polite" className="text-sm text-zinc-600 dark:text-zinc-400" role="status">
          {status}
        </p>
      )}
    </div>
  );
}
