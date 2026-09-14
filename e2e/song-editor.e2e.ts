import { expect, test, type Page } from "@playwright/test";

const SONG_DATA_STORAGE_KEY = "digirepalpha.song-data";

interface TestSong {
  id: number;
  title: string;
  tags: string[];
  song: string;
}

async function seedSong(page: Page, song: TestSong) {
  await page.addInitScript(
    ({ storageKey, initialSong }) => {
      if (localStorage.getItem(storageKey) === null) {
        localStorage.setItem(storageKey, JSON.stringify([initialSong]));
      }
    },
    { storageKey: SONG_DATA_STORAGE_KEY, initialSong: song },
  );
}

async function savedSongText(page: Page): Promise<string | null> {
  return page.evaluate((storageKey) => {
    const savedData = localStorage.getItem(storageKey);

    return savedData ? JSON.parse(savedData)[0].song : null;
  }, SONG_DATA_STORAGE_KEY);
}

test("autosaves editor input and resets temporary font size after reload", async ({
  page,
}) => {
  await seedSong(page, { id: 1, title: "Test Song", tags: ["jazz"], song: "" });
  await page.goto("/editor/1");

  const editor = page.locator(".cm-content");
  await expect(editor).toBeVisible();
  await editor.click();
  await page.keyboard.type("Hello");

  await expect.poll(() => savedSongText(page)).toBe("Hello");
  await page.getByRole("button", { name: "Size +" }).click();
  await expect(editor).toHaveCSS("font-size", "18px");
  await expect.poll(() => savedSongText(page)).toBe("Hello");

  await page.reload();

  await expect(editor).toHaveText("Hello");
  await expect(editor).toHaveCSS("font-size", "16px");
});

test("renders chords and escapes typed literal brackets", async ({ page }) => {
  await seedSong(page, {
    id: 1,
    title: "Test Song",
    tags: ["jazz"],
    song: String.raw`<Em> \<literal\>`,
  });
  await page.goto("/editor/1");

  const editor = page.locator(".cm-content");
  await expect(editor.locator(".digirep-chord")).toHaveText("Em");
  await expect(editor).toHaveText("Em <literal>");

  await editor.click();
  await page.keyboard.press("End");
  await page.keyboard.type("<A>");

  await expect.poll(() => savedSongText(page)).toBe(String.raw`<Em> \<literal\>\<A\>`);
});

test("deletes a literal bracket with its hidden escape", async ({ page }) => {
  await seedSong(page, {
    id: 1,
    title: "Test Song",
    tags: ["jazz"],
    song: String.raw`\>`,
  });
  await page.goto("/editor/1");

  const editor = page.locator(".cm-content");
  await editor.click();
  await page.keyboard.press("End");
  await page.keyboard.press("Backspace");

  await expect.poll(() => savedSongText(page)).toBe("");
  await expect(editor).toHaveText("");
});

test("transposes chords, saves the result, and supports undo", async ({ page }) => {
  await seedSong(page, {
    id: 1,
    title: "Test Song",
    tags: ["jazz"],
    song: "<C> <Am7> <C/G> <Bb> lyrics",
  });
  await page.goto("/editor/1");

  const editor = page.locator(".cm-content");
  await page.getByRole("button", { name: "Transpose +" }).click();

  await expect.poll(() => savedSongText(page)).toBe("<C#> <A#m7> <C#/G#> <B> lyrics");
  await expect(editor).toHaveText("C# A#m7 C#/G# B lyrics");

  await editor.click();
  await page.keyboard.press("Control+Z");

  await expect.poll(() => savedSongText(page)).toBe("<C> <Am7> <C/G> <Bb> lyrics");
});

test("chordifies a selection and supports undo", async ({ page }) => {
  await seedSong(page, {
    id: 1,
    title: "Test Song",
    tags: ["jazz"],
    song: "A  minor\nB7",
  });
  await page.goto("/editor/1");

  const editor = page.locator(".cm-content");
  await editor.click();
  await page.keyboard.press("Control+A");
  await page.getByRole("button", { name: "Chordify" }).click();

  await expect.poll(() => savedSongText(page)).toBe("<A>  <minor>\n<B7>");
  await expect(editor.locator(".digirep-chord")).toHaveCount(3);

  await editor.click();
  await page.keyboard.press("Control+Z");

  await expect.poll(() => savedSongText(page)).toBe("A  minor\nB7");
});
