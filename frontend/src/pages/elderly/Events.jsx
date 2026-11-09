import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Clock3, Stethoscope } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePatientResources } from "../../hooks/usePatientResources";

function dayKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function eventDay(value) { const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? "" : dayKey(date); }

export default function Events() {
  const navigate = useNavigate();
  const { data, isLoading, error } = usePatientResources(["events"]);
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const events = (data.events ?? []).filter((event) => event.status !== "cancelled" && typeof event.starts_at === "string").sort((a, b) => new Date(String(a.starts_at)).getTime() - new Date(String(b.starts_at)).getTime());
  const todayEvents = events.filter((event) => eventDay(event.starts_at) === dayKey(today));
  const tomorrowEvents = events.filter((event) => eventDay(event.starts_at) === dayKey(tomorrow));
  const nextEvent = events.find((event) => new Date(String(event.starts_at)).getTime() >= Date.now() && event.status !== "completed");

  const renderEvent = (event) => <article key={String(event.id)} className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-[4px_4px_0_#e6dece]"><span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700"><Clock3 className="size-6" /></span><div className="min-w-0 flex-1"><p className="text-sm font-bold text-purple-700">{new Date(String(event.starts_at)).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p><p className="mt-1 text-xl font-bold text-slate-800">{String(event.title ?? "Care event")}</p>{typeof event.description === "string" && event.description && <p className="mt-1 text-base text-slate-500">{event.description}</p>}</div><span className="shrink-0 rounded-full bg-cream px-3 py-1 text-xs font-bold capitalize text-muted">{String(event.status ?? "scheduled")}</span></article>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#f5f3ff] pb-20 text-ink">
      <header className="flex items-center gap-4 border-b border-line bg-white/95 px-4 py-4 backdrop-blur-sm"><button type="button" onClick={() => navigate("/elderly")} aria-label="Back to home" className="flex size-12 items-center justify-center rounded-xl bg-cream text-muted"><ArrowLeft className="size-6" /></button><div><h1 className="text-2xl font-black sm:text-3xl">My schedule 📅</h1><p className="mt-1 text-base text-slate-500">{today.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p></div></header>
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 font-bold text-red-700">{error}</p>}
        {nextEvent && <section className="mb-8 rounded-3xl border-l-8 border-l-purple-500 bg-purple-50 p-6"><p className="text-base font-bold text-purple-700">Next saved event</p><h2 className="mt-2 text-2xl font-black text-slate-800">{String(nextEvent.title ?? "Care event")}</h2><div className="mt-4 flex items-center gap-3 text-purple-700"><Stethoscope className="size-8" /><span className="text-lg font-bold">{new Date(String(nextEvent.starts_at)).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}</span></div>{typeof nextEvent.description === "string" && <p className="mt-3 text-slate-600">{nextEvent.description}</p>}</section>}
        {isLoading ? <p className="rounded-2xl bg-white p-6 text-center font-bold text-muted">Loading your schedule…</p> : <><section><h2 className="mb-4 flex items-center gap-2 text-2xl font-bold"><CalendarDays className="size-6 text-purple-700" />Today</h2>{todayEvents.length ? <div className="flex flex-col gap-3">{todayEvents.map(renderEvent)}</div> : <p className="rounded-2xl border border-dashed border-line-strong bg-white p-5 text-muted">No saved events for today.</p>}</section><section className="mt-8"><h2 className="mb-4 text-2xl font-bold">Tomorrow</h2>{tomorrowEvents.length ? <div className="flex flex-col gap-3">{tomorrowEvents.map(renderEvent)}</div> : <p className="rounded-2xl border border-dashed border-line-strong bg-white p-5 text-muted">No saved events for tomorrow.</p>}</section></>}
        <p className="mt-6 rounded-xl bg-white p-4 text-sm leading-6 text-muted">These are events saved by your caregiver. The app does not send automatic reminder notifications.</p>
      </main>
    </motion.div>
  );
}
