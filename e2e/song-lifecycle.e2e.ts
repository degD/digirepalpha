import { expect, test } from "@playwright/test";
import { editor, savedSong, savedSongs, seedSongs, songLink } from "./support";

test("creates, edits, and persists a new song", async ({ page }) => {
  await seedSongs(page, [
    { id: 2, title: "Existing", tags: ["rock"], song: "Original" },
    { id: 8, title: "Other", tags: [], song: "Untouched" },
  ]);
  await page.goto("/");

  await page.getByRole("button", { name: "New Song" }).click();
  const addDialog = page.getByRole("dialog", { name: "Add new song" });
  await addDialog.getByLabel("Song title").fill("  New Song  ");
  await addDialog.getByRole("button", { name: "Add", exact: true }).click();

  await expect(page).toHaveURL("/editor/?id=9");
  await expect(page.getByRole("heading", { name: "New Song" })).toBeVisible();
  await editor(page).click();
  await page.keyboard.type("Line one\n<Em>Line two");
  await expect.poll(() => savedSong(page, 9)).toMatchObject({
    id: 9,
    title: "New Song",
    tags: [],
    song: ["Line one", String.raw`\<Em\>Line two`].join("\n"),
  });

  await page.getByRole("link", { name: "Back" }).click();
  await expect(songLink(page, 9)).toBeVisible();
  await page.reload();
  await songLink(page, 9).click();
  await expect(editor(page)).toHaveText("Line one<Em>Line two");
  await expect.poll(() => savedSong(page, 2)).toEqual({
    id: 2,
    title: "Existing",
    tags: ["rock"],
    song: "Original",
  });
});

test("does not create songs for cancelled or blank titles and allows duplicate titles", async ({
  page,
}) => {
  const songs = [{ id: 1, title: "Duplicate", tags: [], song: "" }];
  await seedSongs(page, songs);
  await page.goto("/");

  const addDialog = page.getByRole("dialog", { name: "Add new song" });

  await page.getByRole("button", { name: "New Song" }).click();
  await addDialog.getByRole("button", { name: "Cancel" }).click();
  await expect(addDialog).toHaveCount(0);
  await expect.poll(() => savedSongs(page)).toEqual(songs);

  await page.getByRole("button", { name: "New Song" }).click();
  await addDialog.getByLabel("Song title").fill("   ");
  await addDialog.getByRole("button", { name: "Add", exact: true }).click();
  await expect(addDialog.getByRole("alert")).toHaveText("A song title is required.");
  await addDialog.getByRole("button", { name: "Cancel" }).click();
  await expect.poll(() => savedSongs(page)).toEqual(songs);

  await page.getByRole("button", { name: "New Song" }).click();
  await addDialog.getByLabel("Song title").fill("Duplicate");
  await addDialog.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page).toHaveURL("/editor/?id=2");
  await expect.poll(() => savedSongs(page)).toEqual([
    ...songs,
    { id: 2, title: "Duplicate", tags: [], song: "" },
  ]);
});

test("deletes only the context-menu-selected song and persists the result", async ({
  page,
}) => {
  await seedSongs(page, [
    { id: 1, title: "Delete Me", tags: [], song: "" },
    { id: 2, title: "Keep Me", tags: [], song: "" },
  ]);
  await page.goto("/");

  await songLink(page, 1).click({ button: "right" });
  await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
  await expect(songLink(page, 2).locator("..").getByRole("button", { name: "Delete" })).toHaveCount(0);
  await page.getByRole("button", { name: "Delete" }).click();

  await expect(songLink(page, 1)).toHaveCount(0);
  await expect(songLink(page, 2)).toBeVisible();
  await expect.poll(() => savedSongs(page)).toEqual([
    { id: 2, title: "Keep Me", tags: [], song: "" },
  ]);
  await page.reload();
  await expect(songLink(page, 2)).toBeVisible();
});

test("uses long press for deletion while regular taps still navigate", async ({ page }) => {
  await seedSongs(page, [
    { id: 1, title: "Long Press", tags: [], song: "" },
    { id: 2, title: "Tap Song", tags: [], song: "" },
  ]);
  await page.goto("/");

  await songLink(page, 1).hover();
  await page.mouse.down();
  await page.waitForTimeout(550);
  await page.mouse.up();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(songLink(page, 1)).toHaveCount(0);

  await songLink(page, 2).click();
  await expect(page).toHaveURL("/editor/?id=2");
});

test("cancels a long press when the pointer moves or releases early", async ({ page }) => {
  await seedSongs(page, [{ id: 1, title: "Safe Song", tags: [], song: "" }]);
  await page.goto("/");

  await songLink(page, 1).hover();
  await page.mouse.down();
  const songBounds = await songLink(page, 1).boundingBox();
  expect(songBounds).not.toBeNull();
  await page.mouse.move(songBounds!.x + 4, songBounds!.y + 4);
  await page.mouse.up();
  await page.waitForTimeout(550);
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);

  await songLink(page, 1).hover();
  await page.mouse.down();
  await page.mouse.up();
  await expect(page).toHaveURL("/editor/?id=1");
});
