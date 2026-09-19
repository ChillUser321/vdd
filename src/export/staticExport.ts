import { convertToExcalidrawElements, exportToBlob, exportToSvg } from "@excalidraw/excalidraw";
import { getExcalidrawApi } from "../editor/excalidrawApi";
import { useGroupStore } from "../groups/groupStore";
import { useGuideStore } from "../guides/guideStore";
import type { GuideLayer, PolarGridConfig, RadialGuideConfig, SquareGridConfig } from "../guides/guideTypes";
import { useAppStore } from "../state/appStore";

export type StaticExportOptions = {
  format: "png" | "svg";
  includeGuides: boolean;
  transparentBackground: boolean;
  scale: number;
  groupId?: string;
};

function guideSkeletons(guide: GuideLayer, width: number, height: number): NonNullable<Parameters<typeof convertToExcalidrawElements>[0]> {
  if (!guide.visible || !guide.exportable) return [];
  const common = { strokeColor: guide.color, strokeWidth: guide.strokeWidth, opacity: Math.round(guide.opacity * 100), roughness: 0, angle: guide.rotation * Math.PI / 180 };
  if (guide.type === "square-grid") {
    const config = guide.config as SquareGridConfig;
    const xStep = config.horizontalSpacing * guide.scale;
    const yStep = config.verticalSpacing * guide.scale;
    const lines = [];
    for (let x = -width / 2 + guide.position.x; x <= width / 2; x += xStep) lines.push({ type: "line" as const, x, y: -height / 2, points: [[0, 0], [0, height]], ...common });
    for (let y = -height / 2 + guide.position.y; y <= height / 2; y += yStep) lines.push({ type: "line" as const, x: -width / 2, y, points: [[0, 0], [width, 0]], ...common });
    return lines;
  }
  if (guide.type === "polar-grid") {
    const config = guide.config as PolarGridConfig;
    const items = [];
    for (let ring = 1; ring <= config.rings; ring += 1) {
      const radius = ring * config.ringSpacing * guide.scale;
      items.push({ type: "ellipse" as const, x: guide.position.x - radius, y: guide.position.y - radius, width: radius * 2, height: radius * 2, ...common });
    }
    for (let angle = config.startAngle; angle < config.startAngle + config.sweepAngle; angle += config.angleStep) {
      const radians = angle * Math.PI / 180;
      const radius = config.rings * config.ringSpacing * guide.scale;
      items.push({ type: "line" as const, x: guide.position.x, y: guide.position.y, points: [[0, 0], [Math.cos(radians) * radius, Math.sin(radians) * radius]], ...common });
    }
    return items;
  }
  if (guide.type === "radial-guide") {
    const config = guide.config as RadialGuideConfig;
    return Array.from({ length: config.spokes }, (_, index) => {
      const radians = index / config.spokes * Math.PI * 2;
      return { type: "line" as const, x: guide.position.x, y: guide.position.y, points: [[0, 0], [Math.cos(radians) * config.radius * guide.scale, Math.sin(radians) * config.radius * guide.scale]], ...common };
    });
  }
  return [];
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function createStaticFile(options: StaticExportOptions): Promise<{ blob: Blob; name: string }> {
  const api = getExcalidrawApi();
  if (!api) throw new Error("The editor is still loading.");
  const app = useAppStore.getState();
  const group = options.groupId ? useGroupStore.getState().groups.find((item) => item.id === options.groupId) : null;
  let elements = api.getSceneElements().filter((element) => !group || group.excalidrawElementIds.includes(element.id));
  let padding = group?.exportSettings.padding ?? 0;
  const extraFiles: Record<string, never> = {};

  if (!group) {
    const frame = convertToExcalidrawElements([{
      type: "rectangle", x: -app.artboard.width / 2, y: -app.artboard.height / 2,
      width: app.artboard.width, height: app.artboard.height,
      backgroundColor: options.transparentBackground ? "transparent" : app.artboard.backgroundColor,
      strokeColor: "transparent", strokeWidth: 0, roughness: 0, opacity: options.transparentBackground ? 0 : 100,
    }]);
    const guides = options.includeGuides
      ? convertToExcalidrawElements(useGuideStore.getState().guides.flatMap((guide) => guideSkeletons(guide, app.artboard.width, app.artboard.height)))
      : [];
    const customGuides = options.includeGuides ? useGuideStore.getState().guides.filter((guide) => guide.visible && guide.exportable && guide.type === "custom-svg-guide") : [];
    const customImages = convertToExcalidrawElements(customGuides.map((guide) => {
      const config = guide.config as { svg: string; width: number; height: number };
      const fileId = `vddcustom${guide.id.replace(/[^a-z0-9]/gi, "").padEnd(30, "0")}`.slice(0, 40);
      (extraFiles as Record<string, unknown>)[fileId] = { id: fileId, dataURL: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(config.svg)))}`, mimeType: "image/svg+xml", created: Date.now() };
      return { type: "image" as const, x: guide.position.x - config.width / 2, y: guide.position.y - config.height / 2, width: config.width, height: config.height, fileId: fileId as never, opacity: Math.round(guide.opacity * 100), angle: guide.rotation * Math.PI / 180 };
    }));
    elements = [...frame, ...guides, ...customImages, ...elements];
    padding = 0;
  }

  const base = {
    elements: elements.filter((element) => !element.isDeleted),
    appState: { ...api.getAppState(), exportBackground: !options.transparentBackground, viewBackgroundColor: options.transparentBackground ? "transparent" : app.artboard.backgroundColor },
    files: { ...api.getFiles(), ...extraFiles },
    exportPadding: padding,
  };
  const name = (group?.name ?? app.projectName).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "pattern";
  if (options.format === "svg") {
    const svg = await exportToSvg(base);
    return { blob: new Blob([svg.outerHTML], { type: "image/svg+xml" }), name: `${name}.svg` };
  } else {
    const blob = await exportToBlob({ ...base, mimeType: "image/png", getDimensions: (width: number, height: number) => ({ width: width * options.scale, height: height * options.scale, scale: options.scale }) });
    return { blob, name: `${name}.png` };
  }
}

export async function exportStaticImage(options: StaticExportOptions) {
  const file = await createStaticFile(options);
  downloadBlob(file.blob, file.name);
}
