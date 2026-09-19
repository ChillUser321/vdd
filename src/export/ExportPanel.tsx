import { useState } from "react";
import { useGroupStore } from "../groups/groupStore";
import { exportStaticImage } from "./staticExport";
import { exportBundle } from "./exportBundle";

export function ExportPanel() {
  const groups = useGroupStore((state) => state.groups);
  const [format, setFormat] = useState<"png" | "svg">("png");
  const [includeGuides, setIncludeGuides] = useState(false);
  const [transparentBackground, setTransparentBackground] = useState(false);
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const run = async (groupId?: string) => {
    setBusy(true); setMessage("");
    try { await exportStaticImage({ format, includeGuides, transparentBackground, scale, groupId }); setMessage("Export ready"); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Export failed"); }
    finally { setBusy(false); }
  };
  return <div className="space-y-5 p-4">
    <div><h2 className="text-base font-semibold">Export</h2><p className="text-xs text-slate-500">Download a crisp, static pattern image.</p></div>
    <label className="grid gap-1 text-xs font-medium">Format<select className="vdd-field" value={format} onChange={(event) => setFormat(event.target.value as "png" | "svg")}><option value="png">PNG picture</option><option value="svg">SVG scalable picture</option></select></label>
    {format === "png" ? <label className="grid gap-1 text-xs font-medium">PNG size<select className="vdd-field" value={scale} onChange={(event) => setScale(Number(event.target.value))}><option value="1">Original measurements</option><option value="2">2× measurements</option><option value="3">3× measurements</option></select></label> : null}
    <label className="flex gap-2 text-xs"><input checked={includeGuides} onChange={(event) => setIncludeGuides(event.target.checked)} type="checkbox" /> Include guides marked for export</label>
    <label className="flex gap-2 text-xs"><input checked={transparentBackground} onChange={(event) => setTransparentBackground(event.target.checked)} type="checkbox" /> Transparent background</label>
    <button className="vdd-primary-button w-full" disabled={busy} onClick={() => void run()} type="button">Export full artboard</button>
    {groups.length ? <section className="space-y-2 border-t pt-4"><h3 className="text-xs font-semibold uppercase text-slate-500">Groups</h3>{groups.map((group) => <button className="vdd-button w-full" disabled={busy} key={group.id} onClick={() => void run(group.id)} type="button">Export {group.name}</button>)}</section> : null}
    {groups.length ? <button className="vdd-button w-full" disabled={busy} onClick={() => { setBusy(true); void exportBundle({ format, includeGuides, transparentBackground, scale }).then(() => setMessage("ZIP ready")).catch((error: Error) => setMessage(error.message)).finally(() => setBusy(false)); }} type="button">Export all groups as ZIP</button> : null}
    {message ? <p aria-live="polite" className="text-xs text-slate-600">{message}</p> : null}
  </div>;
}
