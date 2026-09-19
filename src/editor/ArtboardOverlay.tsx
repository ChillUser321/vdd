import type { Artboard } from "../types/projectTypes";
import type { ArtboardViewport } from "./artboardViewport";

type ArtboardOverlayProps = {
  artboard: Artboard;
  viewport: ArtboardViewport | null;
};

export function ArtboardOverlay({ artboard, viewport }: ArtboardOverlayProps) {
  if (!viewport) {
    return null;
  }

  const left =
    (-artboard.width / 2 + viewport.scrollX) * viewport.zoom;
  const top =
    (-artboard.height / 2 + viewport.scrollY) * viewport.zoom;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute border border-slate-400 shadow-sm"
      data-testid="artboard-overlay"
      style={{
        height: artboard.height * viewport.zoom,
        left,
        top,
        width: artboard.width * viewport.zoom,
        backgroundColor: artboard.backgroundColor,
      }}
    />
  );
}
