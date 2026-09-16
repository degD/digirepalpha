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

export function updateSongText(
  songData: SongData,
  songId: number,
  text: string,
): SongData {
  return songData.map((song) =>
    song.id === songId ? { ...song, song: text } : song,
  );
}

export function normalizeSongTags(tags: string[]): string[] {
  const normalizedTags: string[] = [];
  const tagNames = new Set<string>();

  for (const tag of tags) {
    const normalizedTag = tag.trim().toLocaleLowerCase();

    if (normalizedTag && !tagNames.has(normalizedTag)) {
      normalizedTags.push(normalizedTag);
      tagNames.add(normalizedTag);
    }
  }

  return normalizedTags;
}

export function updateSongMetadata(
  songData: SongData,
  songId: number,
  title: string,
  tags: string[],
): SongData {
  const normalizedTitle = title.trim();

  if (!normalizedTitle) {
    throw new Error("A song title is required.");
  }

  const normalizedTags = normalizeSongTags(tags);

  return songData.map((song) =>
    song.id === songId
      ? { ...song, title: normalizedTitle, tags: normalizedTags }
      : song,
  );
}

export function createSong(
  songData: SongData,
  title: string,
  tags: string[] = [],
): SongItem {
  const nextId = Math.max(0, ...songData.map((song) => song.id)) + 1;

  return {
    id: nextId,
    title: title.trim(),
    tags: normalizeSongTags(tags),
    song: "",
  };
}

export function deleteSong(songData: SongData, songId: number): SongData {
  return songData.filter((song) => song.id !== songId);
}
