import { expect, test } from "@playwright/test";

test("keeps the main menu at the workspace top-left across supported widths", async ({ page }) => {
  for (const viewport of [
    { width: 768, height: 900 },
    { width: 1104, height: 1200 },
    { width: 1600, height: 1000 },
    { width: 1916, height: 1312 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const editor = page.locator(".excalidraw").first();
    const menu = page.locator(".main-menu-trigger").first();
    await expect(editor).toBeVisible();
    await expect(menu).toBeVisible();

    const [editorBox, menuBox] = await Promise.all([editor.boundingBox(), menu.boundingBox()]);
    expect(editorBox).not.toBeNull();
    expect(menuBox).not.toBeNull();
    expect(Math.abs(menuBox!.x - (editorBox!.x + 16))).toBeLessThanOrEqual(2);
    expect(Math.abs(menuBox!.y - (editorBox!.y + 16))).toBeLessThanOrEqual(2);

    await menu.click();
    await expect(page.locator(".dropdown-menu").first()).toBeVisible();
    await page.keyboard.press("Escape");
  }
});
