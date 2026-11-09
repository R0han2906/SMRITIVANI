import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Headphones, Mic, Search, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useElderResource } from "../../hooks/useElderResource";
import { CaregiverBottomNav } from "../../components/layout/CaregiverChrome";
import { getCaregiverVoiceInteractions, getCurrentElderId } from "../../services/api";

export default function VoiceNotes() {
  const navigate = useNavigate();
  const profile = useElderResource("voice-notes");
  const [interactions, setInteractions] = useState<Record<string, unknown>[]>([]);
  const [isLoadingInteractions, setIsLoadingInteractions] = useState(true);
  const [interactionError, setInteractionError] = useState("");
  const [intent, setIntent] = useState("all");
  const [query, setQuery] = useState("");
  const interactionElderId = profile.elderId || getCurrentElderId();

  useEffect(() => {
    if (!interactionElderId) return;
    let active = true;
    getCaregiverVoiceInteractions(interactionElderId, undefined).then(({ items }) => { if (active) setInteractions(items); })
      .catch((error) => { if (active) setInteractionError(error instanceof Error ? error.message : "Could not load voice interactions."); })
      .finally(() => { if (active) setIsLoadingInteractions(false); });
    return () => { active = false; };
  }, [interactionElderId]);

  const visible = useMemo(() => interactions.filter((item) => {
    const transcript = String(item.transcript ?? "");
    return (intent === "all" || String(item.intent) === intent) && transcript.toLowerCase().includes(query.toLowerCase());
  }), [interactions, intent, query]);

  return <div className="min-h-screen bg-cream pb-28 text-ink">
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-white/95"><div className="mx-auto flex h-20 max-w-2xl items-center gap-4 px-4 sm:px-6"><button type="button" onClick={() => navigate("/caregiver")} aria-label="Back to dashboard" className="flex size-12 items-center justify-center rounded-xl bg-cream text-muted"><ArrowLeft /></button><div><h1 className="text-2xl font-bold">Voice interactions</h1><p className="text-sm text-muted">Transcripts and intent from the elderly device</p></div></div></header>
    <main className="mx-auto max-w-2xl px-4 pt-28 sm:px-6">
      {(profile.error || interactionError) && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{interactionError || profile.error}</p>}
      <div className="flex flex-col gap-3 sm:flex-row"><label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-xl border border-line bg-white px-4"><Search className="size-5 text-muted" /><span className="sr-only">Search transcripts</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search transcripts" className="min-w-0 flex-1 bg-transparent outline-none" /></label><label className="sr-only" htmlFor="voice-intent">Filter by intent</label><select id="voice-intent" value={intent} onChange={(event) => setIntent(event.target.value)} className="h-12 rounded-xl border border-line bg-white px-4 font-bold"><option value="all">All intents</option>{["medicine","family","bhajan","symptom","emergency","loneliness","memory","general"].map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
      <div className="mt-6">{profile.isLoading || isLoadingInteractions ? <p className="rounded-xl bg-white p-5 text-muted">Loading saved voice interactions…</p> : visible.length ? <div className="space-y-4">{visible.map((item) => <article key={String(item.id)} className="rounded-2xl border border-line bg-white p-5 shadow-[4px_4px_0_#e6dece]"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand"><Headphones className="size-5" /></span><div className="min-w-0 flex-1"><p className="font-bold capitalize">{String(item.intent ?? "voice")} interaction{item.is_emergency ? " · emergency" : ""}</p><p className="text-xs text-muted">{item.created_at ? new Date(String(item.created_at)).toLocaleString() : "Date unavailable"}</p></div>{typeof item.sentiment === "string" && <span className="rounded-full bg-sage px-3 py-1 text-xs font-bold capitalize text-forest">{item.sentiment}</span>}</div><p className="mt-4 whitespace-pre-wrap leading-7">{String(item.transcript ?? "No transcript was saved.")}</p><p className="mt-2 text-sm text-muted">Assistant: {String(item.assistant_response ?? "No response stored")}</p><div className="mt-4 flex items-center gap-2 rounded-xl bg-cream p-3 text-sm text-muted"><Volume2 className="size-4 shrink-0" />Audio is not stored. This entry contains transcript text only.</div></article>)}</div> : <div className="rounded-2xl border-2 border-dashed border-line-strong bg-white p-8 text-center text-muted"><Mic className="mx-auto size-9" /><p className="mt-3 font-bold">No voice interactions match this view.</p><p className="mt-1 text-sm">Interactions appear after a paired device sends speech text.</p></div>}</div>
      {profile.items.length > 0 && <p className="mt-6 text-xs leading-5 text-muted">Saved voice-note files are not uploaded. Existing note metadata count: {profile.items.length}.</p>}
    </main><CaregiverBottomNav activeOverride="Notes" />
  </div>;
}
