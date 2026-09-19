import { CanvasShell } from "./layout/CanvasShell";
import { LeftPanel } from "./layout/LeftPanel";
import { LeftToolbar } from "./layout/LeftToolbar";
import { RightPanel } from "./layout/RightPanel";
import { TopBar } from "./layout/TopBar";
import { getFloatingPanelKind } from "../editor/floatingPanels";
import { useSelectionStore } from "../editor/selectionStore";
import { useAppStore } from "../state/appStore";
import { useEffect, useState } from "react";
import { flushAutosave, scheduleAutosave } from "../state/projectPersistence";
import { useGuideStore } from "../guides/guideStore";
import { useGroupStore } from "../groups/groupStore";

function hasOverlayDrawer(activePanel: string) {
  return ["Templates", "Symbols", "Guides", "Groups", "Export"].includes(activePanel);
}

export function App() {
  const [phone, setPhone] = useState(() => window.matchMedia("(max-width: 599px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 599px)");
    const update = () => setPhone(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const unsubGuides = useGuideStore.subscribe(scheduleAutosave);
    const unsubGroups = useGroupStore.subscribe(scheduleAutosave);
    return () => { unsubGuides(); unsubGroups(); };
  }, []);
  useEffect(() => {
    window.addEventListener("pagehide", flushAutosave);
    window.addEventListener("beforeunload", flushAutosave);
    return () => {
      window.removeEventListener("pagehide", flushAutosave);
      window.removeEventListener("beforeunload", flushAutosave);
    };
  }, []);
  const activePanel = useAppStore((state) => state.activePanel);
  const projectName = useAppStore((state) => state.projectName);
  const artboard = useAppStore((state) => state.artboard);
  useEffect(() => { scheduleAutosave(); }, [projectName, artboard]);
  const selectedElement = useSelectionStore((state) => state.selectedElement);
  const floatingPanelKind = getFloatingPanelKind(activePanel, selectedElement);
  const customFloatingPanelActive =
    floatingPanelKind === "stitch" || floatingPanelKind === "guide";

  if (phone) return <main className="flex h-full items-center justify-center bg-gradient-to-br from-teal-50 to-violet-50 p-6 text-center"><section className="max-w-sm rounded-2xl border border-white bg-white/90 p-8 shadow-xl"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-2xl">🧶</div><h1 className="text-xl font-bold text-slate-900">Requires a larger screen</h1><p className="mt-3 text-sm leading-6 text-slate-600">Violet Drizzle Designer supports editing on tablets and desktop computers. Open this page on a larger screen to create or continue your crochet pattern.</p></section></main>;

  return (
    <main
      className={`grid h-full min-h-0 grid-rows-[auto_1fr] bg-slate-100 text-slate-900 ${
        hasOverlayDrawer(activePanel) ? "vdd-drawer-open" : ""
      } ${floatingPanelKind === "guide" ? "vdd-guide-panel-active" : ""} ${
        customFloatingPanelActive ? "vdd-custom-floating-panel-active" : ""
      }`}
    >
      <TopBar />
      <div className="relative min-h-0 border-t border-slate-200">
        <div className="grid h-full min-h-0 grid-cols-[64px_minmax(0,1fr)] lg:grid-cols-[72px_minmax(0,1fr)_300px]">
          <LeftToolbar />
          <CanvasShell />
          <RightPanel />
        </div>
        <LeftPanel />
      </div>
    </main>
  );
}
