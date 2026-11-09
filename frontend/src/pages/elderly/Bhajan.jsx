import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mic, Music, Pause, Play } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePatientResources } from "../../hooks/usePatientResources";
import useScreenVoiceRouter from "../../hooks/useScreenVoiceRouter";

const HANUMAN_CHALISA_ID = "AETFvQonfV8";

export default function Bhajan() {
  const navigate = useNavigate();
  const location = useLocation();
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(location.state?.autoplay === true);
  const { data, isLoading, error } = usePatientResources(["memories"]);
  const { isFromVoice, voiceIntent, markVoiceHandled } = useScreenVoiceRouter();
  const favorites = (data.memories ?? []).filter((item) => item.type === "preference" || item.type === "fact").filter((item) => /🎵|bhajan|music|song|prayer/i.test(String(item.name ?? ""))).map((item) => ({ id: String(item.id), name: String(item.name ?? "Favorite music").replace(/^🎵\s*/, ""), detail: String(item.info ?? "") }));

  const pausePlayback = () => {
    playerRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }), "https://www.youtube.com");
    setIsPlaying(false);
  };
  const startPlayback = () => setIsPlaying(true);

  useEffect(() => {
    const onPause = () => pausePlayback();
    window.addEventListener("smritivani:pause-bhajan", onPause);
    return () => window.removeEventListener("smritivani:pause-bhajan", onPause);
  }, []);

  useEffect(() => {
    // If routed via voice bhajan intent, auto-play
    if (isFromVoice && voiceIntent === "bhajan") {
      startPlayback();
      markVoiceHandled();
    }
  }, [isFromVoice, voiceIntent, markVoiceHandled]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gradient-to-b from-amber-100 via-orange-50 to-yellow-50 pb-20 text-ink">
      <header className="flex items-center gap-4 border-b border-amber-200 bg-white/95 px-4 py-4"><button type="button" onClick={() => navigate("/elderly")} aria-label="Back home" className="flex size-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800"><ArrowLeft className="size-6" /></button><div className="min-w-0 flex-1"><h1 className="text-2xl font-black text-amber-900">My favorite music 🙏</h1><p className="text-sm text-amber-700">Listen to a devotional favorite</p></div><button type="button" onClick={() => navigate("/elderly/listening")} aria-label="Speak to SmritiVani" className="flex size-12 items-center justify-center rounded-xl bg-forest text-white"><Mic /></button></header>
      <main className="mx-auto max-w-2xl px-4 py-7 sm:px-6">
        {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 font-bold text-red-700">{error}</p>}
        <section className="rounded-3xl bg-white p-6 shadow-[6px_6px_0_#e6dece]"><h2 className="flex items-center gap-2 text-2xl font-bold"><Music className="size-6 text-amber-700" />Hanuman Chalisa</h2><p className="mt-2 leading-6 text-muted">A devotional video from T-Series Bhakti Sagar. Playback uses YouTube.</p>
          <div className="mt-5 overflow-hidden rounded-2xl bg-black"><div className="aspect-video">{isPlaying ? <iframe ref={playerRef} title="Hanuman Chalisa by T-Series Bhakti Sagar" src={`https://www.youtube-nocookie.com/embed/${HANUMAN_CHALISA_ID}?autoplay=1&enablejsapi=1&rel=0`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen className="h-full w-full" /> : <button type="button" onClick={startPlayback} aria-label="Play Hanuman Chalisa" className="flex h-full min-h-48 w-full flex-col items-center justify-center gap-3 bg-amber-900 text-white"><Play className="size-14 fill-current" /><span className="text-xl font-bold">Play Hanuman Chalisa</span></button>}</div></div>
          <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={isPlaying ? pausePlayback : startPlayback} className="flex min-h-12 items-center gap-2 rounded-xl bg-amber-100 px-5 font-bold text-amber-950">{isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}{isPlaying ? "Pause bhajan" : "Play bhajan"}</button><button type="button" onClick={() => navigate("/elderly/listening")} className="flex min-h-12 items-center gap-2 rounded-xl bg-sage px-5 font-bold text-forest"><Mic className="size-5" />Say “ruk jao” or ask for help</button></div>
        </section>
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-[6px_6px_0_#e6dece]"><h2 className="text-xl font-bold">Saved music favorites</h2>{isLoading ? <p className="mt-4 text-muted">Loading your favorites…</p> : favorites.length ? <div className="mt-4 space-y-3">{favorites.map((favorite) => <article key={favorite.id} className="rounded-2xl bg-amber-50 p-4"><p className="font-bold text-amber-950">{favorite.name}</p>{favorite.detail && <p className="mt-1 leading-6 text-slate-600">{favorite.detail}</p>}</article>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-line-strong p-5 text-muted">No other music preferences are saved yet. Your caregiver can add them to your care profile.</p>}</section>
      </main>
    </motion.div>
  );
}
