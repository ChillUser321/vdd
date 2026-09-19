import { useEffect, useRef, useState } from "react";
import { downloadProject, importProject } from "../../state/projectPersistence";
import { useAppStore } from "../../state/appStore";

function DimensionInput({ label, value, onCommit }: { label: string; value: number; onCommit: (value: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const next = Math.min(8000, Math.max(100, Number(draft) || value));
    setDraft(String(next));
    if (next !== value) onCommit(next);
  };
  return <input
    aria-label={label}
    className="h-9 w-[68px] rounded-md border border-slate-300 bg-white px-2 text-center text-xs font-medium text-slate-800 outline-none transition hover:border-teal-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
    inputMode="numeric"
    max={8000}
    min={100}
    onBlur={commit}
    onChange={(event) => setDraft(event.target.value)}
    onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
    type="number"
    value={draft}
  />;
}

export function TopBar() {
  const artboard = useAppStore((state) => state.artboard);
  const preset = useAppStore((state) => state.preset);
  const setPreset = useAppStore((state) => state.setPreset);
  const presets = useAppStore((state) => state.presets);
  const projectName = useAppStore((state) => state.projectName);
  const saveStatus = useAppStore((state) => state.saveStatus);
  const setArtboard = useAppStore((state) => state.setArtboard);
  const setProjectName = useAppStore((state) => state.setProjectName);
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  return (
    <header className="flex min-h-14 flex-wrap items-center justify-between gap-2 bg-white px-3 py-2 md:gap-3 md:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="hidden truncate text-sm font-semibold xl:block">Violet Drizzle Designer</h1>
        <label className="grid min-w-0 gap-0.5" htmlFor="project-name">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">File name</span>
          <input id="project-name" aria-label="Project name" className="h-7 w-36 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800 outline-none transition hover:border-teal-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 md:w-44" value={projectName} onChange={(event) => setProjectName(event.target.value)} />
        </label>
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
          Canvas
          <select
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            value={preset}
            onChange={(event) => setPreset(event.target.value)}
          >
            {presets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <div aria-label="Canvas dimensions" className="flex items-center gap-1">
          <DimensionInput label="Canvas width" value={artboard.width} onCommit={(width) => setArtboard({ ...artboard, id: "CUSTOM", name: "Custom", width })} />
          <span aria-hidden="true" className="text-xs text-slate-400">×</span>
          <DimensionInput label="Canvas height" value={artboard.height} onCommit={(height) => setArtboard({ ...artboard, id: "CUSTOM", name: "Custom", height })} />
          <span className="text-[10px] font-medium text-slate-500">{artboard.unit}</span>
        </div>
        <span className="hidden text-[11px] text-slate-500 xl:inline">{message || (saveStatus === "saving" ? "Saving…" : "Saved")}</span>
        <button className="vdd-button inline-flex" onClick={() => {
          const url = new URL(window.location.href);
          const pageId = typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          url.searchParams.set("page", pageId);
          window.open(url.toString(), "_blank", "noopener,noreferrer");
        }} type="button">New page</button>
        <button className="vdd-button inline-flex" onClick={() => fileInput.current?.click()} type="button">Open</button>
        <button className="vdd-button inline-flex" onClick={downloadProject} type="button">Save file</button>
        <input ref={fileInput} aria-label="Open project file" className="hidden" accept=".json,.crochet.json,application/json" type="file" onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          try { await importProject(file); setMessage("Project opened"); }
          catch (error) { setMessage(error instanceof Error ? error.message : "Could not open project"); }
          event.target.value = "";
        }} />
      </div>
    </header>
  );
}
