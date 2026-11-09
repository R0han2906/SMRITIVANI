import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Home, Mic, Play, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AISpeaking() {
  const navigate = useNavigate();
  const [reply] = useState(() => sessionStorage.getItem("smritivani.last_spoken_response") ?? "");
  const [speechError, setSpeechError] = useState("");

  const readReply = () => {
    if (!reply) { setSpeechError("There is no saved voice response to play. Ask a voice command first."); return; }
    if (!("speechSynthesis" in window)) { setSpeechError("Spoken playback is not available in this browser."); return; }
    setSpeechError("");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(reply));
  };

  useEffect(() => { if (reply) readReply(); return () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }; }, []);

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-teal-50 via-cyan-50 to-white px-5 py-8 text-ink">
      <div className="absolute top-6 left-6"><button type="button" onClick={() => navigate("/elderly")} aria-label="Back to home" className="flex size-12 items-center justify-center rounded-xl bg-teal-600 text-white"><ArrowLeft className="size-6" /></button></div>
      <div className="flex size-28 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 text-white shadow-lg"><Volume2 className="size-14" /></div>
      <p className="mt-5 text-xl font-bold text-teal-700">SmritiVani voice reply</p>
      {reply ? <section className="mt-7 max-w-xl rounded-3xl border-2 border-line bg-white p-7 text-center shadow-[6px_6px_0_#e6dece]"><p className="text-2xl leading-relaxed">{reply}</p><button type="button" onClick={readReply} className="mx-auto mt-6 flex min-h-12 items-center gap-2 rounded-xl bg-teal-100 px-5 font-bold text-teal-800"><Play className="size-5 fill-current" />Read again</button></section> : <p className="mt-7 max-w-md rounded-2xl bg-white p-6 text-center text-muted">No voice response is available yet. Use the microphone to ask about your saved care information.</p>}
      {speechError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 font-bold text-red-700">{speechError}</p>}
      <div className="mt-6 flex w-full max-w-sm flex-col gap-3"><button type="button" onClick={() => navigate("/elderly/listening")} className="flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-brand font-bold text-white"><Mic className="size-5" />Ask again</button><button type="button" onClick={() => navigate("/elderly")} className="flex min-h-14 items-center justify-center gap-3 rounded-2xl border-2 border-slate-300 bg-white font-bold text-slate-700"><Home className="size-5" />Go home</button></div>
      <p className="mt-7 max-w-md text-center text-sm leading-6 text-muted">Spoken playback uses your browser. AI-generated conversation is not connected to the current backend.</p>
    </motion.main>
  );
}
