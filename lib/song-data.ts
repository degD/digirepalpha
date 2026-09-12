export interface SongItem {
  id: number;
  title: string;
  tags: string[];
  song: string;
}

export type SongData = SongItem[];

export interface SongStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const SONG_DATA_STORAGE_KEY = "digirepalpha.song-data";

function getBrowserStorage(): SongStorage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage;
}

function isSongItem(value: unknown): value is SongItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const song = value as Record<string, unknown>;

  return (
    typeof song.id === "number" &&
    Number.isFinite(song.id) &&
    typeof song.title === "string" &&
    Array.isArray(song.tags) &&
    song.tags.every((tag) => typeof tag === "string") &&
    typeof song.song === "string"
  );
}

export function loadSongData(storage = getBrowserStorage()): SongData {
  if (!storage) {
    return [];
  }

  try {
    const savedData = storage.getItem(SONG_DATA_STORAGE_KEY);

    if (!savedData) {
      return [];
    }

    const songData: unknown = JSON.parse(savedData);
    return Array.isArray(songData) && songData.every(isSongItem) ? songData : [];
  } catch {
    return [];
  }
}

export function saveSongData(
  songData: SongData,
  storage = getBrowserStorage(),
): void {
  if (!storage) {
    throw new Error("Song storage is unavailable.");
  }

  storage.setItem(SONG_DATA_STORAGE_KEY, JSON.stringify(songData));
}
