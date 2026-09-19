import type { ChangeEvent } from "react";
import { getFloatingPanelKind } from "../editor/floatingPanels";
import { useSelectionStore } from "../editor/selectionStore";
import { useAppStore } from "../state/appStore";
import { getExcalidrawApi } from "../editor/excalidrawApi";
import { useGuideStore } from "./guideStore";
import type { CustomSvgGuideConfig, GuideLayer, PolarGridConfig, RadialGuideConfig, SquareGridConfig } from "./guideTypes";

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function isSquareGridConfig(config: GuideLayer["config"]): config is SquareGridConfig {
  return "horizontalSpacing" in config;
}

function isPolarGridConfig(config: GuideLayer["config"]): config is PolarGridConfig {
  return "rings" in config;
}

type NumberInputProps = {
  disabled?: boolean;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
};

function NumberInput({
  disabled,
  label,
  max,
  min,
  onChange,
  step = 1,
  value,
}: NumberInputProps) {
  return (
    <label className="grid gap-1 text-xs font-medium text-slate-600">
      {label}
      <input
        className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100 disabled:text-slate-400"
        disabled={disabled}
        max={max}
        min={min}
        onChange={(event) => onChange(clamp(Number(event.target.value), min, max))}
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M8 8v11M12 8v11M16 8v11M5 6h14M10 4h4M7 6l1 15h8l1-15"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M8 8h10v10H8zM6 16H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function GuideFloatingPanel() {
  const activePanel = useAppStore((state) => state.activePanel);
  const selectedElement = useSelectionStore((state) => state.selectedElement);
  const guides = useGuideStore((state) => state.guides);
  const selectedGuideId = useGuideStore((state) => state.selectedGuideId);
  const duplicateGuide = useGuideStore((state) => state.duplicateGuide);
  const removeGuide = useGuideStore((state) => state.removeGuide);
  const updateGuide = useGuideStore((state) => state.updateGuide);
  const updateGuideConfig = useGuideStore((state) => state.updateGuideConfig);
  const selectedGuide = guides.find((guide) => guide.id === selectedGuideId) ?? guides[0];
  const floatingPanelKind = getFloatingPanelKind(activePanel, selectedElement);

  if (floatingPanelKind !== "guide" || !selectedGuide) {
    return null;
  }

  const locked = selectedGuide.locked;
  const squareConfig = isSquareGridConfig(selectedGuide.config) ? selectedGuide.config : null;
  const polarConfig = isPolarGridConfig(selectedGuide.config) ? selectedGuide.config : null;
  const radialConfig = "spokes" in selectedGuide.config ? selectedGuide.config as RadialGuideConfig : null;
  const customSvgConfig = "svg" in selectedGuide.config ? selectedGuide.config as CustomSvgGuideConfig : null;

  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateGuide(selectedGuide.id, { name: event.target.value });
  };

  return (
    <div
      aria-label="Guide controls"
      className="vdd-guide-floating-panel absolute left-4 top-20 z-30 max-h-[calc(100%-112px)] w-64 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 text-slate-900 shadow-xl"
      onPointerDown={(event) => event.stopPropagation()}
      role="region"
    >
      <div className="space-y-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Guide</h2>
            <p className="text-sm font-semibold text-slate-900">{selectedGuide.type}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Duplicate guide"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-teal-500 hover:text-teal-800"
              onClick={() => duplicateGuide(selectedGuide.id)}
              title="Duplicate guide"
              type="button"
            >
              <CopyIcon />
            </button>
            <button
              aria-label="Delete guide"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-white text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              disabled={guides.length <= 1}
              onClick={() => removeGuide(selectedGuide.id)}
              title="Delete guide"
              type="button"
            >
              <TrashIcon />
            </button>
          </div>
        </header>

        <section className="space-y-3">
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Name
            <input
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={onNameChange}
              type="text"
              value={selectedGuide.name}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700">
              <input
                checked={selectedGuide.visible}
                onChange={(event) =>
                  updateGuide(selectedGuide.id, { visible: event.target.checked })
                }
                type="checkbox"
              />
              Visible
            </label>
            <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700">
              <input
                checked={selectedGuide.locked}
                onChange={(event) =>
                  updateGuide(selectedGuide.id, { locked: event.target.checked })
                }
                type="checkbox"
              />
              Locked
            </label>
            <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700">
              <input
                checked={selectedGuide.snapEnabled}
                onChange={(event) => {
                  const snapEnabled = event.target.checked;
                  updateGuide(selectedGuide.id, { snapEnabled });
                  getExcalidrawApi()?.setToast({
                    message: snapEnabled
                      ? "Snap is on — stitches align to grid intersections"
                      : "Snap is off",
                  });
                }}
                type="checkbox"
              />
              Snap stitches
            </label>
            <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700">
              <input
                checked={selectedGuide.exportable}
                onChange={(event) =>
                  updateGuide(selectedGuide.id, { exportable: event.target.checked })
                }
                type="checkbox"
              />
              Export
            </label>
          </div>
        </section>

        <section className="space-y-3 border-t border-slate-200 pt-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Style</h3>
          <div className="grid grid-cols-[1fr_72px] gap-2">
            <NumberInput
              label="Opacity %"
              max={100}
              min={5}
              onChange={(value) => updateGuide(selectedGuide.id, { opacity: value / 100 })}
              value={Math.round(selectedGuide.opacity * 100)}
            />
            <label className="grid gap-1 text-xs font-medium text-slate-600">
              Color
              <input
                className="h-8 w-full rounded-md border border-slate-300 bg-white p-1"
                onChange={(event) => updateGuide(selectedGuide.id, { color: event.target.value })}
                type="color"
                value={selectedGuide.color}
              />
            </label>
          </div>
          <NumberInput
            label="Stroke width"
            max={8}
            min={0.5}
            onChange={(value) => updateGuide(selectedGuide.id, { strokeWidth: value })}
            step={0.5}
            value={selectedGuide.strokeWidth}
          />
        </section>

        <section className="space-y-3 border-t border-slate-200 pt-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Transform
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              disabled={locked}
              label="X"
              max={2000}
              min={-2000}
              onChange={(value) =>
                updateGuide(selectedGuide.id, { position: { ...selectedGuide.position, x: value } })
              }
              value={selectedGuide.position.x}
            />
            <NumberInput
              disabled={locked}
              label="Y"
              max={2000}
              min={-2000}
              onChange={(value) =>
                updateGuide(selectedGuide.id, { position: { ...selectedGuide.position, y: value } })
              }
              value={selectedGuide.position.y}
            />
            <NumberInput
              disabled={locked}
              label="Rotation"
              max={360}
              min={-360}
              onChange={(value) => updateGuide(selectedGuide.id, { rotation: value })}
              value={selectedGuide.rotation}
            />
            <NumberInput
              disabled={locked}
              label="Scale"
              max={5}
              min={0.1}
              onChange={(value) => updateGuide(selectedGuide.id, { scale: value })}
              step={0.1}
              value={selectedGuide.scale}
            />
          </div>
        </section>

        {selectedGuide.type === "square-grid" && squareConfig ? (
          <section className="space-y-3 border-t border-slate-200 pt-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Grid spacing
            </h3>
            <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700">
              <input
                checked={squareConfig.linkedSpacing}
                disabled={locked}
                onChange={(event) =>
                  updateGuideConfig(selectedGuide.id, {
                    linkedSpacing: event.target.checked,
                    verticalSpacing: event.target.checked
                      ? squareConfig.horizontalSpacing
                      : squareConfig.verticalSpacing,
                  })
                }
                type="checkbox"
              />
              Link horizontal and vertical
            </label>
            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                disabled={locked}
                label="Horizontal"
                max={400}
                min={8}
                onChange={(value) =>
                  updateGuideConfig(selectedGuide.id, {
                    horizontalSpacing: value,
                    verticalSpacing: squareConfig.linkedSpacing
                      ? value
                      : squareConfig.verticalSpacing,
                  })
                }
                value={squareConfig.horizontalSpacing}
              />
              <NumberInput
                disabled={locked || squareConfig.linkedSpacing}
                label="Vertical"
                max={400}
                min={8}
                onChange={(value) =>
                  updateGuideConfig(selectedGuide.id, { verticalSpacing: value })
                }
                value={squareConfig.verticalSpacing}
              />
            </div>
            <NumberInput
              disabled={locked}
              label="Major line every"
              max={20}
              min={0}
              onChange={(value) => updateGuideConfig(selectedGuide.id, { majorEvery: value })}
              value={squareConfig.majorEvery ?? 0}
            />
          </section>
        ) : null}

        {selectedGuide.type === "polar-grid" && polarConfig ? (
          <section className="space-y-3 border-t border-slate-200 pt-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Polar grid
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                disabled={locked}
                label="Rings"
                max={100}
                min={1}
                onChange={(value) => updateGuideConfig(selectedGuide.id, { rings: value })}
                value={polarConfig.rings}
              />
              <NumberInput
                disabled={locked}
                label="Ring spacing"
                max={400}
                min={8}
                onChange={(value) => updateGuideConfig(selectedGuide.id, { ringSpacing: value })}
                value={polarConfig.ringSpacing}
              />
              <NumberInput
                disabled={locked}
                label="Angle step"
                max={90}
                min={1}
                onChange={(value) => updateGuideConfig(selectedGuide.id, { angleStep: value })}
                value={polarConfig.angleStep}
              />
              <NumberInput
                disabled={locked}
                label="Arc rotation"
                max={360}
                min={-360}
                onChange={(value) => updateGuideConfig(selectedGuide.id, { startAngle: value })}
                value={polarConfig.startAngle ?? 0}
              />
              <NumberInput
                disabled={locked}
                label="Arc size"
                max={360}
                min={1}
                onChange={(value) => updateGuideConfig(selectedGuide.id, { sweepAngle: value })}
                value={polarConfig.sweepAngle ?? 360}
              />
            </div>
          </section>
        ) : null}
        {selectedGuide.type === "radial-guide" && radialConfig ? <section className="space-y-3 border-t border-slate-200 pt-3"><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Radial guide</h3><div className="grid grid-cols-2 gap-2"><NumberInput disabled={locked} label="Spokes" min={2} max={180} value={radialConfig.spokes} onChange={(spokes) => updateGuideConfig(selectedGuide.id, { spokes })} /><NumberInput disabled={locked} label="Radius" min={20} max={4000} value={radialConfig.radius} onChange={(radius) => updateGuideConfig(selectedGuide.id, { radius })} /></div></section> : null}
        {selectedGuide.type === "custom-svg-guide" && customSvgConfig ? <section className="space-y-3 border-t border-slate-200 pt-3"><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Custom SVG</h3><label className="grid gap-1 text-xs font-medium text-slate-600">SVG file<input accept=".svg,image/svg+xml" disabled={locked} type="file" onChange={(event) => { const file = event.target.files?.[0]; if (file) void file.text().then((svg) => updateGuideConfig(selectedGuide.id, { svg })); }} /></label><div className="grid grid-cols-2 gap-2"><NumberInput disabled={locked} label="Width" min={20} max={4000} value={customSvgConfig.width} onChange={(width) => updateGuideConfig(selectedGuide.id, { width })} /><NumberInput disabled={locked} label="Height" min={20} max={4000} value={customSvgConfig.height} onChange={(height) => updateGuideConfig(selectedGuide.id, { height })} /></div></section> : null}
      </div>
    </div>
  );
}
