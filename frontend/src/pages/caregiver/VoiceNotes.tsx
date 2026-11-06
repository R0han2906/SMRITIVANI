import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  CheckCheck,
  Clock3,
  Mic,
  Pause,
  Play,
  Send,
  Sparkles,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { CaregiverBottomNav, CaregiverTopNav } from "../../components/layout/CaregiverChrome";

type RecordingState = "idle" | "recording" | "preview";
type Filter = "all" | "you" | "parent" | "unheard";
type VoiceNote = {
  id: number;
  sender: "parent" | "you";
  date: string;
  duration: number;
  durationLabel: string;
  transcript: string;
  heard: boolean;
  initialProgress: number;
};

const waveform = [
  12, 22, 34, 17, 28, 40, 19, 11, 30, 25, 16, 37, 21, 14, 32, 24, 10, 27, 38, 20, 13, 29, 18, 35,
  22, 9, 26, 33, 17, 12, 31, 23, 15, 39, 20, 11, 28, 36, 18, 14, 30, 21, 10, 25, 34, 16, 12, 27, 20,
  9,
];
const liveWaveform = [
  12, 25, 36, 18, 32, 22, 40, 16, 28, 12, 35, 20, 30, 15, 38, 24, 14, 33, 19, 28, 40, 17, 25, 12,
  31, 22, 36, 16, 29, 20,
];

const initialNotes: VoiceNote[] = [
  {
    id: 1,
    sender: "parent",
    date: "Today, 11:00 AM",
    duration: 22,
    durationLabel: "0:22",
    transcript:
      "Beta, ghar mein sab theek hai. Tum apna khayal rakhna. Main dawai time pe le raha hoon.",
    heard: false,
    initialProgress: 0,
  },
  {
    id: 2,
    sender: "you",
    date: "Today, 10:30 AM",
    duration: 15,
    durationLabel: "0:15",
    transcript:
      "Papa, main Sunday ko aa raha hoon. Dawai time pe lena. Aur haan, Gupta uncle ko mera namaste bolna.",
    heard: true,
    initialProgress: 100,
  },
  {
    id: 3,
    sender: "parent",
    date: "Yesterday, 6:30 PM",
    duration: 35,
    durationLabel: "0:35",
    transcript:
      "Beta, aaj doctor ke paas gaya tha. Sab theek bola. BP thoda high hai lekin dawai se control ho jayega.",
    heard: true,
    initialProgress: 60,
  },
  {
    id: 4,
    sender: "you",
    date: "Yesterday, 9:00 PM",
    duration: 10,
    durationLabel: "0:10",
    transcript: "Papa, kal eye checkup hai. Bhoolna mat. Main call karunga.",
    heard: false,
    initialProgress: 100,
  },
  {
    id: 5,
    sender: "parent",
    date: "Yesterday, 2:00 PM",
    duration: 18,
    durationLabel: "0:18",
    transcript: "Aaj bahut achha lag raha hai. Bhajan suna aur chai pi.",
    heard: true,
    initialProgress: 100,
  },
];

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function VoiceNotes() {
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<Filter>("all");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingNote, setPlayingNote] = useState<number | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<Record<number, number>>(
    Object.fromEntries(initialNotes.map((note) => [note.id, note.initialProgress])),
  );
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    if (recordingState !== "recording") return;
    const timer = window.setInterval(() => setRecordingTime((time) => time + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recordingState]);

  useEffect(() => {
    if (playingNote === null) return;
    const note = notes.find((item) => item.id === playingNote);
    if (!note) return;
    const increment = 100 / (note.duration * 5);
    const timer = window.setInterval(() => {
      setPlaybackProgress((current) => {
        const next = Math.min(100, (current[playingNote] ?? 0) + increment);
        if (next >= 100) {
          window.clearInterval(timer);
          window.setTimeout(() => setPlayingNote(null), 0);
        }
        return { ...current, [playingNote]: next };
      });
    }, 200);
    return () => window.clearInterval(timer);
  }, [playingNote, notes]);

  const filteredNotes = useMemo(
    () =>
      notes.filter((note) => {
        if (filter === "you") return note.sender === "you";
        if (filter === "parent") return note.sender === "parent";
        if (filter === "unheard") return !note.heard;
        return true;
      }),
    [filter, notes],
  );

  const togglePlayback = (note: VoiceNote) => {
    if (playingNote === note.id) {
      setPlayingNote(null);
      return;
    }
    if ((playbackProgress[note.id] ?? 0) >= 100) {
      setPlaybackProgress((current) => ({ ...current, [note.id]: 0 }));
    }
    setPlayingNote(note.id);
  };

  const startRecording = () => {
    setRecordingTime(0);
    setRecordingState("recording");
  };

  const sendRecording = () => {
    const id = Date.now();
    const duration = Math.max(recordingTime, 1);
    setNotes((current) => [
      {
        id,
        sender: "you",
        date: "Just now",
        duration,
        durationLabel: formatTime(duration),
        transcript: "New voice note. Transcript will appear after processing.",
        heard: false,
        initialProgress: 0,
      },
      ...current,
    ]);
    setPlaybackProgress((current) => ({ ...current, [id]: 0 }));
    setRecordingState("idle");
    setRecordingTime(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-cream pb-52 text-ink"
    >
      <CaregiverTopNav />
      <main className="mx-auto max-w-2xl px-4 pt-20 sm:px-6">
        <header className="pt-4">
          <h1 className="text-4xl font-bold tracking-tight">Voice notes</h1>
          <p className="mt-2 text-lg text-muted">Send and receive voice messages with Ramesh.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700">
              {notes.filter((note) => !note.heard).length} unheard
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-muted">
              {notes.length} total
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-muted">
              Last: 2 hrs ago
            </span>
          </div>
        </header>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {[
            ["all", "All"],
            ["you", "From you"],
            ["parent", "From parent"],
            ["unheard", "Unheard"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id as Filter)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                filter === id
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-muted hover:border-brand"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <AnimatePresence mode="popLayout">
            {filteredNotes.map((note, index) => {
              const sent = note.sender === "you";
              const progress = playbackProgress[note.id] ?? note.initialProgress;
              return (
                <motion.article
                  layout
                  key={note.id}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: reduceMotion ? 0 : index * 0.07 }}
                  className={`relative overflow-hidden rounded-2xl border p-5 shadow-[4px_4px_0_#e6dece] ${
                    sent ? "border-[#ead19f] bg-[#fff8e8]" : "border-line bg-white"
                  }`}
                >
                  {!note.heard && !sent && (
                    <motion.span
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-y-0 left-0 w-1.5 bg-blue-500"
                    />
                  )}
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                        sent ? "bg-forest" : "bg-brand"
                      }`}
                    >
                      RS
                    </span>
                    <div>
                      <p className="font-bold">{sent ? "You → Ramesh" : "From Ramesh"}</p>
                      <p className="text-xs text-muted">{note.date}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                      {note.heard ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-forest">
                          <CheckCheck className="size-4" /> Heard
                        </span>
                      ) : sent ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-brand">
                          <Clock3 className="size-4" /> Not heard
                        </span>
                      ) : (
                        <motion.span
                          animate={{ scale: [1, 1.18, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="size-3 rounded-full bg-blue-500"
                          aria-label="Unheard"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setNotes((current) => current.filter((item) => item.id !== note.id))
                        }
                        className="text-muted hover:text-red-600"
                        aria-label="Delete note"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-4">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={() => togglePlayback(note)}
                      className={`flex size-12 shrink-0 items-center justify-center rounded-full text-white shadow-md ${
                        sent ? "bg-brand" : "bg-forest"
                      }`}
                    >
                      {playingNote === note.id ? (
                        <Pause className="size-5 fill-current" />
                      ) : (
                        <Play className="size-5 fill-current" />
                      )}
                    </motion.button>
                    <div className="flex h-12 flex-1 items-center gap-[2px]" aria-hidden="true">
                      {waveform.map((height, bar) => {
                        const played = (bar / waveform.length) * 100 <= progress;
                        return (
                          <span
                            key={bar}
                            style={{ height }}
                            className={`min-w-[2px] flex-1 rounded-full transition-colors ${
                              sent
                                ? played
                                  ? "bg-brand"
                                  : "bg-[#e7ab8e]"
                                : played
                                  ? "bg-forest"
                                  : "bg-[#b9d5c1]"
                            }`}
                          />
                        );
                      })}
                    </div>
                    <span className="shrink-0 text-sm font-bold text-muted">
                      {note.durationLabel}
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl border border-line bg-white/70 p-4">
                    <p className="text-xs font-bold tracking-wider text-muted uppercase">
                      Transcript
                    </p>
                    <p className="mt-1 text-base leading-6 text-muted">{note.transcript}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs italic text-muted">
                      <Sparkles className="size-3" /> Auto-transcribed by Gnani AI
                    </p>
                  </div>

                  {!sent && (
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={startRecording}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-soft text-sm font-bold text-brand"
                      >
                        <Mic className="size-4" /> Reply
                      </button>
                      {!note.heard && (
                        <button
                          type="button"
                          onClick={() =>
                            setNotes((current) =>
                              current.map((item) =>
                                item.id === note.id ? { ...item, heard: true } : item,
                              ),
                            )
                          }
                          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-50 text-sm font-bold text-blue-700"
                        >
                          <Check className="size-4" /> Mark heard
                        </button>
                      )}
                    </div>
                  )}
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-[76px] z-40 border-t border-line bg-white/95 shadow-[0_-8px_24px_rgba(64,55,40,0.08)] backdrop-blur-sm">
        <AnimatePresence mode="wait">
          {recordingState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-4"
            >
              <div className="flex-1">
                <p className="font-bold">Send a voice note to Ramesh</p>
                <p className="text-sm text-muted">Tap the microphone and speak naturally.</p>
              </div>
              <motion.button
                type="button"
                onClick={startRecording}
                whileTap={{ scale: 0.9 }}
                animate={{
                  boxShadow: ["0 0 0 0 rgba(239,68,68,0.28)", "0 0 0 12px rgba(239,68,68,0)"],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex size-16 shrink-0 items-center justify-center rounded-full bg-red-500 text-white"
                aria-label="Start recording"
              >
                <Mic className="size-7" />
              </motion.button>
            </motion.div>
          )}

          {recordingState === "recording" && (
            <motion.div
              key="recording"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="border-t-2 border-red-300 bg-red-50"
            >
              <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
                <motion.span
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="size-4 shrink-0 rounded-full bg-red-500"
                />
                <span className="font-mono text-xl font-bold text-red-700">
                  {formatTime(recordingTime)}
                </span>
                <div className="flex h-10 min-w-0 flex-1 items-center gap-[2px]" aria-hidden="true">
                  {liveWaveform.map((height, index) => (
                    <motion.span
                      key={index}
                      animate={{ height: [height * 0.45, height, height * 0.6] }}
                      transition={{ duration: 0.55 + (index % 4) * 0.1, repeat: Infinity }}
                      className="min-w-[2px] flex-1 rounded-full bg-red-400"
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setRecordingState("preview")}
                  className="flex size-13 shrink-0 items-center justify-center rounded-full bg-red-500 text-white"
                  aria-label="Stop recording"
                >
                  <Square className="size-5 fill-current" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecordingState("idle");
                    setRecordingTime(0);
                  }}
                  className="flex size-13 shrink-0 items-center justify-center rounded-full bg-line text-muted"
                  aria-label="Cancel recording"
                >
                  <X className="size-5" />
                </button>
              </div>
            </motion.div>
          )}

          {recordingState === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="border-t-2 border-[#9fc8b5] bg-[#edf7ef]"
            >
              <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-3 px-4 py-4">
                <button
                  type="button"
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-forest text-white"
                >
                  <Play className="size-4 fill-current" />
                </button>
                <div className="flex h-9 min-w-24 flex-1 items-center gap-[2px]" aria-hidden="true">
                  {liveWaveform.slice(0, 22).map((height, index) => (
                    <span
                      key={index}
                      style={{ height: height * 0.75 }}
                      className="min-w-[2px] flex-1 rounded-full bg-forest"
                    />
                  ))}
                </div>
                <span className="font-bold text-forest">{formatTime(recordingTime)}</span>
                <button
                  type="button"
                  onClick={sendRecording}
                  className="flex h-12 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white"
                >
                  <Send className="size-4" /> Send
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecordingState("idle");
                    setRecordingTime(0);
                  }}
                  className="flex size-12 items-center justify-center rounded-xl bg-line text-muted"
                  aria-label="Delete recording"
                >
                  <Trash2 className="size-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CaregiverBottomNav activeOverride="Notes" />
    </motion.div>
  );
}
