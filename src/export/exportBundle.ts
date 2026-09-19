import JSZip from "jszip";
import { useGroupStore } from "../groups/groupStore";
import { useAppStore } from "../state/appStore";
import { createStaticFile, downloadBlob, type StaticExportOptions } from "./staticExport";

export async function exportBundle(options: Omit<StaticExportOptions, "groupId">) {
  const groups = useGroupStore.getState().groups;
  if (!groups.length) throw new Error("Create at least one group before exporting a ZIP.");
  const zip = new JSZip();
  for (const group of groups) {
    const file = await createStaticFile({ ...options, groupId: group.id });
    zip.file(file.name, file.blob);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const name = useAppStore.getState().projectName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "pattern";
  downloadBlob(blob, `${name}-groups.zip`);
}
