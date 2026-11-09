import { motion } from "framer-motion";
import { ArrowLeft, Mic, Square } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useVoiceChat from "../../hooks/useVoiceChat";
import { usePatientResources } from "../../hooks/usePatientResources";
import { getGnaniLanguageLabel, toGnaniLanguageCode } from "../../utils/languages";

export default function Listening() {
  const navigate = useNavigate();
  const { elder } = usePatientResources([]);
  const language = toGnaniLanguageCode(elder?.language);
  const { state, transcript, response, error, fallbackReason, start, stop } = useVoiceChat(language);
  const recording = state === "recording";
  const busy = state === "processing" || state === "speaking";
  const beginPress = (event) => {
    if (event.button !== 0 || busy) return;
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); void start();
  };
  const endPress = (event) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    stop();
  };
  const beginKeyPress = (event) => {
    if ((event.code === "Space" || event.code === "Enter") && !event.repeat) { event.preventDefault(); void start(); }
  };
  const endKeyPress = (event) => {
    if (event.code === "Space" || event.code === "Enter") { event.preventDefault(); stop(); }
  };
  return <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-screen flex-col items-center bg-cream px-5 py-8 text-ink">
    <div className="w-full max-w-xl"><button type="button" onClick={() => { stop(); navigate("/elderly"); }} aria-label="Back to home" className="flex size-12 items-center justify-center rounded-xl bg-brand text-white"><ArrowLeft className="size-6" /></button></div>
    <section className="my-auto flex w-full max-w-xl flex-col items-center py-8 text-center">
      <p className="text-3xl font-bold">{recording ? "I’m listening…" : busy ? "One moment…" : "Boliye, main sun rahi hoon"}</p>
      <p className="mt-2 text-lg text-muted">Speak naturally in {getGnaniLanguageLabel(elder?.language)}.</p>
      <button type="button" onPointerDown={beginPress} onPointerUp={endPress} onPointerCancel={stop} onKeyDown={beginKeyPress} onKeyUp={endKeyPress} onBlur={stop} disabled={busy} aria-label={recording ? "Listening. Release to send." : "Press and hold to speak"} aria-pressed={recording} className={`mt-8 flex size-48 touch-none select-none items-center justify-center rounded-full text-white shadow-[8px_8px_0_#e6dece] disabled:opacity-60 ${recording ? "animate-pulse bg-red-600 ring-8 ring-red-100" : "bg-brand"}`}>{recording ? <Square className="size-16 fill-current" /> : <Mic className="size-20" strokeWidth={1.5} />}</button>
      <p className="mt-3 text-sm font-semibold text-muted">{recording ? "Listening… release when you’re finished." : "Press and hold while you speak, then release to send."}</p>
      {transcript && <p className="mt-7 w-full rounded-2xl border border-line bg-white p-5 text-xl italic">“{transcript}”</p>}
      {response && <p role="status" className="mt-4 w-full rounded-2xl bg-sage p-5 text-lg leading-7 text-forest">{response}</p>}
      {fallbackReason && <p className="mt-3 text-sm text-amber-800">{fallbackReason}</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 font-bold text-red-700">{error}</p>}
      <div className="mt-7 grid w-full grid-cols-2 gap-3">{[{ name: "Medicines", path: "/elderly/medicine" }, { name: "Schedule", path: "/elderly/events" }, { name: "Family", path: "/elderly/family" }, { name: "Help", path: "/elderly/emergency" }].map((item) => <button key={item.name} type="button" onClick={() => navigate(item.path)} className="min-h-14 rounded-xl bg-white px-4 font-bold shadow-sm">{item.name}</button>)}</div>
      <p className="mt-7 text-xs leading-5 text-muted">Your words are routed through one voice pipeline. Emergency phrases open the help screen.</p>
    </section>
  </motion.main>;
}
