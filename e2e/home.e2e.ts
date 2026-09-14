import { expect, test } from "@playwright/test";
import { savedSongs, seedSongs, songLink } from "./support";

test("seeds demo songs once and preserves an explicitly empty database", async ({
  page,
}) => {
  await page.goto("/");

  const results = page.getByRole("region", { name: "Song results" });
  await expect(results.getByRole("link")).toHaveCount(20);
  await expect.poll(() => savedSongs(page)).toHaveLength(20);

  await page.reload();
  await expect(results.getByRole("link")).toHaveCount(20);

  const emptyPage = await page.context().newPage();
  await seedSongs(emptyPage, []);
  await emptyPage.goto("/");
  await expect(emptyPage.getByText("No songs found.")).toBeVisible();
  await emptyPage.reload();
  await expect(emptyPage.getByText("No songs found.")).toBeVisible();
  await expect.poll(() => savedSongs(emptyPage)).toEqual([]);
  await emptyPage.close();
});

test("searches titles and tags without searching song text", async ({ page }) => {
  await seedSongs(page, [
    { id: 1, title: "Midnight Current", tags: ["JAZZ"], song: "hidden phrase" },
    { id: 2, title: "Blue Room", tags: ["blues"], song: "other lyrics" },
    { id: 3, title: "Static Radio", tags: ["jazz"], song: "hidden phrase" },
  ]);
  await page.goto("/");

  const search = page.getByRole("searchbox", { name: "Search songs" });
  const results = page.getByRole("region", { name: "Song results" });

  await search.fill("  NIGHT ");
  await expect(results.getByRole("link")).toHaveCount(1);
  await expect(songLink(page, 1)).toBeVisible();

  await search.fill("JaZ");
  await expect(results.getByRole("link")).toHaveCount(2);
  await expect(
    await results
      .getByRole("link")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href"))),
  ).toEqual(["/editor/1", "/editor/3"]);

  await search.fill("hidden phrase");
  await expect(page.getByText("No songs found.")).toBeVisible();

  await search.fill("");
  await expect(results.getByRole("link")).toHaveCount(3);
});

test("navigates between search, editor, and data pages", async ({ page }) => {
  await seedSongs(page, [
    { id: 7, title: "Route Song", tags: ["folk", "live"], song: "Lyrics" },
  ]);
  await page.goto("/");

  await songLink(page, 7).click();
  await expect(page).toHaveURL("/editor/7");
  await expect(page.getByRole("heading", { name: "Route Song" })).toBeVisible();
  await expect(page.getByText("folk, live", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back" })).toBeVisible();

  await page.getByRole("link", { name: "Back" }).click();
  await expect(page).toHaveURL("/");
  await expect(songLink(page, 7)).toBeVisible();

  await page.getByRole("link", { name: "Data" }).click();
  await expect(page).toHaveURL("/data");
  await expect(page.getByRole("heading", { name: "Data" })).toBeVisible();
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page).toHaveURL("/");
});

test("keeps core search controls usable at a narrow viewport", async ({ page }) => {
  await seedSongs(page, [
    { id: 1, title: "Narrow Song", tags: ["practice"], song: "" },
  ]);
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");

  await expect(page.getByRole("searchbox", { name: "Search songs" })).toBeVisible();
  await expect(page.getByRole("button", { name: "New Song" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Data" })).toBeVisible();
  await expect(songLink(page, 1)).toBeVisible();
});
