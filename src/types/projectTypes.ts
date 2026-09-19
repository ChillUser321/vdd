import type { GuideLayer } from "../guides/guideTypes";
import type { CrochetGroup } from "../groups/groupStore";

export type ArtboardPresetId =
  | "A4_PORTRAIT"
  | "A4_LANDSCAPE"
  | "SQUARE"
  | "TIKTOK_9_16"
  | "CUSTOM";

export type Artboard = {
  id: ArtboardPresetId;
  name: string;
  width: number;
  height: number;
  unit: "px" | "mm";
  backgroundColor: string;
};

export type CrochetProject = {
  version: 1;
  name: string;
  createdAt: string;
  updatedAt: string;
  artboard: Artboard;
  excalidraw: {
    elements: unknown[];
    appState: Record<string, unknown>;
    files: Record<string, unknown>;
  };
  guides: GuideLayer[];
  groups: CrochetGroup[];
  metadata: {
    category?: string;
    tags?: string[];
    notes?: string;
  };
};

export function isCrochetProject(value: unknown): value is CrochetProject {
  if (!value || typeof value !== "object") return false;
  const project = value as Partial<CrochetProject>;
  const excalidraw = project.excalidraw as CrochetProject["excalidraw"] | undefined;
  return project.version === 1 && typeof project.name === "string" &&
    Boolean(project.artboard) && Boolean(excalidraw) &&
    Array.isArray(excalidraw?.elements) &&
    Boolean(excalidraw?.appState) && typeof excalidraw?.appState === "object" &&
    Boolean(excalidraw?.files) && typeof excalidraw?.files === "object" &&
    Array.isArray(project.guides) && Array.isArray(project.groups);
}
