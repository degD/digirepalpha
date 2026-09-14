import type { SongData, SongItem } from "./song-data";

export const SONG_DATA_BACKUP_FILE_NAME = "db.songs";

function isSongItem(value: unknown): value is SongItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const song = value as Record<string, unknown>;

  return (
    typeof song.id === "number" &&
    Number.isSafeInteger(song.id) &&
    song.id > 0 &&
    typeof song.title === "string" &&
    Array.isArray(song.tags) &&
    song.tags.every((tag) => typeof tag === "string") &&
    typeof song.song === "string"
  );
}

function isSongData(value: unknown): value is SongData {
  if (!Array.isArray(value) || !value.every(isSongItem)) {
    return false;
  }

  const songIds = new Set(value.map((song) => song.id));
  return songIds.size === value.length;
}

export function serializeSongData(songData: SongData): string {
  return JSON.stringify(songData);
}

export function parseSongDataBackup(content: string): SongData {
  let value: unknown;

  try {
    value = JSON.parse(content);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  if (!isSongData(value)) {
    throw new Error("The selected file does not contain valid song data.");
  }

  return value;
}
