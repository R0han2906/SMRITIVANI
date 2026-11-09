import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, MessageCircle, Pill, Play, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePatientResources } from "../../hooks/usePatientResources";

function localDayKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function sameLocalDay(value, target) { const date = new Date(String(value)); return !Number.isNaN(date.getTime()) && localDayKey(date) === target; }

export default function Recap() {
  const navigate = useNavigate();
  const { data, isLoading, error } = usePatientResources(["daily-logs", "medicine-logs", "events", "voice-notes", "messages"]);
  const now = new Date();
  const today = localDayKey(now);
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const dayLog = (data["daily-logs"] ?? []).find((row) => String(row.log_date ?? "").slice(0, 10) === today);
  const dayDoses = (data["medicine-logs"] ?? []).filter((row) => sameLocalDay(row.scheduled_for, today));
  const taken = dayDoses.filter((row) => row.status === "taken").length;
  const dayEvents = (data.events ?? []).filter((row) => typeof row.starts_at === "string" && sameLocalDay(row.starts_at, today));
  const tomorrowEvents = (data.events ?? []).filter((row) => typeof row.starts_at === "string" && sameLocalDay(row.starts_at, localDayKey(tomorrow)) && row.status !== "cancelled").sort((a, b) => new Date(String(a.starts_at)).getTime() - new Date(String(b.starts_at)).getTime());
  const dayNotes = (data["voice-notes"] ?? []).filter((row) => typeof row.transcript === "string" && sameLocalDay(row.created_at, today));
  const dayMessages = (data.messages ?? []).filter((row) => sameLocalDay(row.created_at, today));
  const mood = String(dayLog?.mood ?? "");
  const recapLine = typeof dayLog?.summary === "string" ? dayLog.summary.trim() : "";
  const speakRecap = () => {
    const text = recapLine || `Today you recorded ${taken} medicine dose${taken === 1 ? "" : "s"} and had ${dayEvents.length} scheduled event${dayEvents.length === 1 ? "" : "s"}.`;
    if ("speechSynthesis" in window) { window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(text)); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen overflow-hidden bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 pb-20 text-white">
      <header className="relative z-10 flex items-center gap-4 border-b border-purple-700/50 bg-indigo-900/50 px-4 py-5 backdrop-blur-sm"><button type="button" onClick={() => navigate("/elderly")} aria-label="Back to home" className="flex size-12 items-center justify-center rounded-xl bg-white/10"><ArrowLeft className="size-6" /></button><div><h1 className="text-2xl font-black sm:text-3xl">Your day in review</h1><p className="mt-1 text-base text-purple-200">{now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p></div></header>
      <main className="relative z-10 mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {error && <p role="alert" className="mb-5 rounded-xl bg-red-100 p-4 font-bold text-red-800">{error}</p>}
        {isLoading ? <p className="rounded-2xl bg-white/10 p-6 text-center">Loading today’s saved care summary…</p> : <>
          <section className="rounded-3xl bg-white/10 p-6 text-center backdrop-blur-sm sm:p-8"><p className="text-base text-purple-200">Your recorded mood</p><p className="mt-3 text-6xl">{mood === "happy" ? "😊" : mood === "calm" ? "😌" : mood === "distressed" ? "😟" : "🌙"}</p><h2 className="mt-3 text-2xl font-bold capitalize">{mood || "No mood recorded"}</h2>{recapLine && <p className="mt-4 whitespace-pre-wrap text-lg leading-7 text-purple-100">{recapLine}</p>}</section>
          <section className="mt-6"><h2 className="mb-4 text-2xl font-bold">Today’s saved activity</h2><div className="grid grid-cols-2 gap-3">{[{ icon: Pill, label: "Doses recorded", value: dayLog ? `${String(dayLog.medicines_taken ?? taken)}/${String(dayLog.medicines_total ?? dayDoses.length)}` : `${taken}/${dayDoses.length}` }, { icon: CalendarDays, label: "Scheduled events", value: dayEvents.length }, { icon: MessageCircle, label: "Messages", value: dayMessages.length }, { icon: Sparkles, label: "Voice transcripts", value: dayNotes.length }].map(({ icon: Icon, label, value }) => <article key={label} className="rounded-2xl bg-white/10 p-4 text-center"><Icon className="mx-auto size-6 text-yellow-300" /><p className="mt-2 text-2xl font-bold">{value}</p><p className="text-sm text-purple-100">{label}</p></article>)}</div></section>
          {dayNotes.length > 0 && <section className="mt-7"><h2 className="mb-3 text-xl font-bold">Saved voice notes</h2><div className="space-y-3">{dayNotes.map((note) => <article key={String(note.id)} className="rounded-xl bg-white/10 p-4"><p className="text-xs text-purple-200">{note.created_at ? new Date(String(note.created_at)).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Saved today"}</p><p className="mt-2 text-lg leading-7">{String(note.transcript)}</p></article>)}</div></section>}
          <section className="mt-7 rounded-2xl border border-yellow-400/30 bg-white/10 p-5"><p className="text-sm font-bold uppercase tracking-wide text-purple-200">Read aloud</p><p className="mt-2 text-lg leading-7">{recapLine || `You have ${taken} recorded medicine dose${taken === 1 ? "" : "s"} and ${dayEvents.length} scheduled event${dayEvents.length === 1 ? "" : "s"} for today.`}</p><button type="button" onClick={speakRecap} className="mt-4 flex min-h-11 items-center gap-2 rounded-full bg-yellow-400/20 px-4 font-bold text-yellow-200"><Play className="size-5 fill-current" />Read aloud</button></section>
        </>}
        <section className="mt-8"><h2 className="mb-4 text-xl font-bold text-purple-200">Tomorrow’s saved schedule</h2>{tomorrowEvents.length ? <div className="space-y-3">{tomorrowEvents.map((event) => <article key={String(event.id)} className="rounded-xl bg-white/10 p-4"><p className="text-sm text-purple-200">{new Date(String(event.starts_at)).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p><p className="mt-1 text-lg font-bold">{String(event.title ?? "Care event")}</p>{typeof event.description === "string" && <p className="text-sm text-purple-100">{event.description}</p>}</article>)}</div> : !isLoading && <p className="rounded-xl bg-white/10 p-4 text-purple-100">No events are saved for tomorrow.</p>}</section>
        <p className="mt-6 text-sm leading-6 text-purple-200">This page reflects records stored by your care service. A daily recap is shown only when the backend has saved one; no sample activity is inserted.</p>
        <button type="button" onClick={() => navigate("/elderly")} className="mt-7 w-full rounded-2xl bg-purple-600 py-5 text-xl font-bold text-white">Back home</button>
      </main>
    </motion.div>
  );
}
