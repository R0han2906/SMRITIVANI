import { motion } from "framer-motion";
import { ArrowLeft, Heart, MessageCircle, Phone, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { usePatientResources } from "../../hooks/usePatientResources";
import useScreenVoiceRouter from "../../hooks/useScreenVoiceRouter";

function familyInfo(info = "") {
  return {
    phone: info.match(/^Phone: (.*)$/m)?.[1] ?? "",
    detail: info.split("\n").filter((line) => !line.startsWith("City: ") && !line.startsWith("Phone: ")).join("\n").trim(),
  };
}

export default function Family() {
  const navigate = useNavigate();
  const { data, isLoading, error } = usePatientResources(["memories", "contacts", "messages", "voice-notes"]);
  const { isFromVoice, voiceIntent, markVoiceHandled } = useScreenVoiceRouter();
  const memberRows = [
    ...(data.memories ?? []).filter((row) => row.type === "family").map((row) => ({ ...row, source: "memory", ...familyInfo(typeof row.info === "string" ? row.info : "") })),
    ...(data.contacts ?? []).map((row) => ({ ...row, source: "contact", phone: String(row.phone ?? ""), detail: String(row.city ?? "") })),
  ];
  const members = [...new Map(memberRows.map((member) => [`${String(member.name ?? "").trim().toLowerCase()}|${member.phone.replace(/\D/g, "")}`, member])).values()];
  const messages = (data.messages ?? []).slice().sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
  const voiceNotes = (data["voice-notes"] ?? []).filter((note) => typeof note.transcript === "string" && note.transcript.trim());

  useEffect(() => {
    // If routed via voice family intent, mark as handled
    if (isFromVoice && voiceIntent === "family") {
      markVoiceHandled();
    }
  }, [isFromVoice, voiceIntent, markVoiceHandled]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#fff7ed] pb-20 text-ink">
      <header className="flex items-center gap-4 border-b border-line bg-white/95 px-4 py-4 backdrop-blur-sm"><button type="button" onClick={() => navigate("/elderly")} aria-label="Back to home" className="flex size-12 items-center justify-center rounded-xl bg-cream text-muted"><ArrowLeft className="size-6" /></button><div><h1 className="text-2xl font-black sm:text-3xl">My family 👨‍👩‍👧</h1><p className="mt-1 text-base text-slate-500">People and messages saved for you</p></div></header>
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 font-bold text-red-700">{error}</p>}
        <section><h2 className="mb-4 flex items-center gap-2 text-2xl font-bold"><Users className="size-6 text-[#7562a8]" />Family contacts</h2>{isLoading ? <p className="rounded-2xl bg-white p-5 text-muted">Loading saved family…</p> : members.length ? <div className="flex flex-col gap-4">{members.map((member) => { const phone = String(member.phone ?? ""); const name = String(member.name ?? "Family member"); return <article key={`${member.source}-${String(member.id)}`} className="flex flex-col items-center gap-4 rounded-3xl bg-white p-6 text-center shadow-[6px_6px_0_#e6dece] sm:flex-row sm:text-left"><span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-sage text-2xl font-black text-forest">{name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><div className="min-w-0 flex-1"><p className="text-2xl font-bold">{name}</p>{typeof member.relationship === "string" && <p className="text-lg text-slate-500">{member.relationship}</p>}{member.detail && <p className="mt-1 text-sm text-muted">{String(member.detail)}</p>}{phone && <p className="mt-2 text-lg font-bold text-forest">{phone}</p>}</div>{phone && <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} aria-label={`Call ${name}`} className="flex size-14 items-center justify-center rounded-full bg-green-600 text-white"><Phone className="size-7" /></a>}</article>; })}</div> : <p className="rounded-2xl border border-dashed border-line-strong bg-white p-6 text-muted">Your caregiver has not added family contacts yet.</p>}</section>
        <section className="mt-8"><h2 className="mb-4 flex items-center gap-2 text-2xl font-bold"><MessageCircle className="size-6 text-brand" />Saved messages</h2>{messages.length || voiceNotes.length ? <div className="flex flex-col gap-4">{messages.map((message) => <article key={String(message.id)} className="rounded-2xl bg-white p-5 shadow-[4px_4px_0_#e6dece]"><p className="text-sm font-bold text-brand">{message.speaker === "patient" ? "You said" : message.speaker === "assistant" ? "SmritiVani" : "Caregiver message"} · {message.created_at ? new Date(String(message.created_at)).toLocaleString() : "Saved message"}</p><p className="mt-3 text-xl leading-8">{String(message.content ?? "")}</p></article>)}{voiceNotes.map((note) => <article key={String(note.id)} className="rounded-2xl bg-white p-5 shadow-[4px_4px_0_#e6dece]"><p className="flex items-center gap-2 text-sm font-bold text-[#7562a8]"><Heart className="size-4" />Saved voice-note transcript · {note.created_at ? new Date(String(note.created_at)).toLocaleString() : "Date unavailable"}</p><p className="mt-3 text-xl leading-8">{String(note.transcript)}</p></article>)}</div> : <p className="rounded-2xl border border-dashed border-line-strong bg-white p-6 text-muted">No saved messages or transcripts are available yet.</p>}<p className="mt-3 text-sm leading-6 text-muted">This backend stores message text and voice-note transcripts only. It does not provide audio playback or a reply-recording endpoint.</p></section>
      </main>
    </motion.div>
  );
}
