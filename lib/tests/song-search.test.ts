import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SongData } from "../song-data";
import { searchSongs } from "../song-search";

const songs: SongData = [
  { id: 1, title: "Midnight Current", tags: ["jazz"], song: "" },
  { id: 2, title: "Blue Room Shuffle", tags: ["blues"], song: "" },
  { id: 3, title: "Static on the Radio", tags: ["rock", "jazz"], song: "" },
];

describe("searchSongs", () => {
  it("returns all songs for an empty query", () => {
    assert.deepEqual(searchSongs(songs, ""), songs);
  });

  it("matches a partial title", () => {
    assert.deepEqual(searchSongs(songs, "night"), [songs[0]]);
  });

  it("matches a partial tag", () => {
    assert.deepEqual(searchSongs(songs, "jaz"), [songs[0], songs[2]]);
  });

  it("is case insensitive", () => {
    assert.deepEqual(searchSongs(songs, "BLUE"), [songs[1]]);
  });

  it("ignores surrounding query whitespace", () => {
    assert.deepEqual(searchSongs(songs, "  radio  "), [songs[2]]);
  });

  it("returns no songs when nothing matches", () => {
    assert.deepEqual(searchSongs(songs, "folk"), []);
  });

  it("preserves database order", () => {
    assert.deepEqual(
      searchSongs(songs, "jazz").map((song) => song.id),
      [1, 3],
    );
  });
});
