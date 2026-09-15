import type { Locator, Page } from "@playwright/test";

export const SONG_DATA_STORAGE_KEY = "digirepalpha.song-data";

export interface TestSong {
  id: number;
  title: string;
  tags: string[];
  song: string;
}

export async function seedSongs(page: Page, songs: TestSong[]) {
  await page.addInitScript(
    ({ storageKey, initialSongs }) => {
      const seededKey = `${storageKey}.e2e-seeded`;

      // Init scripts run after every document navigation. Seed only the first.
      if (sessionStorage.getItem(seededKey) === null) {
        localStorage.setItem(storageKey, JSON.stringify(initialSongs));
        sessionStorage.setItem(seededKey, "true");
      }
    },
    { storageKey: SONG_DATA_STORAGE_KEY, initialSongs: songs },
  );
}

export async function savedSongs(page: Page): Promise<TestSong[]> {
  return page.evaluate((storageKey) => {
    const savedData = localStorage.getItem(storageKey);
    return savedData ? JSON.parse(savedData) : [];
  }, SONG_DATA_STORAGE_KEY);
}

export async function savedSong(page: Page, id: number): Promise<TestSong | undefined> {
  return (await savedSongs(page)).find((song) => song.id === id);
}

export function editor(page: Page): Locator {
  return page.getByRole("textbox", { name: "Song text" });
}

export async function wordCenter(
  page: Page,
  word: string,
): Promise<{ x: number; y: number }> {
  await page.locator(".cm-content").waitFor();

  return page.evaluate((targetWord) => {
    const content = document.querySelector(".cm-content");

    if (!content) {
      throw new Error("Editor content not found.");
    }

    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();

    while (node) {
      const index = node.textContent?.indexOf(targetWord) ?? -1;

      if (index >= 0) {
        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + targetWord.length);
        const rect = range.getBoundingClientRect();

        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      }

      node = walker.nextNode();
    }

    throw new Error(`Word not found in the editor: ${targetWord}`);
  }, word);
}

export function songLink(page: Page, id: number): Locator {
  return page.locator(`a[href="/editor/?id=${id}"]`);
}

export async function setBackupFile(
  page: Page,
  content: string,
  name = "db.songs",
) {
  await page.getByLabel("Choose a song database backup").setInputFiles({
    name,
    mimeType: "application/json",
    buffer: Buffer.from(content),
  });
}
