import { motion } from "framer-motion";
import { ArrowLeft, Heart, Lightbulb, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePatientResources } from "../../hooks/usePatientResources";

const interestIcons = ["🎵", "🍚", "📍", "☕", "💡", "🌼"];

export default function Activities() {
  const navigate = useNavigate();
  const { data, isLoading, error } = usePatientResources(["memories"]);
  const interests = (data.memories ?? []).filter((item) => item.type === "fact" || item.type === "preference").map((item, index) => ({ id: String(item.id), name: String(item.name ?? "A saved interest").replace(/^(🎵|🍚|📍|⚠️|☕|📖|💡)\s*/, ""), detail: String(item.info ?? ""), icon: interestIcons[index % interestIcons.length] }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gradient-to-b from-amber-100 via-orange-50 to-yellow-50 pb-20 text-ink">
      <header className="flex items-center gap-4 border-b border-amber-200 bg-white/95 px-4 py-4 backdrop-blur-sm"><button type="button" onClick={() => navigate("/elderly")} aria-label="Back to home" className="flex size-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800"><ArrowLeft className="size-6" /></button><div><h1 className="text-2xl font-black text-amber-900 sm:text-3xl">Things I enjoy ✨</h1><p className="text-sm text-amber-700">From your saved care profile</p></div></header>
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 font-bold text-red-700">{error}</p>}
        <section className="rounded-3xl bg-white p-6 shadow-[6px_6px_0_#e6dece] sm:p-8"><h2 className="flex items-center gap-2 text-2xl font-bold"><Heart className="size-6 fill-rose-500 text-rose-500" />Saved interests and memories</h2>{isLoading ? <p className="mt-5 text-muted">Loading saved interests…</p> : interests.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{interests.map((interest) => <article key={interest.id} className="rounded-2xl bg-amber-50 p-5"><span className="text-4xl">{interest.icon}</span><h3 className="mt-3 text-xl font-bold text-amber-950">{interest.name}</h3>{interest.detail && <p className="mt-2 leading-6 text-slate-600">{interest.detail}</p>}</article>)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-line-strong p-6 text-center"><Lightbulb className="mx-auto size-9 text-amber-700" /><p className="mt-3 font-bold">No interests have been saved yet</p><p className="mt-1 text-muted">Your caregiver can add favorite activities and memories to your profile.</p></div>}</section>
        <button type="button" onClick={() => navigate("/elderly/bhajan")} className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 font-bold text-white"><Music className="size-5" />My favorite music</button>
        <p className="mt-5 rounded-xl bg-white/80 p-4 text-sm leading-6 text-amber-900">These details come from your saved memories. Activity suggestions and activity tracking are not available in the current care service.</p>
      </main>
    </motion.div>
  );
}
