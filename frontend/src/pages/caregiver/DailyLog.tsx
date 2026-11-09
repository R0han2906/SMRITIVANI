import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Check, Pill, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CaregiverBottomNav } from "../../components/layout/CaregiverChrome";
import { useElderResource } from "../../hooks/useElderResource";
import { getCaregiverDailySummary, getCaregiverVoiceInteractions } from "../../services/api";

function dateOnly(value: unknown) { if (typeof value !== "string") return ""; return value.slice(0, 10); }

export default function DailyLog() {
  const navigate = useNavigate();
  const daily = useElderResource("daily-logs");
  const medicinesData = useElderResource("medicines");
  const doseData = useElderResource("medicine-logs");
  const eventsData = useElderResource("events");
  const notesData = useElderResource("voice-notes");
  const [error, setError] = useState("");
  const [voiceSummary, setVoiceSummary] = useState<Record<string, unknown> | null>(null);
  const [voiceInteractions, setVoiceInteractions] = useState<Record<string, unknown>[]>([]);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const days = useMemo(() => [...new Set([today, ...daily.items.map((item) => dateOnly(item.log_date))].filter(Boolean))].sort((a, b) => b.localeCompare(a)), [daily.items, today]);
  const [selectedDate, setSelectedDate] = useState("");
  const activeDate = days.includes(selectedDate) ? selectedDate : days[0] ?? today;
  const currentLog = daily.items.find((item) => dateOnly(item.log_date) === activeDate);
  const doses = doseData.items.filter((item) => dateOnly(item.scheduled_for) === activeDate);
  const dayEvents = eventsData.items.filter((item) => typeof item.starts_at === "string" && dateOnly(item.starts_at) === activeDate).sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at)));
  const isToday = activeDate === today;

  useEffect(() => {
    if (!daily.elderId || daily.isLoading) return;
    let active = true;
    setIsVoiceLoading(true);
    Promise.all([getCaregiverDailySummary(daily.elderId, activeDate), getCaregiverVoiceInteractions(daily.elderId, activeDate)])
      .then(([summary, interactions]) => { if (active) { setVoiceSummary(summary); setVoiceInteractions(interactions.items); } })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "Could not load voice summary."); })
      .finally(() => { if (active) setIsVoiceLoading(false); });
    return () => { active = false; };
  }, [daily.elderId, daily.isLoading, activeDate]);

  const recordDose = async (medicine: Record<string, unknown>, status: "taken" | "missed" | "skipped") => {
    setError("");
    try {
      const time = typeof medicine.schedule_time === "string" ? medicine.schedule_time.slice(0, 8) : "09:00:00";
      const scheduled = new Date(`${activeDate}T${time}`);
      await doseData.create({ medicine_id: medicine.id, scheduled_for: scheduled.toISOString(), status });
    } catch (writeError) { setError(writeError instanceof Error ? writeError.message : "Could not record this medicine dose."); }
  };

  const isLoading = daily.isLoading || medicinesData.isLoading || doseData.isLoading || eventsData.isLoading || notesData.isLoading;
  const errors = [error, daily.error, medicinesData.error, doseData.error, eventsData.error, notesData.error].filter(Boolean);

  return (
    <div className="min-h-screen bg-cream pb-28 text-ink">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-white/95 backdrop-blur-sm"><div className="mx-auto flex min-h-20 max-w-2xl items-center gap-4 px-4 sm:px-6"><button type="button" onClick={() => navigate("/caregiver")} aria-label="Back to dashboard" className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-cream text-muted"><ArrowLeft className="size-6" /></button><div><h1 className="text-2xl font-bold">Daily care log</h1><p className="text-base text-muted">Information recorded for this profile</p></div></div></header>
      <main className="mx-auto max-w-2xl px-4 pt-28 sm:px-6">
        {errors.map((message, index) => <p key={`${index}-${message}`} role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>)}
        <div className="flex items-center justify-center gap-3"><label htmlFor="daily-date" className="font-bold">Choose a recorded day</label><select id="daily-date" value={activeDate} onChange={(event) => setSelectedDate(event.target.value)} className="min-h-11 rounded-xl border border-line bg-white px-3 font-bold">{days.map((date) => <option key={date} value={date}>{date === today ? `Today · ${date}` : date}</option>)}</select></div>

        <section className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-[4px_4px_0_#e6dece]"><div className="flex items-center gap-4"><span className="text-5xl">{String(currentLog?.mood ?? "unknown") === "happy" ? "😊" : String(currentLog?.mood ?? "unknown") === "distressed" ? "😟" : String(currentLog?.mood ?? "unknown") === "calm" ? "😌" : "📝"}</span><div className="flex-1"><h2 className="text-2xl font-bold capitalize">{String(currentLog?.mood ?? "No summary yet")}</h2><p className="mt-1 text-muted">{currentLog ? `Recorded for ${String(currentLog.log_date)}` : "No daily summary has been recorded for this date."}</p></div><CalendarDays className="size-7 text-brand" /></div>{typeof currentLog?.summary === "string" && currentLog.summary && <p className="mt-5 whitespace-pre-wrap leading-7 text-muted">{String(currentLog.summary)}</p>}<div className="mt-5 grid grid-cols-3 gap-3">{[{ label: "Medicines", value: currentLog ? `${currentLog.medicines_taken ?? 0}/${currentLog.medicines_total ?? 0}` : `${doses.filter((dose) => dose.status === "taken").length}/${medicinesData.items.length}` }, { label: "Alerts", value: currentLog ? String(currentLog.alerts ?? "—") : "—" }, { label: "Conversations", value: currentLog ? String(currentLog.conversation_count ?? "—") : "—" }].map(({ label, value }) => <div key={label} className="rounded-xl bg-cream p-3 text-center"><p className="text-xl font-bold">{value}</p><p className="text-xs font-bold text-muted">{label}</p></div>)}</div></section>

        <section className="mt-5 rounded-2xl border border-line bg-white p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Voice day summary</h2><span className="text-sm font-bold capitalize text-forest">{isVoiceLoading ? "Loading…" : String(voiceSummary?.mood_label ?? "no voice data")}</span></div><p className="mt-3 leading-6 text-muted">{String(voiceSummary?.summary_text ?? "No voice interactions were recorded for this date.")}</p><p className="mt-2 text-sm text-muted">{String(voiceSummary?.total_interactions ?? 0)} recorded interactions · {voiceInteractions.length} transcript entries</p>{voiceInteractions.length > 0 && <ul className="mt-3 space-y-2">{voiceInteractions.slice(-3).map((item) => <li key={String(item.id)} className="rounded-xl bg-cream p-3 text-sm"><span className="font-bold capitalize">{String(item.intent ?? "general")}</span><span className="text-muted"> · {String(item.transcript ?? "")}</span></li>)}</ul>}</section>

        <section className="mt-8"><h2 className="text-2xl font-bold">Medicine records</h2>{isLoading ? <p className="mt-4 rounded-xl bg-white p-4 text-muted">Loading care records…</p> : medicinesData.items.filter((medicine) => medicine.active !== false).length ? <div className="mt-4 space-y-3">{medicinesData.items.filter((medicine) => medicine.active !== false).map((medicine) => { const dose = doses.find((item) => item.medicine_id === medicine.id); const name = String(medicine.name ?? "Medicine"); return <article key={String(medicine.id)} className="rounded-2xl border border-line bg-white p-4"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-sage text-forest"><Pill /></span><div className="min-w-0 flex-1"><p className="font-bold">{name}{medicine.dosage ? ` · ${String(medicine.dosage)}` : ""}</p><p className="text-sm text-muted">{typeof medicine.schedule_time === "string" ? medicine.schedule_time : "No time set"}</p></div><span className="rounded-full bg-cream px-3 py-1 text-xs font-bold capitalize text-muted">{String(dose?.status ?? "Not recorded")}</span></div>{!dose && isToday && <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void recordDose(medicine, "taken")} className="flex min-h-10 items-center gap-2 rounded-lg bg-sage px-3 text-sm font-bold text-forest"><Check className="size-4" />Record taken</button><button type="button" onClick={() => void recordDose(medicine, "skipped")} className="min-h-10 rounded-lg bg-cream px-3 text-sm font-bold text-muted">Record skipped</button></div>}</article>; })}</div> : <p className="mt-4 rounded-xl border border-dashed border-line-strong bg-white p-5 text-muted">No active medicines in this care profile.</p>}</section>

        <section className="mt-8"><h2 className="text-2xl font-bold">Scheduled events</h2>{dayEvents.length ? <div className="mt-4 space-y-3">{dayEvents.map((event) => <article key={String(event.id)} className="rounded-2xl border border-line bg-white p-4"><p className="text-sm font-bold text-brand">{new Date(String(event.starts_at)).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p><h3 className="mt-1 font-bold">{String(event.title ?? "Care event")}</h3>{typeof event.description === "string" && <p className="mt-1 text-sm text-muted">{String(event.description)}</p>}</article>)}</div> : <p className="mt-4 rounded-xl bg-white p-4 text-muted">No scheduled events for this date.</p>}</section>

        <section className="mt-8 mb-8"><h2 className="flex items-center gap-2 text-2xl font-bold"><Sparkles className="size-6 text-brand" />Saved voice-note transcripts</h2>{notesData.items.length ? <div className="mt-4 space-y-3">{notesData.items.filter((note) => dateOnly(note.created_at) === activeDate).map((note) => <article key={String(note.id)} className="rounded-2xl border border-line bg-white p-4"><p className="text-xs font-bold text-muted">{note.created_at ? new Date(String(note.created_at)).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Saved note"}</p><p className="mt-2 whitespace-pre-wrap leading-6">{String(note.transcript ?? "No transcript saved")}</p></article>)}</div> : <p className="mt-4 rounded-xl bg-white p-4 text-muted">No voice-note metadata is saved for this profile.</p>}<p className="mt-3 text-xs text-muted">The current backend stores voice-note metadata only; audio playback and upload are not available.</p></section>
      </main>
      <CaregiverBottomNav />
    </div>
  );
}
