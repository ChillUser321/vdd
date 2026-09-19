import { expect, test } from "@playwright/test";

test("renders the editor shell with an empty Excalidraw canvas", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Violet Drizzle Designer" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Templates" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Properties" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Canvas" })).toHaveValue("A4_PORTRAIT");
  await expect(
    page.locator("main section.relative").getByText("A4 portrait", { exact: true }),
  ).toHaveCount(0);

  const editor = page.locator(".excalidraw").first();
  await expect(editor).toBeVisible();

  const editorBox = await editor.boundingBox();
  expect(editorBox?.width).toBeGreaterThan(400);
  expect(editorBox?.height).toBeGreaterThan(500);

  const canvases = page.locator("canvas");
  await expect(canvases.first()).toBeVisible();
  await expect(canvases).not.toHaveCount(0);

  await page.screenshot({
    path: "test-results/editor-smoke.png",
    fullPage: true,
  });
});

test("keeps the TikTok artboard as an overlay inside a full workspace", async ({ page }) => {
  await page.setViewportSize({ width: 1800, height: 1200 });
  await page.goto("/");

  await page.getByRole("combobox", { name: "Canvas" }).selectOption("TIKTOK_9_16");
  await expect(page.getByRole("combobox", { name: "Canvas" })).toHaveValue("TIKTOK_9_16");
  await page.waitForFunction(() => Boolean(window.__VDD_EXCALIDRAW_API__));

  const editor = page.locator(".excalidraw").first();
  const editorBox = await editor.boundingBox();

  expect(editorBox?.height).toBeGreaterThan(1000);
  expect(editorBox?.width).toBeGreaterThan(1300);

  await expect(page.getByTestId("artboard-overlay")).toBeVisible();

  await expect
    .poll(async () =>
      page.getByTestId("artboard-overlay").boundingBox().then((artboardBox) => {
        if (!artboardBox || !editorBox) {
          return false;
        }

        const artboardCenter = {
          x: artboardBox.x + artboardBox.width / 2,
          y: artboardBox.y + artboardBox.height / 2,
        };
        const editorCenter = {
          x: editorBox.x + editorBox.width / 2,
          y: editorBox.y + editorBox.height / 2,
        };

        return (
          Math.abs(artboardCenter.x - editorCenter.x) <= 2 &&
          Math.abs(artboardCenter.y - editorCenter.y) <= 2 &&
          Math.abs(artboardBox.width / artboardBox.height - 9 / 16) <= 0.01 &&
          artboardBox.width > 500 &&
          artboardBox.height > 900 &&
          artboardBox.width < editorBox.width &&
          artboardBox.height < editorBox.height
        );
      }),
    )
    .toBe(true);

  await expect
    .poll(async () =>
      page.evaluate(() => window.__VDD_EXCALIDRAW_API__?.getSceneElements().length ?? -1),
    )
    .toBe(0);

  await page.screenshot({
    path: "test-results/editor-tiktok-fit.png",
    fullPage: true,
  });
});

test("shows the ported crochet symbol library", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/");

  const editor = page.locator(".excalidraw").first();
  const editorBoxBeforeDrawer = await editor.boundingBox();

  await page.getByRole("button", { name: "Symbols" }).click();

  const drawer = page.getByLabel("Elements drawer");
  await expect(drawer).toBeVisible();
  await expect(page.getByRole("heading", { name: "Elements" })).toBeVisible();
  await expect(page.getByPlaceholder("Search symbols")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Basic Stitches" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Single Crochet", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Double Crochet", exact: true })).toBeVisible();

  const drawerBox = await drawer.boundingBox();
  const editorBoxAfterDrawer = await editor.boundingBox();
  const propertiesBox = await page.getByRole("heading", { name: "Properties" }).boundingBox();
  expect(editorBoxAfterDrawer?.x).toBe(editorBoxBeforeDrawer?.x);
  expect(editorBoxAfterDrawer?.width).toBe(editorBoxBeforeDrawer?.width);
  expect(drawerBox?.x).toBeGreaterThanOrEqual(70);
  expect(drawerBox?.x).toBeLessThan(90);
  expect(propertiesBox?.x).toBeGreaterThan(1300);

  await page.screenshot({
    path: "test-results/editor-symbol-library.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "Symbols" }).click();
  await expect(page.getByLabel("Elements drawer")).toBeHidden();
  const editorBoxAfterClose = await editor.boundingBox();
  expect(editorBoxAfterClose?.x).toBe(editorBoxBeforeDrawer?.x);
  expect(editorBoxAfterClose?.width).toBe(editorBoxBeforeDrawer?.width);

  await page.screenshot({
    path: "test-results/editor-symbol-library-closed.png",
    fullPage: true,
  });
});

test("renders editable square and polar guide overlays", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/");

  await page.waitForFunction(() => Boolean(window.__VDD_EXCALIDRAW_API__));
  await expect(page.getByTestId("guide-overlay")).toBeVisible();
  await expect
    .poll(async () => page.locator('[data-guide-type="square-grid"] [data-guide-part]').count())
    .toBeGreaterThan(50);

  await page.getByRole("button", { name: "Guides" }).click();

  const drawer = page.getByLabel("Guides drawer");
  await expect(drawer).toBeVisible();
  await expect(page.getByRole("heading", { name: "Guides" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Grid", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Polar", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Half polar", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Quarter polar", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Square grid square-grid/ })).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: "Opacity %" })).toHaveValue("20");
  await expect(page.getByRole("spinbutton", { name: "Scale" })).toHaveValue("0.5");

  await page.getByLabel("Snap").check();
  await expect(page.getByLabel("Snap")).toBeChecked();

  const horizontalInput = page.getByRole("spinbutton", { name: "Horizontal" });
  await horizontalInput.fill("32");
  await expect(horizontalInput).toHaveValue("32");

  await page.getByRole("button", { name: "Polar", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Polar grid 1 polar-grid/ })).toBeVisible();
  await page.getByLabel("Rings").fill("6");
  await page.getByLabel("Ring spacing").fill("36");
  await expect(page.getByLabel("Rings")).toHaveValue("6");
  await expect(page.getByLabel("Arc size")).toHaveValue("360");
  await expect
    .poll(async () =>
      page.locator('[data-guide-type="polar-grid"] [data-guide-part="polar-ring"]').count(),
    )
    .toBe(6);

  await page.screenshot({
    path: "test-results/editor-guides-panel.png",
    fullPage: true,
  });
});

test("adds multiple guide layers including half and quarter polar guides", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/");

  await page.waitForFunction(() => Boolean(window.__VDD_EXCALIDRAW_API__));
  await page.getByRole("button", { name: "Guides" }).click();

  await page.getByRole("button", { name: "Polar", exact: true }).click();
  await page.getByRole("button", { name: "Polar", exact: true }).click();
  await page.getByRole("button", { name: "Polar", exact: true }).click();
  await page.getByRole("button", { name: "Half polar", exact: true }).click();
  await page.getByRole("button", { name: "Quarter polar", exact: true }).click();

  await expect(page.getByRole("button", { name: /^Square grid square-grid/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Polar grid 1 polar-grid/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Polar grid 2 polar-grid/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Polar grid 3 polar-grid/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Half polar grid 1 polar-grid/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Quarter polar grid 1 polar-grid/ }),
  ).toBeVisible();
  await expect(page.getByLabel("Arc size")).toHaveValue("90");

  await expect(page.locator('[data-guide-type="polar-grid"]')).toHaveCount(5);
  await expect(page.locator('[data-guide-type="polar-grid"][data-guide-sweep="360"]')).toHaveCount(
    3,
  );
  await expect(page.locator('[data-guide-type="polar-grid"][data-guide-sweep="180"]')).toHaveCount(
    1,
  );
  await expect(page.locator('[data-guide-type="polar-grid"][data-guide-sweep="90"]')).toHaveCount(
    1,
  );

  await page.screenshot({
    path: "test-results/editor-guides-multiple.png",
    fullPage: true,
  });
});

test("duplicates and deletes guide layers from the floating guide panel", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/");

  await page.waitForFunction(() => Boolean(window.__VDD_EXCALIDRAW_API__));
  await page.getByRole("button", { name: "Guides" }).click();
  await expect(page.getByLabel("Guide controls")).toBeVisible();

  await page.getByRole("button", { name: "Polar", exact: true }).click();
  await page.getByRole("button", { name: "Duplicate guide" }).click();

  await expect(page.getByRole("button", { name: /^Polar grid 1 polar-grid/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Polar grid 1 copy polar-grid/ })).toBeVisible();
  await expect(page.locator('[data-guide-type="polar-grid"]')).toHaveCount(2);

  await page.getByRole("button", { name: "Delete guide" }).click();
  await expect(page.getByRole("button", { name: /^Polar grid 1 copy polar-grid/ })).toBeHidden();
  await expect(page.locator('[data-guide-type="polar-grid"]')).toHaveCount(1);

  await page.screenshot({
    path: "test-results/editor-guide-duplicate-delete.png",
    fullPage: true,
  });
});

test("snaps inserted stitch objects to the active square guide", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/");

  await page.waitForFunction(() => Boolean(window.__VDD_EXCALIDRAW_API__));
  await page.getByRole("button", { name: "Guides" }).click();
  await page.getByLabel("Snap").check();
  await page.getByRole("button", { name: "Symbols" }).click();
  await page.getByRole("button", { name: "Single Crochet", exact: true }).click();
  await expect(page.getByLabel("Elements drawer")).toBeVisible();
  await expect(page.getByLabel("Stitch controls")).toBeVisible();
  await expect(page.getByLabel("Stitch opacity")).toHaveValue("100");
  await expect(page.locator(".App-menu__left")).toBeHidden();

  const drawerBox = await page.getByLabel("Elements drawer").boundingBox();
  const floatingPanelBox = await page.getByLabel("Stitch controls").boundingBox();
  expect(floatingPanelBox?.x).toBeGreaterThan((drawerBox?.x ?? 0) + (drawerBox?.width ?? 0));

  await expect
    .poll(async () =>
      page.evaluate(() => {
        const imageElement = window.__VDD_EXCALIDRAW_API__
          ?.getSceneElements()
          .find((element) => element.type === "image");

        if (!imageElement) {
          return null;
        }

        return {
          centerX: imageElement.x + imageElement.width / 2,
          centerY: imageElement.y + imageElement.height / 2,
        };
      }),
    )
    .toEqual({ centerX: 0, centerY: 0 });

  const dragStart = await page.evaluate(() => {
    const api = window.__VDD_EXCALIDRAW_API__;
    const imageElement = api?.getSceneElements().find((element) => element.type === "image");

    if (!api || !imageElement) {
      return null;
    }

    const appState = api.getAppState();
    const zoom = appState.zoom.value;

    return {
      viewportX:
        (imageElement.x + imageElement.width / 2 + appState.scrollX) * zoom +
        appState.offsetLeft,
      viewportY:
        (imageElement.y + imageElement.height / 2 + appState.scrollY) * zoom +
        appState.offsetTop,
    };
  });

  expect(dragStart).not.toBeNull();
  await page.mouse.move(dragStart!.viewportX, dragStart!.viewportY);
  await page.mouse.down();
  await page.mouse.move(dragStart!.viewportX + 35, dragStart!.viewportY + 35, {
    steps: 8,
  });
  await page.mouse.up();

  await expect
    .poll(async () =>
      page.evaluate(() => {
        const imageElement = window.__VDD_EXCALIDRAW_API__
          ?.getSceneElements()
          .find((element) => element.type === "image");

        if (!imageElement) {
          return null;
        }

        return {
          centerX: imageElement.x + imageElement.width / 2,
          centerY: imageElement.y + imageElement.height / 2,
        };
      }),
    )
    .toEqual({ centerX: 48, centerY: 48 });

  await page.screenshot({
    path: "test-results/editor-symbol-snapped-to-grid.png",
    fullPage: true,
  });
});

test("moves the selected guide with the mouse handle", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/");

  await page.waitForFunction(() => Boolean(window.__VDD_EXCALIDRAW_API__));
  await page.getByRole("button", { name: "Guides" }).click();

  const xInput = page.getByRole("spinbutton", { name: "X", exact: true });
  const yInput = page.getByRole("spinbutton", { name: "Y", exact: true });
  await expect(xInput).toHaveValue("0");
  await expect(yInput).toHaveValue("0");

  const handle = page.getByRole("button", { name: "Move guide Square grid" });
  await expect(handle).toBeVisible();
  const handleBox = await handle.boundingBox();
  expect(handleBox).not.toBeNull();
  const zoom = await page.evaluate(
    () => window.__VDD_EXCALIDRAW_API__?.getAppState().zoom.value ?? 1,
  );

  await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    handleBox!.x + handleBox!.width / 2 + 80,
    handleBox!.y + handleBox!.height / 2 + 40,
    { steps: 8 },
  );
  await page.mouse.up();

  await expect
    .poll(async () => ({
      x: Number(await xInput.inputValue()),
      y: Number(await yInput.inputValue()),
    }))
    .toEqual({ x: Math.round(80 / zoom), y: Math.round(40 / zoom) });

  await page.screenshot({
    path: "test-results/editor-guide-dragged.png",
    fullPage: true,
  });
});

test("hides the guide move handle when the selected guide is locked", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/");

  await page.waitForFunction(() => Boolean(window.__VDD_EXCALIDRAW_API__));
  await page.getByRole("button", { name: "Guides" }).click();

  const handle = page.getByRole("button", { name: "Move guide Square grid" });
  await expect(handle).toBeVisible();

  await page.getByLabel("Locked").check();
  await expect(handle).toBeHidden();

  await page.screenshot({
    path: "test-results/editor-guide-locked.png",
    fullPage: true,
  });
});

test("inserts a selected crochet symbol into the canvas", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/");

  await page.waitForFunction(() => Boolean(window.__VDD_EXCALIDRAW_API__));
  await page.getByRole("button", { name: "Symbols" }).click();
  await page.getByRole("button", { name: "Single Crochet", exact: true }).click();

  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          window.__VDD_EXCALIDRAW_API__
            ?.getSceneElements()
            .filter((element) => element.type === "image").length ?? 0,
      ),
    )
    .toBe(1);

  await expect
    .poll(async () =>
      page.evaluate(() => {
        const elements = window.__VDD_EXCALIDRAW_API__?.getSceneElements() ?? [];
        const imageElement = elements.find((element) => element.type === "image");

        if (!imageElement) {
          return false;
        }

        const imageCenter = {
          x: imageElement.x + imageElement.width / 2,
          y: imageElement.y + imageElement.height / 2,
        };

        return Math.abs(imageCenter.x) <= 1 && Math.abs(imageCenter.y) <= 1;
      }),
    )
    .toBe(true);

  await expect
    .poll(async () =>
      page.evaluate(() => {
        const elements = window.__VDD_EXCALIDRAW_API__?.getSceneElements() ?? [];
        const imageIndex = elements.findIndex((element) => element.type === "image");
        const imageElement = elements[imageIndex];

        return {
          frameId: imageElement?.frameId ?? null,
          groupCount: imageElement?.groupIds.length ?? -1,
          imageOnlySceneElement: elements.length === 1 && imageIndex === 0,
          objectRole: imageElement?.customData?.role,
        };
      }),
    )
    .toEqual({
      frameId: null,
      groupCount: 0,
      imageOnlySceneElement: true,
      objectRole: "vdd-object",
    });

  await page.waitForTimeout(500);
  await page.screenshot({
    path: "test-results/editor-symbol-inserted.png",
    fullPage: true,
  });

  const dragStart = await page.evaluate(() => {
    const api = window.__VDD_EXCALIDRAW_API__;
    const imageElement = api?.getSceneElements().find((element) => element.type === "image");

    if (!api || !imageElement) {
      return null;
    }

    const appState = api.getAppState();
    const zoom = appState.zoom.value;

    return {
      sceneX: imageElement.x,
      sceneY: imageElement.y,
      viewportX:
        (imageElement.x + imageElement.width / 2 + appState.scrollX) * zoom +
        appState.offsetLeft,
      viewportY:
        (imageElement.y + imageElement.height / 2 + appState.scrollY) * zoom +
        appState.offsetTop,
    };
  });

  expect(dragStart).not.toBeNull();
  await page.mouse.move(dragStart!.viewportX, dragStart!.viewportY);
  await page.mouse.down();
  await page.mouse.move(dragStart!.viewportX + 140, dragStart!.viewportY + 90, {
    steps: 8,
  });
  await page.mouse.up();

  await expect
    .poll(async () =>
      page.evaluate((start) => {
        const elements = window.__VDD_EXCALIDRAW_API__?.getSceneElements() ?? [];
        const imageElement = elements.find((element) => element.type === "image");

        if (!imageElement || !start) {
          return false;
        }

        return (
          elements.length === 1 &&
          imageElement.frameId === null &&
          imageElement.groupIds.length === 0 &&
          imageElement.x > start.sceneX + 50 &&
          imageElement.y > start.sceneY + 30
        );
      }, dragStart),
    )
    .toBe(true);

  await page.screenshot({
    path: "test-results/editor-symbol-dragged-independent.png",
    fullPage: true,
  });
});

test("duplicates and deletes selected stitch symbols from the floating panel", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/");

  await page.waitForFunction(() => Boolean(window.__VDD_EXCALIDRAW_API__));
  await page.getByRole("button", { name: "Symbols" }).click();
  await page.getByRole("button", { name: "Single Crochet", exact: true }).click();
  await expect(page.getByLabel("Stitch controls")).toBeVisible();

  await page.getByRole("button", { name: "Duplicate stitch" }).click();
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          window.__VDD_EXCALIDRAW_API__
            ?.getSceneElements()
            .filter((element) => element.type === "image").length ?? 0,
      ),
    )
    .toBe(2);

  await page.getByRole("button", { name: "Delete stitch" }).click();
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          window.__VDD_EXCALIDRAW_API__
            ?.getSceneElements()
            .filter((element) => element.type === "image").length ?? 0,
      ),
    )
    .toBe(1);

  await page.waitForTimeout(500);
  await page.screenshot({
    path: "test-results/editor-symbol-duplicate-delete.png",
    fullPage: true,
  });
});

test("shows only one floating panel when switching from stitch controls to guide controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/");

  await page.waitForFunction(() => Boolean(window.__VDD_EXCALIDRAW_API__));
  await page.getByRole("button", { name: "Symbols" }).click();
  await page.getByRole("button", { name: "Single Crochet", exact: true }).click();
  await expect(page.getByLabel("Stitch controls")).toBeVisible();
  await expect(page.getByLabel("Guide controls")).toBeHidden();

  await page.getByRole("button", { name: "Guides" }).click();
  await expect(page.getByLabel("Guide controls")).toBeVisible();
  await expect(page.getByLabel("Stitch controls")).toBeHidden();
  await expect(page.locator(".App-menu__left")).toBeHidden();

  await page.evaluate(() => {
    const api = window.__VDD_EXCALIDRAW_API__;
    const imageElement = api?.getSceneElements().find((element) => element.type === "image");

    if (!api || !imageElement) {
      return;
    }

    api.updateScene({
      appState: {
        selectedElementIds: {
          [imageElement.id]: true,
        },
      },
    });
  });

  await expect(page.getByLabel("Stitch controls")).toBeVisible();
  await expect(page.getByLabel("Guide controls")).toBeHidden();
  await expect(page.locator(".App-menu__left")).toBeHidden();
  await expect(page.getByRole("button", { name: "Move guide Square grid" })).toBeHidden();

  await page.screenshot({
    path: "test-results/editor-single-floating-panel.png",
    fullPage: true,
  });
});
