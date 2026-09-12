import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { demoSongData } from "./demo-song-data";
import { loadSongData, saveSongData, type SongStorage } from "./song-data";

function createStorage(): SongStorage {
  let value: string | null = null;

  return {
    getItem: () => value,
    setItem: (_key, newValue) => {
      value = newValue;
    },
  };
}

describe("demo song data", () => {
  it("contains 20 songs with unique sequential IDs", () => {
    assert.equal(demoSongData.length, 20);
    assert.deepEqual(
      demoSongData.map((song) => song.id),
      Array.from({ length: 20 }, (_, index) => index + 1),
    );
  });

  it("contains titled songs with allowed tags and empty text", () => {
    const allowedTags = new Set(["jazz", "blues", "rock"]);

    for (const song of demoSongData) {
      assert.notEqual(song.title, "");
      assert.ok(song.tags.length > 0);
      assert.ok(song.tags.every((tag) => allowedTags.has(tag.toLowerCase())));
      assert.equal(song.song, "");
    }
  });

  it("can be saved and loaded as the demo database", () => {
    const storage = createStorage();

    saveSongData(demoSongData, storage);

    assert.deepEqual(loadSongData(storage), demoSongData);
  });
});
