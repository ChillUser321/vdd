import { expect, test } from "@playwright/test";

test("places zoom and history controls responsively", async ({ page }) => {
  await page.setViewportSize({ width: 1433, height: 898 });
  await page.goto("/");

  const editor = page.locator(".excalidraw").first();
  const zoomGroup = page.locator(".zoom-actions");
  const historyGroup = page.locator(".undo-redo-buttons");
  const toolbar = page.locator(".Island.App-toolbar").first();
  const library = page.locator(".sidebar-trigger.default-sidebar-trigger");
  const resetZoom = page.getByRole("button", { name: "Reset zoom" });
  const undo = page.getByRole("button", { name: "Undo" });
  const redo = page.getByRole("button", { name: "Redo" });

  await expect(editor).toBeVisible();
  await expect(resetZoom).toBeVisible();
  await expect(undo).toBeVisible();
  await expect(redo).toBeVisible();

  const [editorBox, zoomBox, historyBox, toolbarBox, libraryBox] = await Promise.all([
    editor.boundingBox(),
    zoomGroup.boundingBox(),
    historyGroup.boundingBox(),
    toolbar.boundingBox(),
    library.boundingBox(),
  ]);

  expect(editorBox).not.toBeNull();
  expect(zoomBox).not.toBeNull();
  expect(historyBox).not.toBeNull();
  expect(toolbarBox).not.toBeNull();
  expect(libraryBox).not.toBeNull();
  expect(Math.abs(zoomBox!.y - (editorBox!.y + 16))).toBeLessThanOrEqual(2);
  expect(Math.abs(historyBox!.y - (editorBox!.y + 16))).toBeLessThanOrEqual(2);
  expect(zoomBox!.x + zoomBox!.width).toBeLessThan(toolbarBox!.x);
  expect(historyBox!.x).toBeGreaterThan(toolbarBox!.x + toolbarBox!.width);
  expect(historyBox!.x + historyBox!.width).toBeLessThan(libraryBox!.x);

  await page.screenshot({ path: "test-results/top-controls-wide.png", fullPage: true });

  const zoomBefore = await resetZoom.textContent();
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(resetZoom).not.toHaveText(zoomBefore ?? "");

  await page.setViewportSize({ width: 1916, height: 1100 });
  await expect
    .poll(async () => {
      const [nextEditorBox, nextZoomBox, nextHistoryBox] = await Promise.all([
        editor.boundingBox(),
        zoomGroup.boundingBox(),
        historyGroup.boundingBox(),
      ]);
      return Boolean(
        nextEditorBox &&
          nextZoomBox &&
          nextHistoryBox &&
          Math.abs(nextZoomBox.y - (nextEditorBox.y + 16)) <= 2 &&
          Math.abs(nextHistoryBox.y - (nextEditorBox.y + 16)) <= 2,
      );
    })
    .toBe(true);

  await page.setViewportSize({ width: 1104, height: 900 });
  await expect
    .poll(async () => zoomGroup.boundingBox().then((box) => box?.y ?? 0))
    .toBeGreaterThan(700);
  await expect
    .poll(async () => historyGroup.boundingBox().then((box) => box?.y ?? 0))
    .toBeGreaterThan(700);
});
