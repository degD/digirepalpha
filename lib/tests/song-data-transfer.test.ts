import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseSongDataBackup,
  serializeSongData,
  SONG_DATA_BACKUP_FILE_NAME,
} from "../song-data-transfer";
import type { SongData } from "../song-data";

const songs: SongData = [
  {
    id: 1,
    title: "Example Song",
    tags: ["practice", "acoustic"],
    song: "<Em>Line one\n<Lä>Line two",
  },
];

describe("song data transfer", () => {
  it("uses the stable backup filename", () => {
    assert.equal(SONG_DATA_BACKUP_FILE_NAME, "db.songs");
  });

  it("serializes and parses song data without changing it", () => {
    assert.deepEqual(parseSongDataBackup(serializeSongData(songs)), songs);
  });

  it("supports an empty song database", () => {
    assert.deepEqual(parseSongDataBackup("[]"), []);
  });

  it("rejects malformed JSON", () => {
    assert.throws(() => parseSongDataBackup("not json"), /not valid JSON/);
  });

  it("rejects data that is not a song array", () => {
    assert.throws(
      () => parseSongDataBackup('{"songs":[]}'),
      /does not contain valid song data/,
    );
  });

  it("rejects invalid song fields", () => {
    assert.throws(
      () =>
        parseSongDataBackup(
          JSON.stringify([
            { id: 1, title: "Example", tags: ["valid", 2], song: "Lyrics" },
          ]),
        ),
      /does not contain valid song data/,
    );
  });

  it("rejects duplicate and invalid IDs", () => {
    const duplicateIds = JSON.stringify([
      songs[0],
      { ...songs[0], title: "Duplicate" },
    ]);
    const invalidId = JSON.stringify([{ ...songs[0], id: 1.5 }]);

    assert.throws(() => parseSongDataBackup(duplicateIds), /valid song data/);
    assert.throws(() => parseSongDataBackup(invalidId), /valid song data/);
  });
});
