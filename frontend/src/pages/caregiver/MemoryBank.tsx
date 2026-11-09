import { FormEvent, useEffect, useMemo, useState } from "react";
import { BookOpen, Brain, CalendarDays, Heart, Home, Lightbulb, Mic, Pencil, Phone, Plus, Trash2, User, Users, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { CaregiverBottomNav } from "../../components/layout/CaregiverChrome";
import { useElderResource } from "../../hooks/useElderResource";
import { getCaregiverVoiceInteractions } from "../../services/api";

type Tab = "family" | "facts" | "stories";
const relationships = ["Son", "Daughter", "Grandson", "Granddaughter", "Spouse", "Brother", "Sister", "Neighbor", "Other"];
const categories = [{ emoji: "🎵", label: "Music" }, { emoji: "🍚", label: "Food" }, { emoji: "📍", label: "Places" }, { emoji: "⚠️", label: "Health" }, { emoji: "☕", label: "Habits" }, { emoji: "💡", label: "Personal" }, { emoji: "📖", label: "Story" }];
const colors: Record<string, string> = { "🎵": "bg-[#eee9fa] text-[#7562a8]", "🍚": "bg-brand-soft text-brand", "📍": "bg-sage text-forest", "⚠️": "bg-red-50 text-red-700", "☕": "bg-amber-50 text-amber-700", "📖": "bg-pink-50 text-[#a94f79]", "💡": "bg-sage text-forest" };
const inputClass = "h-12 w-full rounded-xl border-2 border-line-strong bg-cream px-4 text-base outline-none focus:border-forest";

function unpackFamily(info: string) {
  const city = info.match(/^City: (.*)$/m)?.[1] ?? "";
  const phone = info.match(/^Phone: (.*)$/m)?.[1] ?? "";
  const detail = info.split("\n").filter((line) => !line.startsWith("City: ") && !line.startsWith("Phone: ")).join("\n").trim();
  return { city, phone, detail };
}

function unpackFact(name: string, info: string) {
  const emoji = categories.find((category) => name.startsWith(`${category.emoji} `))?.emoji ?? "💡";
  const text = name.startsWith(`${emoji} `) ? name.slice(emoji.length + 1) : info ? `${name}: ${info}` : name;
  return { emoji, text };
}

export default function MemoryBank() {
  const navigate = useNavigate();
  const memory = useElderResource("memories");
  const [tab, setTab] = useState<Tab>("family");
  const [filter, setFilter] = useState("All");
  const [familyModal, setFamilyModal] = useState(false);
  const [factModal, setFactModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [familyDraft, setFamilyDraft] = useState({ name: "", relationship: "Son", city: "", phone: "", info: "" });
  const [factDraft, setFactDraft] = useState({ emoji: "💡", text: "" });
  const [recalledMemories, setRecalledMemories] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    if (!memory.elderId) return;
    let active = true;
    getCaregiverVoiceInteractions(memory.elderId).then(({ items }) => {
      const weekStart = Date.now() - 7 * 86400000;
      if (active) setRecalledMemories(items.filter((item) => item.intent === "memory" && new Date(String(item.created_at ?? 0)).getTime() >= weekStart).slice(0, 6));
    }).catch(() => { if (active) setRecalledMemories([]); });
    return () => { active = false; };
  }, [memory.elderId]);

  const families = useMemo(() => memory.items.filter((item) => item.type === "family").map((item) => {
    const details = unpackFamily(typeof item.info === "string" ? item.info : "");
    return { ...item, id: String(item.id), name: String(item.name ?? ""), relationship: String(item.relationship ?? "Family"), ...details };
  }), [memory.items]);
  const facts = useMemo(() => memory.items.filter((item) => item.type === "fact" || item.type === "preference").map((item) => {
    const parsed = unpackFact(String(item.name ?? ""), String(item.info ?? ""));
    return { ...item, id: String(item.id), ...parsed, category: categories.find((category) => category.emoji === parsed.emoji)?.label ?? "Personal" };
  }), [memory.items]);
  const stories = memory.items.filter((item) => item.type === "story");
  const visibleFacts = facts.filter((fact) => filter === "All" || fact.category === filter);

  const openFamily = (person?: (typeof families)[number]) => {
    if (person) {
      setEditingId(person.id);
      setFamilyDraft({ name: person.name, relationship: person.relationship, city: person.city, phone: person.phone, info: person.detail });
    } else { setEditingId(null); setFamilyDraft({ name: "", relationship: "Son", city: "", phone: "", info: "" }); }
    setFamilyModal(true);
  };
  const saveFamily = async (event: FormEvent) => {
    event.preventDefault();
    const info = [`City: ${familyDraft.city.trim()}`, `Phone: ${familyDraft.phone.trim()}`, familyDraft.info.trim()].filter(Boolean).join("\n");
    const data = { type: "family", name: familyDraft.name.trim(), relationship: familyDraft.relationship, info };
    try {
      if (editingId) await memory.update(editingId, data); else await memory.create(data);
      setFamilyModal(false); setEditingId(null);
    } catch (error) { memory.setError(error instanceof Error ? error.message : "Could not save this family member."); }
  };
  const saveFact = async (event: FormEvent) => {
    event.preventDefault();
    const isStory = factDraft.emoji === "📖";
    const data = isStory ? { type: "story", name: factDraft.text.trim().split("\n")[0].slice(0, 100) || "Family story", info: factDraft.text.trim() } : { type: "fact", name: `${factDraft.emoji} ${factDraft.text.trim()}`, info: "" };
    try {
      if (editingId) await memory.update(editingId, data); else await memory.create(data);
      setFactModal(false); setEditingId(null); setFactDraft({ emoji: "💡", text: "" });
    } catch (error) { memory.setError(error instanceof Error ? error.message : "Could not save this memory."); }
  };
  const deleteRecord = async (id: string) => {
    try { await memory.remove(id); } catch (error) { memory.setError(error instanceof Error ? error.message : "Could not delete this memory."); }
  };

  return (
    <div className="min-h-screen bg-cream pb-28 text-ink">
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-line bg-white/95 backdrop-blur-sm"><div className="mx-auto flex h-full max-w-[1100px] items-center justify-between px-4 sm:px-6"><Link to="/caregiver" className="flex items-center gap-2.5"><span className="flex size-9 items-center justify-center rounded-xl bg-brand text-white"><Heart className="size-5 fill-current" /></span><span className="text-xl font-bold">SmritiVani</span></Link><button type="button" onClick={() => navigate("/caregiver/settings")} aria-label="Open settings" className="flex size-10 items-center justify-center rounded-full bg-brand text-white"><User className="size-5" /></button></div></header>
      <main className="mx-auto max-w-3xl px-4 pt-24 sm:px-6">
        <div className="flex items-center gap-3"><span className="flex size-12 items-center justify-center rounded-2xl bg-[#eee9fa] text-[#7562a8]"><Brain /></span><div><p className="text-sm font-bold text-muted">Care profile memories</p><h1 className="text-2xl font-bold">Memory bank</h1></div></div>
        {memory.error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{memory.error}</p>}

        <section className="mt-5 rounded-2xl border border-line bg-white p-5"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand"><Mic className="size-5" /></span><div><h2 className="font-bold">Memories recalled this week</h2><p className="text-sm text-muted">From saved voice interaction transcripts</p></div></div>{recalledMemories.length ? <div className="mt-4 space-y-2">{recalledMemories.map((item) => <article key={String(item.id)} className="rounded-xl bg-cream p-3"><p className="text-sm leading-6">{String(item.transcript ?? "")}</p><p className="mt-1 text-xs text-muted">{item.created_at ? new Date(String(item.created_at)).toLocaleString() : ""}</p></article>)}</div> : <p className="mt-4 text-sm text-muted">No memory-related voice interactions have been saved yet.</p>}</section>
        <div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full bg-brand-soft px-3 py-1.5 text-sm font-bold text-brand">{families.length} family</span><span className="rounded-full bg-sage px-3 py-1.5 text-sm font-bold text-forest">{facts.length} facts</span><span className="rounded-full bg-[#eee9fa] px-3 py-1.5 text-sm font-bold text-[#665199]">{stories.length} stories</span></div>
        <div className="sticky top-16 z-40 mt-5 rounded-2xl border border-line bg-white p-1.5"><div className="flex gap-1">{([{ id: "family", label: "Family", Icon: Users }, { id: "facts", label: "Facts", Icon: Lightbulb }, { id: "stories", label: "Stories", Icon: BookOpen }] as const).map(({ id, label, Icon }) => <button key={id} type="button" onClick={() => setTab(id)} className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold ${tab === id ? "bg-brand text-white" : "text-muted"}`}><Icon className="size-4" />{label}</button>)}</div></div>
        {memory.isLoading ? <div className="mt-8 rounded-2xl bg-white p-8 text-center font-bold text-muted">Loading saved memories…</div> : !memory.elderId ? <div className="mt-6 rounded-2xl bg-white p-6"><p className="font-bold">Create a care profile first.</p><Link to="/onboarding" className="mt-3 inline-block font-bold text-brand underline">Start onboarding</Link></div> : <>
          {tab === "family" && <section className="mt-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Family members</h2><button type="button" onClick={() => openFamily()} className="flex min-h-11 items-center gap-2 rounded-xl bg-forest px-4 font-bold text-white"><Plus className="size-4" /> Add member</button></div>{families.length ? <div className="grid gap-4 sm:grid-cols-2">{families.map((person) => <article key={person.id} className="rounded-2xl border border-line bg-white p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold">{person.name}</h3><p className="text-sm font-bold text-[#7562a8]">{person.relationship}</p></div><span className="flex size-11 items-center justify-center rounded-full bg-sage font-bold text-forest">{person.name.slice(0, 2).toUpperCase()}</span></div>{person.city && <p className="mt-3 text-sm text-muted">📍 {person.city}</p>}{person.phone && <a href={`tel:${person.phone.replace(/[^+\d]/g, "")}`} className="mt-1 inline-flex items-center gap-2 text-sm font-bold text-forest"><Phone className="size-4" />{person.phone}</a>}{person.detail && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">{person.detail}</p>}<div className="mt-4 flex gap-2"><button type="button" onClick={() => openFamily(person)} className="flex min-h-10 items-center gap-2 rounded-lg bg-cream px-3 text-sm font-bold"><Pencil className="size-4" /> Edit</button><button type="button" onClick={() => void deleteRecord(person.id)} className="flex min-h-10 items-center gap-2 rounded-lg bg-red-50 px-3 text-sm font-bold text-red-700"><Trash2 className="size-4" /> Remove</button></div></article>)}</div> : <div className="rounded-2xl border-2 border-dashed border-line-strong bg-white p-10 text-center text-muted"><Users className="mx-auto size-10" /><p className="mt-3 font-bold">No family members added</p><p className="mt-1 text-sm">Add a contact to keep important relationships with this profile.</p></div>}</section>}
          {tab === "facts" && <section className="mt-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Important facts</h2><button type="button" onClick={() => { setEditingId(null); setFactDraft({ emoji: "💡", text: "" }); setFactModal(true); }} className="flex min-h-11 items-center gap-2 rounded-xl bg-forest px-4 font-bold text-white"><Plus className="size-4" /> Add fact</button></div><div className="mb-4 flex gap-2 overflow-x-auto pb-2">{["All", ...categories.filter((category) => category.emoji !== "📖").map((category) => category.label)].map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${filter === item ? "border-forest bg-forest text-white" : "border-line bg-white text-muted"}`}>{item}</button>)}</div>{visibleFacts.length ? <div className="space-y-3">{visibleFacts.map((fact) => <article key={fact.id} className="flex items-start gap-4 rounded-2xl border border-line bg-white p-5"><span className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-xl ${colors[fact.emoji]}`}>{fact.emoji}</span><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase text-muted">{fact.category}</p><p className="mt-1 leading-6">{fact.text}</p></div><button type="button" onClick={() => { setEditingId(fact.id); setFactDraft({ emoji: fact.emoji, text: fact.text }); setFactModal(true); }} aria-label="Edit fact" className="rounded-lg p-2 text-muted hover:bg-cream"><Pencil className="size-4" /></button><button type="button" onClick={() => void deleteRecord(fact.id)} aria-label="Delete fact" className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="size-4" /></button></article>)}</div> : <div className="rounded-2xl border-2 border-dashed border-line-strong bg-white p-10 text-center text-muted"><Lightbulb className="mx-auto size-10" /><p className="mt-3 font-bold">No facts in this category</p></div>}</section>}
          {tab === "stories" && <section className="mt-5">{stories.length ? <div className="space-y-4">{stories.map((story) => <article key={String(story.id)} className="rounded-2xl border border-line bg-white p-5"><p className="text-sm font-bold text-[#7562a8]">Saved family story</p><h2 className="mt-1 text-xl font-bold">{String(story.name ?? "Story")}</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-muted">{String(story.info ?? "")}</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => { setEditingId(String(story.id)); setFactDraft({ emoji: "📖", text: String(story.info ?? story.name ?? "") }); setFactModal(true); }} className="flex min-h-10 items-center gap-2 rounded-lg bg-cream px-3 text-sm font-bold"><Pencil className="size-4" /> Edit story</button><button type="button" onClick={() => void deleteRecord(String(story.id))} className="flex min-h-10 items-center gap-2 rounded-lg bg-red-50 px-3 text-sm font-bold text-red-700"><Trash2 className="size-4" /> Remove story</button></div></article>)}</div> : <div className="rounded-2xl border-2 border-dashed border-line-strong bg-white p-10 text-center text-muted"><BookOpen className="mx-auto size-10" /><p className="mt-3 font-bold">No stories saved</p><p className="mt-1 text-sm">Add a story from the facts tab using the book category.</p><button type="button" onClick={() => { setTab("facts"); setFactDraft({ emoji: "📖", text: "" }); setFactModal(true); }} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#7562a8] px-4 font-bold text-white"><Plus className="size-4" /> Add a story</button></div>}</section>}
        </>}
      </main>
      <CaregiverBottomNav activeOverride="Memory" />

      {familyModal && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#24332f]/45 p-0 sm:items-center sm:p-4" onMouseDown={() => setFamilyModal(false)}><section role="dialog" aria-modal="true" aria-label="Family member details" onMouseDown={(event) => event.stopPropagation()} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl"><div className="flex items-center justify-between"><h2 className="text-2xl font-bold">{editingId ? "Edit family member" : "Add family member"}</h2><button type="button" onClick={() => setFamilyModal(false)} aria-label="Close" className="flex size-10 items-center justify-center rounded-xl bg-cream"><X /></button></div><form onSubmit={(event) => void saveFamily(event)} className="mt-5 space-y-4"><label className="block"><span className="mb-1 block font-bold">Name</span><input required value={familyDraft.name} onChange={(event) => setFamilyDraft({ ...familyDraft, name: event.target.value })} className={inputClass} /></label><label className="block"><span className="mb-1 block font-bold">Relationship</span><select value={familyDraft.relationship} onChange={(event) => setFamilyDraft({ ...familyDraft, relationship: event.target.value })} className={inputClass}>{relationships.map((relationship) => <option key={relationship}>{relationship}</option>)}</select></label><label className="block"><span className="mb-1 block font-bold">Phone</span><input type="tel" value={familyDraft.phone} onChange={(event) => setFamilyDraft({ ...familyDraft, phone: event.target.value })} className={inputClass} /></label><label className="block"><span className="mb-1 block font-bold">City</span><input value={familyDraft.city} onChange={(event) => setFamilyDraft({ ...familyDraft, city: event.target.value })} className={inputClass} /></label><label className="block"><span className="mb-1 block font-bold">About this person</span><textarea value={familyDraft.info} onChange={(event) => setFamilyDraft({ ...familyDraft, info: event.target.value })} className="min-h-24 w-full rounded-xl border-2 border-line-strong bg-cream p-4 outline-none focus:border-forest" /></label><button type="submit" className="h-12 w-full rounded-xl bg-forest font-bold text-white">{editingId ? "Save changes" : "Save family member"}</button></form></section></div>}
      {factModal && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#24332f]/45 p-0 sm:items-center sm:p-4" onMouseDown={() => setFactModal(false)}><section role="dialog" aria-modal="true" aria-label="Memory details" onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-xl rounded-t-3xl bg-white p-6 sm:rounded-3xl"><div className="flex items-center justify-between"><h2 className="text-2xl font-bold">{editingId ? "Edit memory" : "Add a memory"}</h2><button type="button" onClick={() => setFactModal(false)} aria-label="Close" className="flex size-10 items-center justify-center rounded-xl bg-cream"><X /></button></div><form onSubmit={(event) => void saveFact(event)} className="mt-5 space-y-4"><label className="block"><span className="mb-2 block font-bold">Category</span><select value={factDraft.emoji} onChange={(event) => setFactDraft({ ...factDraft, emoji: event.target.value })} className={inputClass}>{categories.map(({ emoji, label }) => <option key={emoji} value={emoji}>{emoji} {label}</option>)}</select></label><label className="block"><span className="mb-1 block font-bold">{factDraft.emoji === "📖" ? "Story title and details" : "Fact"}</span><textarea required value={factDraft.text} onChange={(event) => setFactDraft({ ...factDraft, text: event.target.value })} className="min-h-32 w-full rounded-xl border-2 border-line-strong bg-cream p-4 outline-none focus:border-forest" placeholder="Write the detail to remember…" /></label><button type="submit" className="h-12 w-full rounded-xl bg-forest font-bold text-white">{editingId ? "Save changes" : "Save memory"}</button></form></section></div>}
    </div>
  );
}
