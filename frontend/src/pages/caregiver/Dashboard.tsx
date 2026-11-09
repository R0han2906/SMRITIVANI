import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Brain, CalendarDays, Check, CheckCircle2, Clock3, Heart, Home, Mic, Pill, Plus, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createDevicePairingCode, getCaregiverPairedDevices, getCaregiverSafetyAlerts, getCaregiverVoiceInteractions, getCurrentElderId, getElderlyProfiles, listElderResource, saveCurrentElderId } from "../../services/api";
import type { ElderResource } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

type Row = Record<string, unknown>;
type Elder = { id: string; name: string; age: number | null; city: string | null; lives_alone: boolean };
const navItems = [{ label: "Home", icon: Home, path: "/caregiver" }, { label: "Memory", icon: Brain, path: "/caregiver/memory" }, { label: "Events", icon: CalendarDays, path: "/caregiver/events" }, { label: "Notes", icon: Mic, path: "/caregiver/notes" }, { label: "Profile", icon: User, path: "/caregiver/settings" }];
const resources: ElderResource[] = ["events", "medicines", "medicine-logs", "memories", "contacts", "daily-logs", "alerts", "voice-notes"];
const prettyTime = (value: unknown) => typeof value === "string" && value ? new Date(`1970-01-01T${value}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Time not set";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [elder, setElder] = useState<Elder | null>(null);
  const [data, setData] = useState<Record<ElderResource, Row[]>>({ events: [], medicines: [], "medicine-logs": [], memories: [], contacts: [], "daily-logs": [], alerts: [], "voice-notes": [], conversations: [], messages: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [error, setError] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [pairingBusy, setPairingBusy] = useState(false);
  const [voiceStats, setVoiceStats] = useState({ count: 0, lastActive: "", pendingAlerts: 0, mood: "" });
  const [pairedDevice, setPairedDevice] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let active = true;
    getElderlyProfiles().then(({ items }) => {
      const preferred = getCurrentElderId();
      const row = items.find((item) => item.id === preferred) ?? items[0];
      if (!row) { navigate("/onboarding", { replace: true }); return; }
      if (typeof row.id !== "string" || typeof row.name !== "string") throw new Error("Care profile response is incomplete.");
      saveCurrentElderId(row.id);
      if (active) setElder({ id: row.id, name: row.name, age: typeof row.age === "number" ? row.age : null, city: typeof row.city === "string" ? row.city : null, lives_alone: Boolean(row.lives_alone) });
    }).catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "Could not load the care profile."); }).finally(() => { if (active) setIsProfileLoading(false); });
    return () => { active = false; };
  }, [navigate]);

  useEffect(() => {
    if (!elder) return;
    let active = true;
    setIsLoading(true);
    Promise.allSettled(resources.map((resource) => listElderResource(elder.id, resource))).then((results) => {
      if (!active) return;
      const next = { events: [], medicines: [], "medicine-logs": [], memories: [], contacts: [], "daily-logs": [], alerts: [], "voice-notes": [], conversations: [], messages: [] } as Record<ElderResource, Row[]>;
      const failures: string[] = [];
      results.forEach((result, index) => {
        if (result.status === "fulfilled") next[resources[index]] = result.value.items;
        else failures.push(resources[index]);
      });
      setData(next);
      if (failures.length) setError(`Some care information could not load: ${failures.join(", ")}.`);
    }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [elder]);

  useEffect(() => {
    if (!elder) return;
    let active = true;
    const refreshVoice = async () => {
      try {
        const [interactions, alerts, devices] = await Promise.all([getCaregiverVoiceInteractions(elder.id), getCaregiverSafetyAlerts(elder.id, "pending"), getCaregiverPairedDevices(elder.id)]);
        if (active) {
          setVoiceStats({ count: interactions.items.length, lastActive: String(interactions.items[0]?.created_at ?? ""), pendingAlerts: alerts.items.length, mood: String(interactions.items[0]?.sentiment ?? "") });
          setPairedDevice(devices.items.find((item) => item.is_active === true) ?? null);
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load voice activity.");
      }
    };
    void refreshVoice();
    const timer = window.setInterval(() => void refreshVoice(), 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, [elder]);

  const generatePairingCode = async () => {
    if (!elder) return;
    setPairingBusy(true); setError(""); setPairingCode("");
    try { const result = await createDevicePairingCode(elder.id); setPairingCode(result.claim_code); }
    catch (codeError) { setError(codeError instanceof Error ? codeError.message : "Could not create a device pairing code."); }
    finally { setPairingBusy(false); }
  };

  const todayKey = new Date().toDateString();
  const todaysEvents = useMemo(() => data.events.filter((event) => typeof event.starts_at === "string" && new Date(event.starts_at).toDateString() === todayKey).sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at))), [data.events, todayKey]);
  const medicines = data.medicines.filter((item) => item.active !== false);
  const medicineLogs = data["medicine-logs"];
  const latestLog = data["daily-logs"].slice().sort((a, b) => String(b.log_date).localeCompare(String(a.log_date)))[0];
  const family = data.memories.filter((item) => item.type === "family");
  const recentVoiceNotes = data["voice-notes"].slice(0, 1);
  const openAlerts = data.alerts.filter((item) => item.status === "open").length;
  const taken = typeof latestLog?.medicines_taken === "number" ? latestLog.medicines_taken : 0;
  const total = typeof latestLog?.medicines_total === "number" ? latestLog.medicines_total : medicines.length;
  const initials = elder?.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "SV";
  const caregiverName = typeof user?.display_name === "string" ? user.display_name : "";
  const caregiverInitials = caregiverName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "SV";
  const mood = String(voiceStats.mood || latestLog?.mood || "unknown");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-cream pb-28 text-ink">
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-line bg-white/95 backdrop-blur-sm"><div className="mx-auto flex h-full max-w-[1100px] items-center justify-between px-4 sm:px-6"><Link to="/" className="flex items-center gap-2.5"><span className="flex size-9 items-center justify-center rounded-xl bg-brand text-white"><Heart className="size-5 fill-current" /></span><span className="text-xl font-bold">SmritiVani</span></Link><div className="flex items-center gap-3"><button type="button" onClick={() => navigate("/caregiver/emergency")} aria-label={`${openAlerts} open alerts`} className="relative flex size-10 items-center justify-center rounded-xl hover:bg-cream"><Bell className="size-6 text-muted" />{openAlerts > 0 && <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">{openAlerts}</span>}</button><button type="button" onClick={() => navigate("/caregiver/settings")} className="flex size-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white" aria-label="Open caregiver settings">{caregiverInitials}</button></div></div></header>
      <main className="mx-auto max-w-2xl px-4 pt-20 sm:px-6">
        {(error || isProfileLoading) && <p role={error ? "alert" : "status"} className={`mb-4 rounded-xl p-3 text-sm ${error ? "bg-red-50 font-bold text-red-700" : "bg-white text-muted"}`}>{error || "Loading your care profile…"}</p>}
        <section className="rounded-3xl border-2 border-line bg-white p-5 shadow-[6px_6px_0_#e6dece] sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-4"><span className="flex size-16 items-center justify-center rounded-2xl bg-brand text-2xl font-bold text-white">{initials}</span><div><h1 className="text-2xl font-bold">{elder?.name ?? (isProfileLoading ? "Loading profile…" : "Profile unavailable")}</h1><p className="mt-1 text-base text-muted">{elder ? [elder.age !== null ? `${elder.age} years` : null, elder.city, elder.lives_alone ? "Lives alone" : "Lives with family"].filter(Boolean).join(" · ") : "Your care profile details will appear here."}</p></div></div><span className="rounded-full bg-sage px-3 py-1.5 text-sm font-bold text-forest">Care profile</span></div><div className="mt-6 rounded-2xl border border-line bg-cream p-4"><p className="text-xs font-bold tracking-wider text-muted uppercase">Latest recorded mood</p><p className="mt-1 text-xl font-bold capitalize text-forest">{mood === "unknown" ? "No mood record yet" : mood}</p></div><div className="mt-5 grid grid-cols-3 gap-3">{[{ icon: Mic, value: latestLog?.conversation_count ?? "—", label: "Conversations", color: "bg-sage text-forest" }, { icon: Pill, value: total ? `${taken}/${total}` : "—", label: "Medicine log", color: "bg-[#edf7ef] text-forest" }, { icon: Bell, value: openAlerts, label: "Open alerts", color: "bg-brand-soft text-brand" }].map(({ icon: Icon, value, label, color }) => <div key={label} className={`rounded-2xl p-3 text-center ${color}`}><Icon className="mx-auto size-5" /><p className="mt-1 text-2xl font-bold">{String(value)}</p><p className="text-xs font-bold">{label}</p></div>)}</div></section>

        <section className="mt-5 rounded-2xl border border-line bg-white p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Elderly device pairing</h2><p className="mt-1 text-sm text-muted">{pairedDevice ? `Paired on ${new Date(String(pairedDevice.first_paired_at)).toLocaleString()}` : "No elderly device paired yet."}</p>{pairedDevice && <p className="text-sm text-muted">Last active {new Date(String(pairedDevice.last_seen_at)).toLocaleString()}</p>}</div><button type="button" disabled={pairingBusy || !elder} onClick={() => void generatePairingCode()} className="min-h-11 rounded-xl bg-forest px-4 text-sm font-bold text-white disabled:opacity-50">{pairingBusy ? "Creating…" : pairedDevice ? "Pair replacement" : "Create code"}</button></div>{pairingCode && <div className="mt-4 rounded-xl bg-sage p-4 text-center"><p className="font-mono text-3xl font-bold tracking-[0.35em] text-forest">{pairingCode}</p><p className="mt-1 text-xs text-forest">One use · expires in 15 minutes</p></div>}<div className="mt-4 grid grid-cols-3 gap-3 text-center"><div className="rounded-xl bg-cream p-3"><p className="text-xl font-bold">{voiceStats.count}</p><p className="text-xs text-muted">Recent voice interactions</p></div><div className="rounded-xl bg-cream p-3"><p className="text-xs font-bold">{voiceStats.lastActive ? new Date(voiceStats.lastActive).toLocaleString() : "No activity"}</p><p className="text-xs text-muted">Last active</p></div><div className="rounded-xl bg-red-50 p-3 text-red-700"><p className="text-xl font-bold">{voiceStats.pendingAlerts}</p><p className="text-xs">Pending alerts</p></div></div></section>

        <section className="mt-8"><div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-2xl font-bold"><CalendarDays className="size-6 text-brand" />Today’s events</h2><Link to="/caregiver/events" className="text-sm font-bold text-forest hover:underline">View all</Link></div>{isLoading ? <p className="rounded-xl bg-white p-4 text-muted">Loading events…</p> : todaysEvents.length ? <div className="flex flex-col gap-3">{todaysEvents.slice(0, 4).map((event) => { const starts = new Date(String(event.starts_at)); const complete = event.status === "completed"; return <article key={String(event.id)} className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4"><span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${complete ? "bg-sage text-forest" : "bg-brand-soft text-brand"}`}>{complete ? <CheckCircle2 /> : <Clock3 />}</span><div className="min-w-0 flex-1"><p className="font-bold">{String(event.title ?? "Care event")}</p><p className="truncate text-sm text-muted">{starts.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}{typeof event.description === "string" ? ` · ${event.description}` : ""}</p></div><span className="text-xs font-bold capitalize text-muted">{String(event.status ?? "scheduled")}</span></article>; })}</div> : <p className="rounded-xl border border-dashed border-line-strong bg-white p-5 text-muted">No events scheduled for today.</p>}<button type="button" onClick={() => navigate("/caregiver/events")} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#9fc8b5] bg-sage text-sm font-bold text-forest"><Plus className="size-5" />Manage events</button></section>

        <section className="mt-8"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-2xl font-bold"><Pill className="size-6 text-forest" />Medicines</h2><Link to="/caregiver/events" className="text-sm font-bold text-forest">Manage schedule</Link></div>{isLoading ? <p className="rounded-xl bg-white p-4 text-muted">Loading medicines…</p> : medicines.length ? <div className="flex flex-col gap-3">{medicines.slice(0, 5).map((medicine) => { const latest = medicineLogs.find((log) => log.medicine_id === medicine.id); return <article key={String(medicine.id)} className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sage text-forest"><Pill /></span><div className="min-w-0 flex-1"><p className="font-bold">{String(medicine.name)}{medicine.dosage ? ` · ${String(medicine.dosage)}` : ""}</p><p className="text-sm text-muted">{prettyTime(medicine.schedule_time)}</p></div><span className="text-right text-xs font-bold capitalize text-muted">{String(latest?.status ?? "No dose log")}</span></article>; })}</div> : <p className="rounded-xl border border-dashed border-line-strong bg-white p-5 text-muted">No medicines saved in this profile.</p>}</section>

        <section className="mt-8"><div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-2xl font-bold"><Brain className="size-6 text-[#7562a8]" />Family memories</h2><Link to="/caregiver/memory" className="text-sm font-bold text-[#7562a8]">Manage</Link></div>{family.length ? <div className="flex snap-x gap-4 overflow-x-auto pb-2">{family.slice(0, 8).map((person) => <article key={String(person.id)} className="w-32 shrink-0 snap-start rounded-2xl border border-line bg-white p-4 text-center"><span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">{String(person.name ?? "?").slice(0, 2).toUpperCase()}</span><p className="mt-2 truncate font-bold">{String(person.name ?? "Family")}</p><p className="text-xs text-muted">{String(person.relationship ?? "")}</p></article>)}</div> : <p className="rounded-xl border border-dashed border-line-strong bg-white p-5 text-muted">No family memories saved yet.</p>}<button type="button" onClick={() => navigate("/caregiver/memory")} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong bg-white p-3 font-bold text-[#7562a8]"><Plus className="size-5" />Manage family and memories</button></section>

        <section className="mt-8"><div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-2xl font-bold"><Mic className="size-6 text-brand" />Voice notes</h2><Link to="/caregiver/notes" className="text-sm font-bold text-brand">View all</Link></div>{recentVoiceNotes.length ? recentVoiceNotes.map((note) => <article key={String(note.id)} className="rounded-2xl border border-line bg-white p-5"><p className="text-sm font-bold text-forest">Saved note · {note.created_at ? new Date(String(note.created_at)).toLocaleString() : "Date unavailable"}</p><p className="mt-3 leading-6 text-muted">{String(note.transcript ?? "No transcript was saved.")}</p><p className="mt-3 text-xs text-muted">Audio playback is unavailable because the existing backend stores note metadata only.</p></article>) : <p className="rounded-xl border border-dashed border-line-strong bg-white p-5 text-muted">No voice notes saved.</p>}</section>

        <section className="mt-8 mb-8 rounded-3xl border-2 border-line bg-white p-6 shadow-[6px_6px_0_#e6dece] sm:p-8"><p className="text-sm font-bold tracking-wider text-brand uppercase">Latest daily summary</p>{latestLog ? <><p className="mt-1 text-sm text-muted">{String(latestLog.log_date ?? "Date unavailable")}</p><p className="mt-5 whitespace-pre-wrap text-lg leading-8">{String(latestLog.summary ?? "No summary text was recorded for this day.")}</p><button type="button" onClick={() => navigate("/caregiver/log")} className="mt-6 min-h-12 rounded-xl bg-brand-soft px-5 font-bold text-brand">Open daily log</button></> : <><p className="mt-4 leading-7 text-muted">No daily summary has been recorded for this profile yet.</p><button type="button" onClick={() => navigate("/caregiver/log")} className="mt-5 min-h-12 rounded-xl bg-brand-soft px-5 font-bold text-brand">Open daily log</button></>}</section>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto h-[76px] max-w-2xl rounded-t-2xl border-x border-t border-line bg-white/95 px-2 shadow-[0_-8px_24px_rgba(64,55,40,0.08)] backdrop-blur-sm"><div className="flex h-full items-center justify-around">{navItems.map(({ label, icon: Icon, path }) => <motion.button key={label} type="button" whileTap={{ scale: 0.9 }} onClick={() => navigate(path)} className={`flex min-w-14 flex-col items-center gap-1 px-2 py-2 ${label === "Home" ? "text-brand" : "text-muted"}`}><Icon className="size-6" /><span className="text-xs font-bold">{label}</span></motion.button>)}</div></nav>
    </motion.div>
  );
}
