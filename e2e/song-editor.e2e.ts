import { expect, test } from "@playwright/test";
import { editor, savedSong, seedSongs } from "./support";

test("autosaves the edited record and resets temporary font size after reload", async ({
  page,
}) => {
  await seedSongs(page, [
    { id: 1, title: "First Song", tags: [], song: "Untouched" },
    { id: 2, title: "Test Song", tags: ["jazz"], song: "" },
    { id: 3, title: "Last Song", tags: [], song: "Unchanged" },
  ]);
  await page.goto("/editor/?id=2");

  const songEditor = editor(page);
  await expect(songEditor).toBeVisible();
  await songEditor.click();
  await page.keyboard.type("Hello\nLä");

  await expect.poll(() => savedSong(page, 2)).toMatchObject({ song: "Hello\nLä" });
  await expect.poll(() => savedSong(page, 1)).toMatchObject({ song: "Untouched" });
  await expect.poll(() => savedSong(page, 3)).toMatchObject({ song: "Unchanged" });

  await page.getByRole("button", { name: "Size +" }).click();
  await expect(songEditor).toHaveCSS("font-size", "18px");
  await page.reload();

  await expect(songEditor).toHaveText("HelloLä");
  await expect(songEditor).toHaveCSS("font-size", "16px");
});

test("renders chords and escapes typed literal brackets", async ({ page }) => {
  await seedSongs(page, [
    {
      id: 1,
      title: "Test Song",
      tags: ["jazz"],
      song: String.raw`<Em> \<literal\>`,
    },
  ]);
  await page.goto("/editor/?id=1");

  const songEditor = editor(page);
  await expect(songEditor.locator(".digirep-chord")).toHaveText("Em");
  await expect(songEditor).toHaveText("Em <literal>");

  await songEditor.click();
  await page.keyboard.press("End");
  await page.keyboard.type("<A>");

  await expect.poll(() => savedSong(page, 1)).toMatchObject({
    song: String.raw`<Em> \<literal\>\<A\>`,
  });
});

test("deletes an escaped literal bracket with its hidden escape using Backspace", async ({
  page,
}) => {
  await seedSongs(page, [
    { id: 1, title: "Test Song", tags: [], song: String.raw`\>` },
  ]);
  await page.goto("/editor/?id=1");

  const songEditor = editor(page);
  await songEditor.click();
  await page.keyboard.press("End");
  await page.keyboard.press("Backspace");
  await expect.poll(() => savedSong(page, 1)).toMatchObject({ song: "" });
  await expect(songEditor).toHaveText("");
});

test("deletes an escaped literal bracket with its hidden escape using Delete", async ({
  page,
}) => {
  await seedSongs(page, [
    { id: 1, title: "Test Song", tags: [], song: String.raw`\>` },
  ]);
  await page.goto("/editor/?id=1");

  const songEditor = editor(page);
  await songEditor.click();
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Delete");
  await expect.poll(() => savedSong(page, 1)).toMatchObject({ song: "" });
  await expect(songEditor).toHaveText("");
});

test("transposes in both directions, preserves unrecognized text, and supports undo", async ({
  page,
}) => {
  await seedSongs(page, [
    {
      id: 1,
      title: "Test Song",
      tags: [],
      song: "<C> <Am7> <C/G> <Bb> <lowercase>",
    },
  ]);
  await page.goto("/editor/?id=1");

  const songEditor = editor(page);
  await page.getByRole("button", { name: "Transpose +" }).click();
  await expect.poll(() => savedSong(page, 1)).toMatchObject({
    song: "<C#> <A#m7> <C#/G#> <B> <lowercase>",
  });
  await expect(songEditor).toHaveText("C# A#m7 C#/G# B lowercase");

  await page.getByRole("button", { name: "Transpose -" }).click();
  await expect.poll(() => savedSong(page, 1)).toMatchObject({
    song: "<C> <Am7> <C/G> <A#> <lowercase>",
  });

  await songEditor.click();
  await page.keyboard.press("ControlOrMeta+Z");
  await expect.poll(() => savedSong(page, 1)).toMatchObject({
    song: "<C#> <A#m7> <C#/G#> <B> <lowercase>",
  });
});

test("chordifies plain selections, unchordifies chord-only selections, and supports undo", async ({
  page,
}) => {
  await seedSongs(page, [
    { id: 1, title: "Test Song", tags: [], song: "A  minor\nB7" },
  ]);
  await page.goto("/editor/?id=1");

  const songEditor = editor(page);
  await songEditor.click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.getByRole("button", { name: "Chordify" }).click();
  await expect.poll(() => savedSong(page, 1)).toMatchObject({
    song: "<A>  <minor>\n<B7>",
  });
  await expect(songEditor.locator(".digirep-chord")).toHaveCount(3);

  await songEditor.click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.getByRole("button", { name: "Chordify" }).click();
  await expect.poll(() => savedSong(page, 1)).toMatchObject({ song: "A  minor\nB7" });

  await songEditor.click();
  await page.keyboard.press("ControlOrMeta+Z");
  await expect.poll(() => savedSong(page, 1)).toMatchObject({
    song: "<A>  <minor>\n<B7>",
  });
});

test("does not change a collapsed Chordify selection", async ({ page }) => {
  await seedSongs(page, [
    { id: 1, title: "Test Song", tags: [], song: "Am" },
  ]);
  await page.goto("/editor/?id=1");

  await editor(page).click();
  await page.getByRole("button", { name: "Chordify" }).click();
  await expect.poll(() => savedSong(page, 1)).toMatchObject({ song: "Am" });
});

test("enforces temporary font-size boundaries without changing song text", async ({
  page,
}) => {
  await seedSongs(page, [
    { id: 1, title: "Test Song", tags: [], song: "<Em>Lyrics" },
  ]);
  await page.goto("/editor/?id=1");

  const songEditor = editor(page);
  const decrease = page.getByRole("button", { name: "Size -" });
  const increase = page.getByRole("button", { name: "Size +" });

  await decrease.click();
  await decrease.click();
  await expect(songEditor).toHaveCSS("font-size", "12px");
  await expect(decrease).toBeDisabled();

  for (let index = 0; index < 10; index += 1) {
    await increase.click();
  }
  await expect(songEditor).toHaveCSS("font-size", "32px");
  await expect(increase).toBeDisabled();
  await expect.poll(() => savedSong(page, 1)).toMatchObject({ song: "<Em>Lyrics" });
});
