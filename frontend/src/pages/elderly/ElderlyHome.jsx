import { useEffect, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Bell, Calendar, Heart, Mic, Music, Pill, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePatientResources } from "../../hooks/usePatientResources";
import useVoiceChat from "../../hooks/useVoiceChat";
import { getGnaniLanguageLabel, toGnaniLanguageCode } from "../../utils/languages";

function localDayKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function isToday(value, today) { const date = new Date(String(value)); return !Number.isNaN(date.getTime()) && localDayKey(date) === today; }

export default function ElderlyHome() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { elder, data, isLoading, error } = usePatientResources(["medicines", "medicine-logs", "events", "daily-logs", "alerts"]);
  const language = toGnaniLanguageCode(elder?.language);
  const voiceChat = useVoiceChat(language);
  const today = localDayKey(new Date());
  const firstName = typeof elder?.name === "string" ? elder.name.trim().split(/\s+/)[0] : "there";
  const initials = typeof elder?.name === "string" ? elder.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() : "♥";
  const morning = new Date().getHours() < 12;
  const hindiGreeting = `Namaste ${firstName} ji, aaj ka din kaisa hai?`;
  const greeting = language === "hi-IN" ? hindiGreeting : `${morning ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening"}, ${firstName}! ${morning ? "🌅" : "🙏"}`;
  const medicines = (data.medicines ?? []).filter((medicine) => medicine.active !== false);
  const doses = (data["medicine-logs"] ?? []).filter((log) => isToday(log.scheduled_for, today));
  const events = (data.events ?? []).filter((event) => typeof event.starts_at === "string" && isToday(event.starts_at, today) && event.status !== "cancelled");
  const latestLog = useMemo(() => (data["daily-logs"] ?? []).slice().sort((a, b) => String(b.log_date ?? "").localeCompare(String(a.log_date ?? "")))[0], [data["daily-logs"]]);
  const openAlerts = (data.alerts ?? []).filter((alert) => ["open", "acknowledged"].includes(String(alert.status))).length;
  const actions = [
    { icon: Pill, label: "Dawai", path: "/elderly/medicine", color: "bg-brand" },
    { icon: Users, label: "Parivaar", path: "/elderly/family", color: "bg-forest" },
    { icon: Music, label: "Bhajan", path: "/elderly/bhajan", color: "bg-[#7562a8]" },
  ];
  const beginVoicePress = (event) => {
    if (event.button !== 0 || voiceChat.state === "processing" || voiceChat.state === "speaking") return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    void voiceChat.start();
  };
  const endVoicePress = (event) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    voiceChat.stop();
  };
  const beginVoiceKey = (event) => {
    if ((event.code === "Space" || event.code === "Enter") && !event.repeat) {
      event.preventDefault();
      void voiceChat.start();
    }
  };
  const endVoiceKey = (event) => {
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      voiceChat.stop();
    }
  };

  useEffect(() => {
    if (!elder?.name || sessionStorage.getItem("smritivani.greeting_played")) return;
    sessionStorage.setItem("smritivani.greeting_played", "true");
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(greeting);
      utterance.lang = language;
      utterance.rate = 0.88;
      window.speechSynthesis.speak(utterance);
    }
  }, [elder?.name, language, greeting]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-cream pb-24 text-ink">
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-line bg-white/95 backdrop-blur-sm"><div className="mx-auto flex h-full max-w-[1100px] items-center justify-between px-4 sm:px-6"><div className="flex items-center gap-2.5"><span className="flex size-9 items-center justify-center rounded-xl bg-brand text-white"><Heart className="size-5 fill-current" /></span><span className="text-xl font-bold">SmritiVani</span></div><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white" aria-label={`${firstName}'s profile`}>{initials}</span></div></div></header>
      <main className="mx-auto max-w-2xl px-4 pt-20 sm:px-6">
        {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}
        {voiceChat.fallbackReason && <p role="status" className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{voiceChat.fallbackReason}</p>}
        <section className="rounded-3xl border-2 border-line bg-white p-6 text-center shadow-[6px_6px_0_#e6dece] sm:p-8"><h1 className="text-3xl font-bold sm:text-4xl">{isLoading ? "Welcome to SmritiVani 🙏" : greeting}</h1><p className="mt-3 text-lg text-muted">A calm place for your daily care and family connection.</p>{elder?.language && <p className="mt-2 text-sm text-muted">Care language: {getGnaniLanguageLabel(elder.language)}</p>}</section>
        <section className="mt-8 flex flex-col items-center"><motion.button type="button" whileHover={reduceMotion ? undefined : { scale: 1.04 }} whileTap={{ scale: 0.97 }} onPointerDown={beginVoicePress} onPointerUp={endVoicePress} onPointerCancel={() => voiceChat.stop()} onKeyDown={beginVoiceKey} onKeyUp={endVoiceKey} onBlur={voiceChat.stop} disabled={voiceChat.state === "processing" || voiceChat.state === "speaking"} aria-label={voiceChat.state === "recording" ? "Listening. Release to send." : "Press and hold to speak"} aria-pressed={voiceChat.state === "recording"} className={`flex size-48 touch-none select-none items-center justify-center rounded-full text-white shadow-[8px_8px_0_#e6dece] disabled:opacity-50 ${voiceChat.state === "recording" ? "scale-95 bg-red-600 ring-8 ring-red-100" : "bg-brand"}`}><Mic className="size-20" strokeWidth={1.5} /></motion.button><p className="mt-5 text-center text-2xl font-bold text-brand">Boliye, main sun rahi hoon</p><p className="mt-1 text-center text-base text-muted">Press and hold the microphone while speaking. Release to send.</p>{voiceChat.state === "recording" && <p className="mt-3 text-sm font-semibold text-red-700">Listening… release when you’re finished.</p>}{voiceChat.state === "processing" && <p className="mt-3 text-sm text-brand font-semibold">Processing your request...</p>}{voiceChat.state === "speaking" && <p className="mt-3 text-sm text-brand font-semibold">Playing response...</p>}{voiceChat.transcript && <p className="mt-3 max-w-sm text-base italic text-muted">“{voiceChat.transcript}”</p>}{voiceChat.error && <p role="alert" className="mt-3 max-w-sm rounded-lg bg-red-50 p-3 text-sm text-red-700">{voiceChat.error}</p>}</section>
        <section className="mt-10"><div className="mb-4 flex items-end justify-between"><div><h2 className="text-2xl font-bold">Today at a glance</h2><p className="mt-1 text-sm text-muted">From your saved care profile</p></div>{isLoading && <span className="text-sm text-muted">Loading…</span>}</div><div className="grid grid-cols-3 gap-3">{[{ icon: Pill, value: doses.filter((dose) => dose.status === "taken").length + `/${medicines.length}`, label: "Doses recorded", path: "/elderly/medicine", color: "bg-sage text-forest" }, { icon: Calendar, value: events.length, label: "Events today", path: "/elderly/events", color: "bg-brand-soft text-brand" }, { icon: Bell, value: openAlerts, label: "Open alerts", path: "/elderly/emergency", color: "bg-red-50 text-red-700" }].map(({ icon: Icon, value, label, path, color }) => <button key={label} type="button" onClick={() => navigate(path)} className={`rounded-2xl p-3 text-center ${color}`}><Icon className="mx-auto size-5" /><p className="mt-2 text-xl font-bold">{String(value)}</p><p className="text-xs font-bold">{label}</p></button>)}</div>{latestLog && typeof latestLog.summary === "string" && <p className="mt-3 rounded-xl bg-white p-4 text-sm leading-6 text-muted">{latestLog.summary}</p>}</section>
        <section className="mt-10"><h2 className="mb-4 flex items-center gap-2 text-2xl font-bold"><span>✨</span> Quick access</h2><div className="grid grid-cols-3 gap-3">{actions.map(({ icon: Icon, label, path, color }) => <button key={label} type="button" onClick={() => navigate(path)} className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl ${color} px-2 py-4 text-white shadow-[4px_4px_0_#e6dece]`}><Icon className="size-7" strokeWidth={1.7} /><span className="text-lg font-bold">{label}</span></button>)}</div></section>
        <section className="mt-8 rounded-3xl border-2 border-line bg-white p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-muted">Latest saved mood</p><p className="mt-2 text-2xl font-bold capitalize">{latestLog?.mood ? String(latestLog.mood) : "No mood recorded yet"}</p><p className="mt-1 text-sm text-muted">{latestLog ? (latestLog.summary ? String(latestLog.summary) : `Recorded ${String(latestLog.log_date ?? "")}`) : "Your care summary will appear after it is recorded."}</p></div><span className="text-3xl">{latestLog?.mood === "happy" ? "😊" : latestLog?.mood === "calm" ? "😌" : "📝"}</span></div></section>
        <section className="mt-7 rounded-2xl border border-line-strong bg-brand-soft p-5"><p className="text-sm leading-6 text-brand"><span className="font-bold">💡 Need help?</span> Open Help to call a saved contact or record an SOS alert for your caregiver.</p></section>
      </main>
      <footer className="py-6 text-center"><p className="text-sm text-muted">SmritiVani · Your saved care information</p><button type="button" onClick={() => navigate("/elderly/emergency")} className="mt-3 text-sm font-bold text-red-700 underline">Need urgent help?</button></footer>
    </motion.div>
  );
}
