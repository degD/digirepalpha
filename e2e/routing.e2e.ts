import { expect, test } from "@playwright/test";
import { seedSongs } from "./support";

for (const path of ["/editor/foo", "/editor/0", "/editor/1.5"]) {
  test(`rejects invalid editor route ${path}`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
  });
}

test("shows a missing-song state for a valid route absent from storage", async ({ page }) => {
  await seedSongs(page, []);
  const response = await page.goto("/editor/99");

  expect(response?.status()).toBe(200);
  await expect(page.getByText("Song not found.")).toBeVisible();
});

test("initializes demo data when a valid editor route opens first", async ({ page }) => {
  await page.goto("/editor/1");

  await expect(page.getByRole("heading")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Song text" })).toBeVisible();
});
