import type { Artboard } from "../types/projectTypes";
import type { ArtboardViewport } from "../editor/artboardViewport";
import { useRef, useState, type PointerEvent } from "react";
import { getFloatingPanelKind } from "../editor/floatingPanels";
import { useSelectionStore } from "../editor/selectionStore";
import { useAppStore } from "../state/appStore";
import type {
  GuideLayer,
  PolarGridConfig,
  SquareGridConfig,
  RadialGuideConfig,
  CustomSvgGuideConfig,
} from "./guideTypes";
import { useGuideStore } from "./guideStore";
import { renderPolarGrid } from "./renderPolarGrid";
import { renderSquareGrid } from "./renderSquareGrid";
import { renderRadialGuide } from "./renderRadialGuide";

type GuideOverlayProps = {
  artboard: Artboard;
  viewport: ArtboardViewport | null;
};

function isSquareGridConfig(config: GuideLayer["config"]): config is SquareGridConfig {
  return "horizontalSpacing" in config;
}

function isPolarGridConfig(config: GuideLayer["config"]): config is PolarGridConfig {
  return "rings" in config;
}

function renderGuide(guide: GuideLayer, artboard: Artboard) {
  if (guide.type === "square-grid" && isSquareGridConfig(guide.config)) {
    const safeScale = Math.max(0.1, Math.abs(guide.scale));
    const overscan = 800;

    return renderSquareGrid({
      artboardHeight: artboard.height / safeScale + Math.abs(guide.position.y) * 2 + overscan,
      artboardWidth: artboard.width / safeScale + Math.abs(guide.position.x) * 2 + overscan,
      color: guide.color,
      config: guide.config,
      strokeWidth: guide.strokeWidth,
    });
  }

  if (guide.type === "polar-grid" && isPolarGridConfig(guide.config)) {
    return renderPolarGrid({
      color: guide.color,
      config: guide.config,
      strokeWidth: guide.strokeWidth,
    });
  }
  if (guide.type === "radial-guide" && "spokes" in guide.config) {
    const config = guide.config as RadialGuideConfig;
    return renderRadialGuide({ ...config, color: guide.color, strokeWidth: guide.strokeWidth });
  }
  if (guide.type === "custom-svg-guide" && "svg" in guide.config) {
    const config = guide.config as CustomSvgGuideConfig;
    return <image href={`data:image/svg+xml,${encodeURIComponent(config.svg)}`} x={-config.width / 2} y={-config.height / 2} width={config.width} height={config.height} />;
  }

  return null;
}

export function GuideOverlay({ artboard, viewport }: GuideOverlayProps) {
  const activePanel = useAppStore((state) => state.activePanel);
  const selectedElement = useSelectionStore((state) => state.selectedElement);
  const guides = useGuideStore((state) => state.guides);
  const selectedGuideId = useGuideStore((state) => state.selectedGuideId);
  const selectGuide = useGuideStore((state) => state.selectGuide);
  const updateGuide = useGuideStore((state) => state.updateGuide);
  const [draggingGuideId, setDraggingGuideId] = useState<string | null>(null);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    guideId: string;
    position: GuideLayer["position"];
  } | null>(null);

  if (!viewport) {
    return null;
  }

  const left = (-artboard.width / 2 + viewport.scrollX) * viewport.zoom;
  const top = (-artboard.height / 2 + viewport.scrollY) * viewport.zoom;
  const selectedGuide = guides.find((guide) => guide.id === selectedGuideId && guide.visible);
  const guideControlsActive = getFloatingPanelKind(activePanel, selectedElement) === "guide";
  const selectedGuideLeft = selectedGuide
    ? left + (artboard.width / 2 + selectedGuide.position.x) * viewport.zoom
    : 0;
  const selectedGuideTop = selectedGuide
    ? top + (artboard.height / 2 + selectedGuide.position.y) * viewport.zoom
    : 0;

  const beginGuideDrag = (event: PointerEvent<HTMLButtonElement>, guide: GuideLayer) => {
    if (guide.locked) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    selectGuide(guide.id);
    setDraggingGuideId(guide.id);
    dragStartRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      guideId: guide.id,
      position: guide.position,
    };
  };

  const moveGuide = (event: PointerEvent<HTMLButtonElement>) => {
    const dragStart = dragStartRef.current;

    if (!dragStart || draggingGuideId !== dragStart.guideId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    updateGuide(dragStart.guideId, {
      position: {
        x: Math.round(dragStart.position.x + (event.clientX - dragStart.clientX) / viewport.zoom),
        y: Math.round(dragStart.position.y + (event.clientY - dragStart.clientY) / viewport.zoom),
      },
    });
  };

  const endGuideDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragStartRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    dragStartRef.current = null;
    setDraggingGuideId(null);
  };

  return (
    <>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute overflow-hidden"
        data-testid="guide-overlay"
        height={artboard.height * viewport.zoom}
        style={{
          left,
          top,
        }}
        viewBox={`0 0 ${artboard.width} ${artboard.height}`}
        width={artboard.width * viewport.zoom}
      >
        {guides
          .filter((guide) => guide.visible)
          .map((guide) => (
            <g
              data-guide-role={guide.role}
              data-guide-sweep={
                isPolarGridConfig(guide.config) ? guide.config.sweepAngle ?? 360 : undefined
              }
              data-guide-type={guide.type}
              key={guide.id}
              opacity={guide.opacity}
              transform={[
                `translate(${artboard.width / 2 + guide.position.x} ${artboard.height / 2 + guide.position.y})`,
                `rotate(${guide.rotation})`,
                `scale(${guide.scale})`,
              ].join(" ")}
            >
              {renderGuide(guide, artboard)}
              {selectedGuideId === guide.id ? (
                <circle
                  cx={0}
                  cy={0}
                  fill="white"
                  fillOpacity={0.9}
                  r={10}
                  stroke={guide.color}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}
            </g>
          ))}
      </svg>
      {selectedGuide && guideControlsActive && !selectedGuide.locked ? (
        <button
          aria-label={`Move guide ${selectedGuide.name}`}
          className="absolute z-20 h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full border-2 bg-white shadow-md outline-none transition focus:ring-2 focus:ring-teal-100"
          onPointerCancel={endGuideDrag}
          onPointerDown={(event) => beginGuideDrag(event, selectedGuide)}
          onPointerMove={moveGuide}
          onPointerUp={endGuideDrag}
          style={{
            borderColor: selectedGuide.color,
            left: selectedGuideLeft,
            top: selectedGuideTop,
          }}
          title={`Move ${selectedGuide.name}`}
          type="button"
        />
      ) : null}
    </>
  );
}
