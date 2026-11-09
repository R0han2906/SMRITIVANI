import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, CalendarDays, Phone, Plus, ShieldAlert, ShieldCheck, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useElderResource } from "../../hooks/useElderResource";
import { getCaregiverSafetyAlerts, updateCaregiverSafetyAlert } from "../../services/api";

const field = "h-12 w-full rounded-xl border-2 border-line-strong bg-cream px-4 outline-none focus:border-brand";

export default function EmergencyAlert() {
  const navigate = useNavigate();
  const alertData = useElderResource("alerts");
  const contactsData = useElderResource("contacts");
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contact, setContact] = useState({ name: "", relationship: "", phone: "", city: "", is_emergency_contact: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [safetyAlerts, setSafetyAlerts] = useState<Record<string, unknown>[]>([]);
  const [isLoadingSafety, setIsLoadingSafety] = useState(true);

  useEffect(() => {
    if (!alertData.elderId) return;
    let active = true;
    const refresh = () => getCaregiverSafetyAlerts(alertData.elderId).then(({ items }) => { if (active) setSafetyAlerts(items); })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "Could not load safety alerts."); })
      .finally(() => { if (active) setIsLoadingSafety(false); });
    void refresh();
    const timer = window.setInterval(() => { void refresh(); void alertData.refresh(); }, 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, [alertData.elderId, alertData.refresh]);

  const alerts = useMemo(() => {
    const safety = safetyAlerts.map((item) => ({ ...item, source: "safety", status: item.status === "pending" ? "open" : item.status === "false_positive" ? "false_alarm" : item.status }));
    const safetyTranscripts = new Set(safety.map((item) => String(item.transcript ?? "")));
    const legacy = alertData.items.filter((item) => !safetyTranscripts.has(String(item.transcript ?? "")));
    return [...safety, ...legacy].sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
  }, [alertData.items, safetyAlerts]);
  const now = Date.now();
  const todayCount = alerts.filter((item) => typeof item.created_at === "string" && new Date(item.created_at).toDateString() === new Date().toDateString()).length;
  const weekCount = alerts.filter((item) => typeof item.created_at === "string" && now - new Date(item.created_at).getTime() < 7 * 86400000).length;
  const openCount = alerts.filter((item) => item.status === "open").length;

  const saveContact = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    const data = { ...contact, name: contact.name.trim(), relationship: contact.relationship.trim() || null, phone: contact.phone.trim() || null, city: contact.city.trim() || null };
    try {
      if (editingId) await contactsData.update(editingId, data); else await contactsData.create(data);
      setShowContactForm(false); setEditingId(null); setContact({ name: "", relationship: "", phone: "", city: "", is_emergency_contact: true });
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Could not save this contact."); }
    finally { setSaving(false); }
  };

  const setStatus = async (id: string, status: string) => {
    setError("");
    try {
      const alert = alerts.find((item) => String(item.id) === id);
      if (alert?.source === "safety") {
        const action = status === "acknowledged" ? "acknowledge" : status === "resolved" ? "resolve" : "false-positive";
        await updateCaregiverSafetyAlert(id, action);
        setSafetyAlerts((current) => current.map((item) => String(item.id) === id ? { ...item, status: status === "false_alarm" ? "false_positive" : status } : item));
      } else {
        const updated = await alertData.update(id, { status });
        void updated;
      }
    }
    catch (updateError) { setError(updateError instanceof Error ? updateError.message : "Could not update this alert."); }
  };

  const editContact = (row: Record<string, unknown>) => {
    setEditingId(String(row.id));
    setContact({ name: String(row.name ?? ""), relationship: String(row.relationship ?? ""), phone: String(row.phone ?? ""), city: String(row.city ?? ""), is_emergency_contact: Boolean(row.is_emergency_contact) });
    setShowContactForm(true);
  };

  return (
    <div className="min-h-screen bg-cream pb-28 text-ink">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-white/95 backdrop-blur-sm"><div className="mx-auto flex min-h-20 max-w-2xl items-center gap-4 px-4 sm:px-6"><button type="button" onClick={() => navigate("/caregiver")} aria-label="Back to dashboard" className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-cream text-muted"><ArrowLeft className="size-6" /></button><div className="flex-1"><h1 className="text-2xl font-bold">Emergency alerts</h1><p className="text-base text-muted">Saved alerts and emergency contacts</p></div><span className={`size-3 rounded-full ${openCount ? "bg-red-500" : "bg-green-500"}`} aria-label={`${openCount} open alerts`} /></div></header>
      <main className="mx-auto max-w-2xl px-4 pt-28 sm:px-6">
        {(error || alertData.error || contactsData.error) && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error || alertData.error || contactsData.error}</p>}
        <section className="grid grid-cols-3 gap-3">{[{ value: alertData.isLoading || isLoadingSafety ? "…" : todayCount, label: "Today", icon: AlertTriangle }, { value: alertData.isLoading || isLoadingSafety ? "…" : weekCount, label: "This week", icon: CalendarDays }, { value: alertData.isLoading || isLoadingSafety ? "…" : openCount, label: "Open", icon: ShieldCheck }].map(({ value, label, icon: Icon }) => <article key={label} className="rounded-2xl border border-line bg-white p-4 text-center"><Icon className="mx-auto size-6 text-brand" /><p className="mt-2 text-2xl font-bold">{value}</p><p className="text-xs font-bold text-muted">{label}</p></article>)}</section>

        <section className="mt-8"><h2 className="text-2xl font-bold">Recent alerts</h2>{alertData.isLoading || isLoadingSafety ? <p className="mt-4 rounded-xl bg-white p-4 text-muted">Loading alerts…</p> : alerts.length ? <div className="mt-4 space-y-3">{alerts.map((alert) => { const id = String(alert.id); const status = String(alert.status ?? "open"); const title = String(alert.alert_type ?? alert.type ?? "other").replace(/_/g, " "); return <article key={id} className="rounded-2xl border border-line bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span className={`mt-0.5 flex size-10 items-center justify-center rounded-xl ${status === "open" ? "bg-red-50 text-red-700" : "bg-sage text-forest"}`}><ShieldAlert className="size-5" /></span><div><p className="text-xs font-bold text-muted">{typeof alert.created_at === "string" ? new Date(String(alert.created_at)).toLocaleString() : "Time unavailable"}</p><h3 className="mt-1 text-lg font-bold capitalize">{title} alert{alert.severity ? ` · ${String(alert.severity)}` : ""}</h3></div></div><span className="rounded-full bg-cream px-3 py-1 text-xs font-bold capitalize text-muted">{status.replace(/_/g, " ")}</span></div>{typeof alert.transcript === "string" && <p className="mt-3 whitespace-pre-wrap leading-6 text-muted">{alert.transcript}</p>}{(status === "open" || status === "pending") && <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => void setStatus(id, "acknowledged")} className="min-h-10 rounded-lg bg-brand-soft px-3 text-sm font-bold text-brand">Acknowledge</button><button type="button" onClick={() => void setStatus(id, "resolved")} className="min-h-10 rounded-lg bg-sage px-3 text-sm font-bold text-forest">Resolve</button><button type="button" onClick={() => void setStatus(id, "false_alarm")} className="min-h-10 rounded-lg bg-cream px-3 text-sm font-bold text-muted">Mark false alarm</button></div>}{status === "acknowledged" && <button type="button" onClick={() => void setStatus(id, "resolved")} className="mt-4 min-h-10 rounded-lg bg-sage px-3 text-sm font-bold text-forest">Resolve alert</button>}</article>; })}</div> : <div className="mt-4 rounded-2xl border-2 border-dashed border-line-strong bg-white p-8 text-center text-muted"><ShieldCheck className="mx-auto size-9" /><p className="mt-3 font-bold">No alerts have been recorded.</p></div>}</section>

        <section className="mt-8"><div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-bold">Emergency contacts</h2><button type="button" onClick={() => { setEditingId(null); setContact({ name: "", relationship: "", phone: "", city: "", is_emergency_contact: true }); setShowContactForm(true); }} disabled={!contactsData.elderId} className="flex min-h-10 items-center gap-2 rounded-xl bg-forest px-3 text-sm font-bold text-white disabled:opacity-50"><Plus className="size-4" />Add contact</button></div>{contactsData.isLoading ? <p className="mt-4 rounded-xl bg-white p-4 text-muted">Loading contacts…</p> : contactsData.items.length ? <div className="mt-4 space-y-3">{contactsData.items.map((row) => <article key={String(row.id)} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{String(row.name ?? "?").slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="font-bold">{String(row.name ?? "Contact")}{typeof row.relationship === "string" && row.relationship ? ` · ${String(row.relationship)}` : ""}</p><p className="text-sm text-muted">{[row.phone, row.city].filter(Boolean).map(String).join(" · ") || "No phone or city saved"}</p>{Boolean(row.is_emergency_contact) && <p className="text-xs font-bold text-red-600">Emergency contact</p>}</div>{typeof row.phone === "string" && row.phone && <a href={`tel:${row.phone.replace(/[^+\d]/g, "")}`} aria-label={`Call ${String(row.name)}`} className="flex size-10 items-center justify-center rounded-xl bg-sage text-forest"><Phone className="size-5" /></a>}<button type="button" onClick={() => editContact(row)} aria-label={`Edit ${String(row.name)}`} className="rounded-lg p-2 text-muted hover:bg-cream">Edit</button><button type="button" onClick={() => void contactsData.remove(String(row.id)).catch((removeError) => setError(removeError instanceof Error ? removeError.message : "Could not remove contact."))} aria-label={`Remove ${String(row.name)}`} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="size-4" /></button></article>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-line-strong bg-white p-5 text-muted">No emergency contacts saved.</p>}</section>

        <p className="mt-8 rounded-2xl border border-line bg-white p-4 text-sm leading-6 text-muted">Monitoring controls and automatic detection are not configurable through the existing backend. This page shows only alerts actually stored for the selected care profile.</p>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto h-[76px] max-w-2xl rounded-t-2xl border-x border-t border-line bg-white/95 px-2 shadow-[0_-8px_24px_rgba(64,55,40,0.08)] backdrop-blur-sm"><div className="flex h-full items-center justify-around">{[{ label: "Home", path: "/caregiver" }, { label: "Memory", path: "/caregiver/memory" }, { label: "Events", path: "/caregiver/events" }, { label: "Notes", path: "/caregiver/notes" }, { label: "Profile", path: "/caregiver/settings" }].map(({ label, path }) => <button key={label} type="button" onClick={() => navigate(path)} className="min-w-14 px-2 py-2 text-xs font-bold text-muted">{label}</button>)}</div></nav>
      {showContactForm && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#24332f]/45 p-0 sm:items-center sm:p-4" onMouseDown={() => setShowContactForm(false)}><section role="dialog" aria-modal="true" aria-label="Emergency contact details" onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-t-3xl bg-white p-6 sm:rounded-3xl"><div className="flex items-center justify-between"><h2 className="text-2xl font-bold">{editingId ? "Edit contact" : "Add emergency contact"}</h2><button type="button" aria-label="Close" onClick={() => setShowContactForm(false)} className="flex size-10 items-center justify-center rounded-xl bg-cream"><X /></button></div><form onSubmit={(event) => void saveContact(event)} className="mt-5 space-y-4"><label className="block"><span className="mb-1 block font-bold">Name</span><input required maxLength={200} value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} className={field} /></label><label className="block"><span className="mb-1 block font-bold">Relationship</span><input value={contact.relationship} onChange={(event) => setContact({ ...contact, relationship: event.target.value })} className={field} /></label><label className="block"><span className="mb-1 block font-bold">Phone</span><input type="tel" value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} className={field} /></label><label className="block"><span className="mb-1 block font-bold">City</span><input value={contact.city} onChange={(event) => setContact({ ...contact, city: event.target.value })} className={field} /></label><label className="flex min-h-10 items-center gap-3 font-bold"><input type="checkbox" checked={contact.is_emergency_contact} onChange={(event) => setContact({ ...contact, is_emergency_contact: event.target.checked })} className="size-5 accent-brand" />Mark as emergency contact</label><button disabled={saving || !contact.name.trim()} className="h-12 w-full rounded-xl bg-forest font-bold text-white disabled:opacity-50">{saving ? "Saving…" : "Save contact"}</button></form></section></div>}
    </div>
  );
}
