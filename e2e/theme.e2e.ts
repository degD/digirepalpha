import { expect, test } from "@playwright/test";
import { seedSongs } from "./support";

test("toggles the color scheme and persists it", async ({ page }) => {
  await page.goto("/");

  const html = page.locator("html");
  await expect(html).not.toHaveClass(/dark/);

  await page.getByRole("button", { name: "Switch to dark theme" }).click();

  await expect(html).toHaveClass(/dark/);
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("digirepalpha.preferences")),
    )
    .toContain("dark");

  await page.reload();
  await expect(html).toHaveClass(/dark/);
  await expect(
    page.getByRole("button", { name: "Switch to light theme" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(html).not.toHaveClass(/dark/);

  await page.reload();
  await expect(html).not.toHaveClass(/dark/);
});

test("applies the saved color scheme on other pages", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "digirepalpha.preferences",
      JSON.stringify({ colorScheme: "dark" }),
    );
  });
  await seedSongs(page, [
    { id: 1, title: "Night Song", tags: ["jazz"], song: "<C>Lyrics" },
  ]);
  await page.goto("/editor/?id=1");

  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("heading", { name: "Night Song" })).toBeVisible();
});
