import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import { useEffect, useState } from "react";
import { getExcalidrawApi } from "../editor/excalidrawApi";
import { createEmptyProject } from "../editor/sceneAdapter";
import { useAppStore } from "../state/appStore";
import { applyProject } from "../state/projectPersistence";
import { loadTemplateManifest } from "./templateLoader";
import type { TemplateSummary } from "./templateTypes";

function createTemplate(template: TemplateSummary) {
  const artboard = useAppStore.getState().presets.find((item) => item.id === "SQUARE")!;
  const project = createEmptyProject(template.name, artboard);
  const common = { strokeColor: "#172033", strokeWidth: 3, roughness: 0, backgroundColor: "transparent" };
  const skeletons = template.id === "granny-square"
    ? [0, 1, 2, 3].map((index) => ({ type: "rectangle" as const, x: -360 + index * 60, y: -360 + index * 60, width: 720 - index * 120, height: 720 - index * 120, ...common }))
    : [80, 160, 240, 320].map((radius) => ({ type: "ellipse" as const, x: -radius, y: -radius, width: radius * 2, height: radius * 2, ...common }));
  project.excalidraw.elements = convertToExcalidrawElements(skeletons);
  return project;
}

export function TemplateGallery() {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [message, setMessage] = useState("Loading templates…");
  useEffect(() => { void loadTemplateManifest().then((items) => { setTemplates(items); setMessage(""); }).catch((error: Error) => setMessage(error.message)); }, []);
  return <div className="space-y-4 p-4">
    <div><h2 className="text-base font-semibold">Templates</h2><p className="text-xs text-slate-500">Start with a reusable crochet layout.</p></div>
    {message ? <p className="text-xs text-slate-500">{message}</p> : null}
    <div className="grid grid-cols-2 gap-3">{templates.map((template) => <button className="overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200" key={template.id} onClick={() => { if (getExcalidrawApi()) applyProject(createTemplate(template)); }} type="button">
      <img alt="" className="aspect-square w-full bg-slate-50 object-cover" src={new URL(template.preview.replace(/^\//, ""), document.baseURI).toString()} />
      <span className="block p-2 text-xs font-semibold">{template.name}</span>
    </button>)}</div>
  </div>;
}
