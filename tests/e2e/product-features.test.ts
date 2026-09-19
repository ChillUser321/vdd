import { expect, test } from "@playwright/test";

test("shows the larger-screen message on phones", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Requires a larger screen" })).toBeVisible();
  await expect(page.locator(".excalidraw")).toHaveCount(0);
  await page.screenshot({ path: "test-results/phone-screen-gate.png", fullPage: true });
});

test("keeps the editor usable on a tablet", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");
  await expect(page.locator(".excalidraw").first()).toBeVisible();
  await expect(page.getByLabel("Properties panel")).toBeHidden();
  const canvasShell = await page.locator("main section.relative").first().boundingBox();
  expect(canvasShell?.width).toBeGreaterThan(650);
  await page.screenshot({ path: "test-results/tablet-editor.png", fullPage: true });
});

test("keeps every editor control accessible at the smallest tablet width", async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 900 });
  await page.goto("/");
  await expect(page.locator(".excalidraw").first()).toBeVisible();
  for (const label of ["Project name", "Canvas width", "Canvas height"]) {
    const box = await page.getByLabel(label).boundingBox();
    expect(box).not.toBeNull();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(600);
  }
  for (const name of ["New page", "Open", "Save file"]) {
    const box = await page.getByRole("button", { name, exact: true }).boundingBox();
    expect(box).not.toBeNull();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(600);
  }
});

test("supports custom canvas measurements and restores autosaved work", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/");
  await page.getByLabel("Canvas width").fill("1600");
  await page.getByLabel("Canvas width").press("Enter");
  await page.getByLabel("Canvas height").fill("900");
  await page.getByLabel("Canvas height").press("Enter");
  await page.getByLabel("Project name").fill("Summer shawl");
  await page.getByRole("button", { name: "Symbols" }).click();
  await page.getByRole("button", { name: "Single Crochet", exact: true }).click();
  await page.waitForTimeout(700);
  await page.reload();
  await expect(page.getByLabel("Project name")).toHaveValue("Summer shawl");
  await expect(page.getByRole("combobox", { name: "Canvas" })).toHaveValue("CUSTOM");
  await expect(page.getByLabel("Canvas width")).toHaveValue("1600");
  await expect.poll(() => page.evaluate(() => window.__VDD_EXCALIDRAW_API__?.getSceneElements().length ?? 0)).toBe(1);
});

test("loads a bundled template", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Templates" }).click();
  await expect(page.locator(".main-menu-trigger")).toBeHidden();
  await page.getByRole("button", { name: "Granny Square" }).click();
  await expect(page.getByLabel("Project name")).toHaveValue("Granny Square");
  await expect.poll(() => page.evaluate(() => window.__VDD_EXCALIDRAW_API__?.getSceneElements().length ?? 0)).toBe(4);
});

test("renders existing and new geometric shapes without sketch roughness", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Templates" }).click();
  await page.getByRole("button", { name: "Circular Motif" }).click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const api = window.__VDD_EXCALIDRAW_API__;
        if (!api) return null;
        return {
          currentItemRoughness: api.getAppState().currentItemRoughness,
          roughness: api.getSceneElements().map((element) => element.roughness),
        };
      }),
    )
    .toEqual({ currentItemRoughness: 0, roughness: [0, 0, 0, 0] });

  await page.evaluate(() => {
    const api = window.__VDD_EXCALIDRAW_API__!;
    api.updateScene({
      elements: api.getSceneElements().map((element) => ({
        ...element,
        roughness: 2,
        version: element.version + 1,
      })),
      appState: { currentItemRoughness: 2 },
    });
  });
  await page.waitForTimeout(700);
  await page.reload();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const api = window.__VDD_EXCALIDRAW_API__;
        if (!api) return null;
        return {
          currentItemRoughness: api.getAppState().currentItemRoughness,
          roughness: api.getSceneElements().map((element) => element.roughness),
        };
      }),
    )
    .toEqual({ currentItemRoughness: 0, roughness: [0, 0, 0, 0] });
});

test("keeps native shape and text controls clear of an open sidebar", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/");
  await page.getByRole("button", { name: "Symbols" }).click();
  await page.getByRole("radio", { name: "Text" }).click({ force: true });

  const drawer = page.getByLabel("Elements drawer");
  const nativeControls = page.locator(".App-menu__left");
  await expect(drawer).toBeVisible();
  await expect(nativeControls).toBeVisible();

  const [drawerBox, controlsBox] = await Promise.all([
    drawer.boundingBox(),
    nativeControls.boundingBox(),
  ]);
  expect(drawerBox).not.toBeNull();
  expect(controlsBox).not.toBeNull();
  expect(controlsBox!.x).toBeGreaterThanOrEqual(drawerBox!.x + drawerBox!.width + 8);
  expect(controlsBox!.x + controlsBox!.width).toBeLessThanOrEqual(1600);
});

test("rotates a selected stitch by an exact angle", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Symbols" }).click();
  await page.getByRole("button", { name: "Single Crochet", exact: true }).click();
  await page.getByLabel("Stitch angle degrees").fill("45");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const element = window.__VDD_EXCALIDRAW_API__?.getSceneElements()[0];
        return element ? Math.round((element.angle * 180) / Math.PI) : null;
      }),
    )
    .toBe(45);
  await page.getByLabel("Stitch angle degrees").blur();

  await page.evaluate(() => {
    const api = window.__VDD_EXCALIDRAW_API__!;
    const element = api.getSceneElements()[0];
    api.updateScene({
      elements: [{ ...element, angle: Math.PI / 3, version: element.version + 1 }],
      appState: { selectedElementIds: { [element.id]: true } },
    });
  });
  await expect(page.getByRole("slider", { name: "Stitch angle", exact: true })).toHaveValue("60");
  await expect(page.getByLabel("Stitch angle degrees")).toHaveValue("60");
});

test("saves, opens, and starts an isolated blank page in a new tab", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/");
  await page.getByLabel("Project name").fill("Round trip pattern");
  await page.getByRole("button", { name: "Symbols" }).click();
  await page.getByRole("button", { name: "Single Crochet", exact: true }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save file" }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const savedProject = Buffer.concat(chunks);

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "New page" }).click();
  const newPage = await popupPromise;
  await newPage.waitForLoadState("domcontentloaded");
  await expect(newPage.getByLabel("Project name")).toHaveValue("Untitled pattern");
  await expect
    .poll(() => newPage.evaluate(() => window.__VDD_EXCALIDRAW_API__?.getSceneElements().length))
    .toBe(0);
  await expect(page.getByLabel("Project name")).toHaveValue("Round trip pattern");
  await expect
    .poll(() => page.evaluate(() => window.__VDD_EXCALIDRAW_API__?.getSceneElements().length))
    .toBe(1);

  await newPage.getByLabel("Open project file").setInputFiles({
    name: "round-trip-pattern.crochet.json",
    mimeType: "application/json",
    buffer: savedProject,
  });
  await expect(newPage.getByLabel("Project name")).toHaveValue("Round trip pattern");
  await expect
    .poll(() =>
      newPage.evaluate(() => ({
        elements: window.__VDD_EXCALIDRAW_API__?.getSceneElements().length ?? 0,
        files: Object.keys(window.__VDD_EXCALIDRAW_API__?.getFiles() ?? {}).length,
      })),
    )
    .toEqual({ elements: 1, files: 1 });
  await newPage.close();
});

test("creates a group and exports the artboard as SVG", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Symbols" }).click();
  await page.getByRole("button", { name: "Single Crochet", exact: true }).click();
  await page.getByRole("button", { name: "Duplicate stitch" }).click();
  await page.evaluate(() => {
    const api = window.__VDD_EXCALIDRAW_API__!;
    const elements = api.getSceneElements();
    api.updateScene({ appState: { selectedElementIds: Object.fromEntries(elements.map((element) => [element.id, true])) } });
  });
  await page.getByRole("button", { name: "Groups" }).click();
  await page.getByRole("button", { name: "Create from selected objects" }).click();
  await expect(page.getByLabel(/Group name/)).toHaveValue("Group 1");
  await page.getByRole("button", { name: "Export" }).click();
  await page.getByLabel("Format").selectOption("svg");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export full artboard" }).click();
  expect((await download).suggestedFilename()).toBe("untitled-pattern.svg");
  const zipDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export all groups as ZIP" }).click();
  expect((await zipDownload).suggestedFilename()).toBe("untitled-pattern-groups.zip");
});

test("mirrors native canvas groups and supports the complete group lifecycle", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Symbols" }).click();
  await page.getByRole("button", { name: "Single Crochet", exact: true }).click();
  await page.getByRole("button", { name: "Duplicate stitch" }).click();
  const point = await page.evaluate(() => {
    const api = window.__VDD_EXCALIDRAW_API__!;
    const elements = api.getSceneElements();
    api.updateScene({
      appState: { selectedElementIds: Object.fromEntries(elements.map((element) => [element.id, true])) },
    });
    const element = elements[1];
    const appState = api.getAppState();
    const zoom = appState.zoom.value;
    return {
      x: (element.x + element.width / 2 + appState.scrollX) * zoom + appState.offsetLeft,
      y: (element.y + element.height / 2 + appState.scrollY) * zoom + appState.offsetTop,
    };
  });
  await page.mouse.click(point.x, point.y, { button: "right" });
  await page.getByText("Group selection", { exact: true }).click();

  await page.getByRole("button", { name: "Groups" }).click();
  const groupName = page.locator('input[aria-label^="Group name"]');
  await expect(groupName).toHaveCount(1);
  await expect(page.getByText("2 objects", { exact: true })).toBeVisible();
  await groupName.fill("Joined stitches");
  await page.waitForTimeout(50);
  await page.reload();
  await page.getByRole("button", { name: "Groups" }).click();
  await expect(page.locator('input[aria-label^="Group name"]')).toHaveValue("Joined stitches");

  await page.getByRole("button", { name: "Select", exact: true }).click();
  await expect.poll(() => page.evaluate(() => Object.keys(window.__VDD_EXCALIDRAW_API__?.getAppState().selectedGroupIds ?? {}).length)).toBe(1);
  await page.getByRole("button", { name: "Hide", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__VDD_EXCALIDRAW_API__?.getSceneElements().every((element) => element.opacity === 0))).toBe(true);
  await page.getByRole("button", { name: "Show", exact: true }).click();
  await page.getByRole("button", { name: "Lock", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__VDD_EXCALIDRAW_API__?.getSceneElements().every((element) => element.locked))).toBe(true);
  await page.getByRole("button", { name: "Unlock", exact: true }).click();
  await page.getByRole("button", { name: "Ungroup", exact: true }).click();
  await expect(page.locator('input[aria-label^="Group name"]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__VDD_EXCALIDRAW_API__?.getSceneElements().every((element) => element.groupIds.length === 0))).toBe(true);
});
