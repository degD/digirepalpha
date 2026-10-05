import type { SongData } from "./song-data";

export function searchSongs(songs: SongData, query: string): SongData {
  const normalizedQuery = query.trim().toLowerCase();

  const results = !normalizedQuery
    ? [...songs]
    : songs.filter(
        (song) =>
          song.title.toLowerCase().includes(normalizedQuery) ||
          song.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)),
      );

  return results.sort((first, second) =>
    first.title.localeCompare(second.title, undefined, { sensitivity: "base" }),
  );
}
