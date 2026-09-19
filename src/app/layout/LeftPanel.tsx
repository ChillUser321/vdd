import { SymbolLibrary } from "../../symbols/SymbolLibrary";
import { GuidePanel } from "../../guides/GuidePanel";
import { useAppStore } from "../../state/appStore";
import { TemplateGallery } from "../../templates/TemplateGallery";
import { GroupPanel } from "../../groups/GroupPanel";
import { ExportPanel } from "../../export/ExportPanel";

export function LeftPanel() {
  const activePanel = useAppStore((state) => state.activePanel);

  if (!["Templates", "Symbols", "Guides", "Groups", "Export"].includes(activePanel)) {
    return null;
  }

  return (
    <aside
      aria-label={activePanel === "Symbols" ? "Elements drawer" : `${activePanel} drawer`}
      className="absolute bottom-0 left-16 top-0 z-[3] w-72 overflow-y-auto border-r border-slate-200 bg-white pt-12 shadow-xl lg:left-[72px] lg:w-80"
    >
      {activePanel === "Templates" ? <TemplateGallery /> : activePanel === "Symbols" ? <SymbolLibrary /> : activePanel === "Guides" ? <GuidePanel /> : activePanel === "Groups" ? <GroupPanel /> : <ExportPanel />}
    </aside>
  );
}
