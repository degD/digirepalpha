import { expect, test, type Page } from "@playwright/test";

const SONG_DATA_STORAGE_KEY = "digirepalpha.song-data";

interface TestSong {
  id: number;
  title: string;
  tags: string[];
  song: string;
}

async function seedSongs(page: Page, songs: TestSong[]) {
  await page.addInitScript(
    ({ storageKey, initialSongs }) => {
      localStorage.setItem(storageKey, JSON.stringify(initialSongs));
    },
    { storageKey: SONG_DATA_STORAGE_KEY, initialSongs: songs },
  );
}

async function savedSongs(page: Page): Promise<TestSong[]> {
  return page.evaluate((storageKey) => {
    const savedData = localStorage.getItem(storageKey);
    return savedData ? JSON.parse(savedData) : [];
  }, SONG_DATA_STORAGE_KEY);
}

test("exports the current song database", async ({ page }) => {
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
});

test("imports a valid backup and returns to search", async ({ page }) => {
  await seedSongs(page, [
    { id: 1, title: "Old Song", tags: [], song: "Old lyrics" },
  ]);
  await page.goto("/data");
  const importedSongs = [
    { id: 3, title: "Imported Song", tags: ["folk"], song: "<Am>New lyrics" },
  ];

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Choose a song database backup").setInputFiles({
    name: "db.songs",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(importedSongs)),
  });

  await page.waitForURL("/");
  await expect(page.getByRole("link", { name: "Imported Song" })).toBeVisible();
  await expect.poll(() => savedSongs(page)).toEqual(importedSongs);
});

test("keeps existing songs when import is cancelled or invalid", async ({ page }) => {
  const songs = [{ id: 1, title: "Existing Song", tags: [], song: "Lyrics" }];
  await seedSongs(page, songs);
  await page.goto("/data");

  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByLabel("Choose a song database backup").setInputFiles({
    name: "db.songs",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify([])),
  });

  await expect(page.getByRole("status")).toHaveText("Import cancelled.");
  await expect.poll(() => savedSongs(page)).toEqual(songs);

  await page.getByLabel("Choose a song database backup").setInputFiles({
    name: "invalid.songs",
    mimeType: "application/json",
    buffer: Buffer.from("not json"),
  });

  await expect(page.getByRole("status")).toHaveText(
    "The selected file is not valid JSON.",
  );
  await expect.poll(() => savedSongs(page)).toEqual(songs);
});
