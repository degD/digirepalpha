import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  loadSongData,
  saveSongData,
  SONG_DATA_STORAGE_KEY,
  type SongData,
  type SongStorage,
} from "./song-data";

const songs: SongData = [
  {
    id: 1,
    title: "Example Song",
    tags: ["practice", "acoustic"],
    song: "<Em>Example lyrics",
  },
];

function createStorage(initialValue: string | null = null): SongStorage {
  let value = initialValue;

  return {
    getItem: () => value,
    setItem: (_key, newValue) => {
      value = newValue;
    },
  };
}

describe("song data storage", () => {
  it("returns an empty database when no data has been saved", () => {
    assert.deepEqual(loadSongData(createStorage()), []);
  });

  it("saves and loads song data", () => {
    const storage = createStorage();

    saveSongData(songs, storage);

    assert.deepEqual(loadSongData(storage), songs);
  });

  it("uses the stable song data storage key", () => {
    let key = "";
    const storage: SongStorage = {
      getItem: () => null,
      setItem: (storageKey) => {
        key = storageKey;
      },
    };

    saveSongData([], storage);

    assert.equal(key, SONG_DATA_STORAGE_KEY);
  });

  it("returns an empty database for malformed JSON", () => {
    assert.deepEqual(loadSongData(createStorage("not json")), []);
  });

  it("returns an empty database for data that is not a song array", () => {
    assert.deepEqual(loadSongData(createStorage('{"songs":[]}')), []);
  });

  it("returns an empty database when a song has invalid fields", () => {
    const invalidSongs = JSON.stringify([
      { id: 1, title: "Example", tags: ["valid", 2], song: "Lyrics" },
    ]);

    assert.deepEqual(loadSongData(createStorage(invalidSongs)), []);
  });

  it("returns an empty database when reading storage fails", () => {
    const storage: SongStorage = {
      getItem: () => {
        throw new Error("Read failed");
      },
      setItem: () => undefined,
    };

    assert.deepEqual(loadSongData(storage), []);
  });

  it("propagates storage write failures", () => {
    const storage: SongStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("Write failed");
      },
    };

    assert.throws(() => saveSongData(songs, storage), /Write failed/);
  });
});
