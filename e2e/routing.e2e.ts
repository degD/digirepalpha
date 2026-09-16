import { expect, test } from "@playwright/test";
import { seedSongs } from "./support";

for (const path of ["/editor/", "/editor/?id=foo", "/editor/?id=0", "/editor/?id=1.5"]) {
  test(`shows an invalid-song state for ${path}`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByText("Invalid song.")).toBeVisible();
  });
}

test("shows a missing-song state for a valid route absent from storage", async ({ page }) => {
  await seedSongs(page, []);
  const response = await page.goto("/editor/?id=99");

  expect(response?.status()).toBe(200);
  await expect(page.getByText("Song not found.")).toBeVisible();
});
