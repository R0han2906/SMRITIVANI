import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Clock, Pill, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePatientResources } from "../../hooks/usePatientResources";
import useScreenVoiceRouter from "../../hooks/useScreenVoiceRouter";

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function isToday(value, today) { const date = new Date(String(value)); return !Number.isNaN(date.getTime()) && `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` === today; }

export default function Medicine() {
  const navigate = useNavigate();
  const { data, isLoading, error, create } = usePatientResources(["medicines", "medicine-logs"]);
  const { isFromVoice, voiceIntent, markVoiceHandled } = useScreenVoiceRouter();
  const [savingId, setSavingId] = useState("");
  const [actionError, setActionError] = useState("");
  const day = new Date().getDay();
  const today = todayKey();
  const medicines = (data.medicines ?? []).filter((medicine) => medicine.active !== false && (!Array.isArray(medicine.days_of_week) || medicine.days_of_week.map(Number).includes(day)));
  const logs = (data["medicine-logs"] ?? []).filter((log) => isToday(log.scheduled_for, today));
  const rows = useMemo(() => medicines.map((medicine) => {
    const time = typeof medicine.schedule_time === "string" ? medicine.schedule_time.slice(0, 5) : "";
    const log = logs.find((record) => record.medicine_id === medicine.id);
    return { ...medicine, time, log, status: String(log?.status ?? "pending") };
  }), [medicines, logs]);
  const nextDose = rows.find((medicine) => medicine.status === "pending") ?? null;

  useEffect(() => {
    // If routed via voice, mark it as handled
    if (isFromVoice && voiceIntent === "medicine") {
      markVoiceHandled();
      // Optionally scroll to next dose or highlight it
    }
  }, [isFromVoice, voiceIntent, markVoiceHandled]);

  const recordDose = async (medicine, status) => {
    const id = String(medicine.id);
    setSavingId(id); setActionError("");
    try {
      const time = medicine.time || "09:00";
      await create("medicine-logs", {
        medicine_id: id,
        scheduled_for: new Date(`${today}T${time}:00`).toISOString(),
        status,
      });
    } catch (saveError) { setActionError(saveError instanceof Error ? saveError.message : "Could not save this medicine update."); }
    finally { setSavingId(""); }
  };

  const statusLook = {
    taken: { label: "Taken", icon: <Check className="size-7 text-green-700" />, card: "border-l-4 border-l-green-600" },
    skipped: { label: "Skipped", icon: <X className="size-7 text-slate-500" />, card: "border-l-4 border-l-slate-400" },
    missed: { label: "Missed", icon: <Clock className="size-7 text-orange-600" />, card: "border-l-4 border-l-orange-500" },
    pending: { label: "Not recorded", icon: <Clock className="size-7 text-orange-600" />, card: "border-l-4 border-l-orange-500" },
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#f0fdf4] pb-20 text-ink">
      <header className="flex items-center gap-4 border-b border-line bg-white/95 px-4 py-4 backdrop-blur-sm">
        <button type="button" onClick={() => navigate("/elderly")} aria-label="Back to home" className="flex size-12 items-center justify-center rounded-xl bg-cream text-muted"><ArrowLeft className="size-6" /></button>
        <div><h1 className="text-2xl font-black sm:text-3xl">My medicines 💊</h1><p className="mt-1 text-base text-slate-500">Today · {new Date().toLocaleDateString()}</p></div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {(error || actionError) && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 font-bold text-red-700">{actionError || error}</p>}
        {isLoading ? <p className="rounded-2xl bg-white p-6 text-center text-lg font-bold text-muted">Loading your medicine schedule…</p> : nextDose ? <section className="mb-8 rounded-3xl border-2 border-green-500 bg-green-50 p-6 sm:p-8"><div className="text-center"><Pill className="mx-auto mb-3 size-12 text-green-700" /><p className="text-xl font-bold text-green-800">Your next saved medicine</p><h2 className="mt-3 text-3xl font-black">{String(nextDose.name ?? "Medicine")}</h2><p className="mt-2 text-lg text-slate-600">{[nextDose.dosage, nextDose.time].filter(Boolean).map(String).join(" · ") || "Follow the instructions from your caregiver."}</p>{typeof nextDose.instructions === "string" && <p className="mt-2 text-base text-slate-600">{nextDose.instructions}</p>}</div><div className="mt-6 flex flex-col gap-3 sm:flex-row"><button type="button" disabled={savingId === String(nextDose.id)} onClick={() => void recordDose(nextDose, "taken")} className="min-h-14 flex-1 rounded-2xl bg-green-600 px-4 py-3 text-xl font-black text-white disabled:opacity-60">{savingId === String(nextDose.id) ? "Saving…" : "I took this ✅"}</button><button type="button" disabled={savingId === String(nextDose.id)} onClick={() => void recordDose(nextDose, "skipped")} className="min-h-14 flex-1 rounded-2xl bg-white px-4 py-3 text-xl font-bold text-slate-700 disabled:opacity-60">I skipped it</button></div></section> : !medicines.length ? <section className="mb-8 rounded-2xl bg-white p-6 text-center"><Pill className="mx-auto size-10 text-muted" /><h2 className="mt-3 text-xl font-bold">No medicines saved for today</h2><p className="mt-2 text-muted">Your caregiver can add your medicine schedule from their account.</p></section> : <section className="mb-8 rounded-2xl bg-sage p-6 text-center"><Check className="mx-auto size-10 text-forest" /><h2 className="mt-3 text-xl font-bold text-forest">All saved doses are recorded</h2></section>}
        <h2 className="mb-4 text-2xl font-bold">Today’s schedule</h2>
        <div className="flex flex-col gap-3">{rows.map((medicine) => { const status = statusLook[medicine.status] ?? statusLook.pending; return <article key={String(medicine.id)} className={`flex items-center gap-4 rounded-2xl bg-white p-5 shadow-[4px_4px_0_#e6dece] ${status.card}`}><span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-green-50">{status.icon}</span><div className="min-w-0 flex-1"><p className="text-xl font-bold text-slate-800">{String(medicine.name ?? "Medicine")}{medicine.dosage ? ` · ${String(medicine.dosage)}` : ""}</p><p className="mt-1 text-base text-slate-500">{medicine.time || "Time not set"}{typeof medicine.instructions === "string" ? ` · ${medicine.instructions}` : ""}</p></div><span className="shrink-0 text-sm font-bold text-muted">{status.label}</span></article>; })}</div>
        <p className="mt-6 rounded-xl bg-white p-4 text-sm leading-6 text-muted">This schedule comes from your saved care profile. Medicine updates are saved for your caregiver to review; SmritiVani does not send automatic reminders.</p>
      </main>
    </motion.div>
  );
}
