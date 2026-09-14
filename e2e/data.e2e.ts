import { expect, test } from "@playwright/test";
import {
  SONG_DATA_STORAGE_KEY,
  savedSongs,
  seedSongs,
  setBackupFile,
  songLink,
} from "./support";

test("exports the current song database and reports download status", async ({ page }) => {
  const songs = [
    { id: 1, title: "Exported Song", tags: ["jazz"], song: "<C>Lyrics" },
  ];
  await seedSongs(page, songs);
  await page.goto("/data");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export database" }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let content = "";

  if (stream) {
    for await (const chunk of stream) {
      content += chunk;
    }
  }

  expect(download.suggestedFilename()).toBe("db.songs");
  expect(JSON.parse(content)).toEqual(songs);
  await expect(page.getByRole("status")).toHaveText("Backup download started.");
});

test("exports an empty database without initializing demo songs", async ({ page }) => {
  await seedSongs(page, []);
  await page.goto("/data");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export database" }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let content = "";

  if (stream) {
    for await (const chunk of stream) {
      content += chunk;
    }
  }

  expect(JSON.parse(content)).toEqual([]);
});

test("restores a downloaded backup after local data changes", async ({ page }) => {
  const songs = [
    {
      id: 4,
      title: "Round Trip",
      tags: ["folk", "Läve"],
      song: "<Am>Line one\nLine two",
    },
  ];
  await seedSongs(page, songs);
  await page.goto("/data");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export database" }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let backup = "";

  if (stream) {
    for await (const chunk of stream) {
      backup += chunk;
    }
  }

  await page.evaluate(
    ({ storageKey }) => localStorage.setItem(storageKey, "[]"),
    { storageKey: SONG_DATA_STORAGE_KEY },
  );
  page.once("dialog", (dialog) => dialog.accept());
  await setBackupFile(page, backup);

  await page.waitForURL("/");
  await expect.poll(() => savedSongs(page)).toEqual(songs);
  await songLink(page, 4).click();
  await expect(page.getByRole("heading", { name: "Round Trip" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Song text" })).toHaveText(
    "AmLine oneLine two",
  );
});

test("imports a backup as a complete replacement and persists it", async ({ page }) => {
  await seedSongs(page, [
    { id: 1, title: "Old Song", tags: [], song: "Old lyrics" },
  ]);
  await page.goto("/data");
  const importedSongs = [
    { id: 3, title: "Imported Song", tags: ["folk"], song: "<Am>New lyrics" },
    { id: 5, title: "Second Song", tags: ["live"], song: "Lä\nLyrics" },
  ];

  page.once("dialog", async (dialog) => {
    expect(dialog.type()).toBe("confirm");
    expect(dialog.message()).toBe(
      "Replace the current database with 2 imported songs? This cannot be undone.",
    );
    await dialog.accept();
  });
  await setBackupFile(page, JSON.stringify(importedSongs));

  await page.waitForURL("/");
  await expect(songLink(page, 3)).toBeVisible();
  await expect(songLink(page, 5)).toBeVisible();
  await expect(songLink(page, 1)).toHaveCount(0);
  await expect.poll(() => savedSongs(page)).toEqual(importedSongs);
  await page.reload();
  await songLink(page, 5).click();
  await expect(page.getByRole("textbox", { name: "Song text" })).toHaveText("LäLyrics");
});

test("keeps existing songs when import is cancelled", async ({ page }) => {
  const songs = [{ id: 1, title: "Existing Song", tags: [], song: "Lyrics" }];
  await seedSongs(page, songs);
  await page.goto("/data");

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toBe(
      "Replace the current database with 0 imported songs? This cannot be undone.",
    );
    await dialog.dismiss();
  });
  await setBackupFile(page, JSON.stringify([]));

  await expect(page.getByRole("status")).toHaveText("Import cancelled.");
  await expect.poll(() => savedSongs(page)).toEqual(songs);
});

test("imports an empty backup and preserves the empty database after reload", async ({
  page,
}) => {
  await seedSongs(page, [{ id: 1, title: "Existing Song", tags: [], song: "Lyrics" }]);
  await page.goto("/data");

  page.once("dialog", (dialog) => dialog.accept());
  await setBackupFile(page, "[]");
  await page.waitForURL("/");
  await expect(page.getByText("No songs found.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("No songs found.")).toBeVisible();
  await expect.poll(() => savedSongs(page)).toEqual([]);
});

test("rejects malformed and structurally invalid backups without changing data", async ({
  page,
}) => {
  const songs = [{ id: 1, title: "Existing Song", tags: [], song: "Lyrics" }];
  await seedSongs(page, songs);
  await page.goto("/data");

  await setBackupFile(page, "not json", "invalid.songs");
  await expect(page.getByRole("status")).toHaveText(
    "The selected file is not valid JSON.",
  );
  await expect.poll(() => savedSongs(page)).toEqual(songs);

  await setBackupFile(page, JSON.stringify([{ id: 1, title: "Invalid", tags: [2], song: "" }]));
  await expect(page.getByRole("status")).toHaveText(
    "The selected file does not contain valid song data.",
  );
  await expect.poll(() => savedSongs(page)).toEqual(songs);
});
