import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createSong,
  deleteSong,
  initializeSongData,
  loadSongData,
  normalizeSongTags,
  saveSongData,
  SONG_DATA_STORAGE_KEY,
  type SongData,
  type SongStorage,
  updateSongMetadata,
  updateSongText,
} from "../song-data";

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
  it("creates a blank song with the next available ID", () => {
    assert.deepEqual(createSong([{ ...songs[0], id: 4 }], "  New Song  "), {
      id: 5,
      title: "New Song",
      tags: [],
      song: "",
    });
  });

  it("deletes only the selected song", () => {
    const otherSong = { ...songs[0], id: 2, title: "Other Song" };

    assert.deepEqual(deleteSong([...songs, otherSong], 1), [otherSong]);
    assert.deepEqual(deleteSong(songs, 2), songs);
  });

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

  it("seeds a missing database once", () => {
    const storage = createStorage();

    assert.deepEqual(initializeSongData(songs, storage), songs);
    assert.deepEqual(loadSongData(storage), songs);
  });

  it("preserves an existing database during initialization", () => {
    const storage = createStorage(JSON.stringify([]));

    assert.deepEqual(initializeSongData(songs, storage), []);
    assert.deepEqual(loadSongData(storage), []);
  });

  it("updates only the selected song text", () => {
    const otherSong = {
      id: 2,
      title: "Other Song",
      tags: ["rock"],
      song: "Original lyrics",
    };
    const updatedSongs = updateSongText([...songs, otherSong], 1, "New lyrics");

    assert.equal(updatedSongs[0].song, "New lyrics");
    assert.equal(updatedSongs[0].title, songs[0].title);
    assert.equal(updatedSongs[0].tags, songs[0].tags);
    assert.deepEqual(updatedSongs[1], otherSong);
  });

  it("leaves song data unchanged for an unknown ID", () => {
    assert.deepEqual(updateSongText(songs, 2, "New lyrics"), songs);
  });

  it("normalizes tags by trimming and deduplicating without changing casing", () => {
    assert.deepEqual(normalizeSongTags([" jazz ", "JAZZ", "", "Rock", " rock "]), [
      "jazz",
      "Rock",
    ]);
  });

  it("updates song metadata without replacing its text", () => {
    const otherSong = { ...songs[0], id: 2, title: "Other Song" };
    const updatedSongs = updateSongMetadata(
      [...songs, otherSong],
      1,
      "  Updated Song  ",
      [" jazz ", "JAZZ", "practice"],
    );

    assert.deepEqual(updatedSongs[0], {
      id: 1,
      title: "Updated Song",
      tags: ["jazz", "practice"],
      song: "<Em>Example lyrics",
    });
    assert.deepEqual(updatedSongs[1], otherSong);
  });

  it("rejects an empty title when updating metadata", () => {
    assert.throws(
      () => updateSongMetadata(songs, 1, "   ", []),
      /A song title is required/,
    );
  });
});
