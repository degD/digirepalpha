import type { SongData } from "./song-data";

export function searchSongs(songs: SongData, query: string): SongData {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return songs;
  }

  return songs.filter(
    (song) =>
      song.title.toLowerCase().includes(normalizedQuery) ||
      song.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)),
  );
}
