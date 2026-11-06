import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Moon,
  Music2,
  Phone,
  Pill,
  Play,
  Sparkles,
  Sun,
  Utensils,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CaregiverBottomNav } from "../../components/layout/CaregiverChrome";

const days = ["Yesterday, 14 June", "Today, 15 June", "Tomorrow, 16 June"];
const activities = [
  {
    time: "7:00 AM",
    title: "Good morning call",
    text: "SmritiVani greeted Maa and she responded cheerfully.",
    duration: "5 min",
    mood: "😊",
    icon: Sun,
    color: "border-l-green-500",
    iconColor: "bg-amber-50 text-amber-700",
  },
  {
    time: "8:30 AM",
    title: "Medicine taken",
    text: "Morning medicines were confirmed through voice.",
    duration: "2 min",
    mood: "✅",
    icon: Pill,
    color: "border-l-green-500",
    iconColor: "bg-green-50 text-green-700",
  },
  {
    time: "10:00 AM",
    title: "Reminiscence session",
    text: "Talked about her wedding day and remembered it with joy.",
    duration: "22 min",
    mood: "😊",
    icon: Phone,
    color: "border-l-green-500",
    iconColor: "bg-brand-soft text-brand",
  },
  {
    time: "1:00 PM",
    title: "Lunch reminder",
    text: "Reminded to eat; she said she had already finished lunch.",
    duration: "3 min",
    mood: "😐",
    icon: Utensils,
    color: "border-l-amber-400",
    iconColor: "bg-amber-50 text-amber-700",
  },
  {
    time: "3:30 PM",
    title: "Bhajan session",
    text: "Listened to Hanuman Chalisa and happily sang along.",
    duration: "30 min",
    mood: "😄",
    icon: Music2,
    color: "border-l-green-500",
    iconColor: "bg-[#eee9fa] text-[#665199]",
  },
  {
    time: "6:00 PM",
    title: "Evening check-in",
    text: "Seemed a little tired and mentioned mild knee pain.",
    duration: "10 min",
    mood: "😟",
    icon: Phone,
    color: "border-l-red-400",
    iconColor: "bg-red-50 text-red-700",
  },
  {
    time: "9:00 PM",
    title: "Goodnight call",
    text: "Said goodnight and asked about Rahul’s next visit.",
    duration: "8 min",
    mood: "😊",
    icon: Moon,
    color: "border-l-green-500",
    iconColor: "bg-blue-50 text-blue-700",
  },
];

export default function DailyLog() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [dayIndex, setDayIndex] = useState(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.45 }}
      className="min-h-screen bg-cream pb-28 text-ink"
    >
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-20 max-w-2xl items-center gap-4 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-cream text-muted"
          >
            <ArrowLeft className="size-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Daily log</h1>
            <p className="text-base text-muted">Maa’s complete day at a glance</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-28 sm:px-6">
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={dayIndex === 0}
            onClick={() => setDayIndex((value) => Math.max(0, value - 1))}
            className="flex size-12 items-center justify-center rounded-xl bg-white text-muted disabled:opacity-30"
          >
            <ChevronLeft />
          </button>
          <p className="min-w-44 text-center text-lg font-bold text-brand">{days[dayIndex]}</p>
          <button
            type="button"
            disabled={dayIndex === days.length - 1}
            onClick={() => setDayIndex((value) => Math.min(days.length - 1, value + 1))}
            className="flex size-12 items-center justify-center rounded-xl bg-white text-muted disabled:opacity-30"
          >
            <ChevronRight />
          </button>
        </div>

        <section className="relative mt-8 overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-[4px_4px_0_#e6dece]">
          <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand to-forest" />
          <div className="mt-2 flex items-center gap-4">
            <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-6xl">
              😊
            </motion.span>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">Good day</h2>
              <p className="mt-1 text-muted">Mood score</p>
            </div>
            <span className="text-2xl font-bold text-brand">7.5 / 10</span>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-line">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "75%" }}
              transition={{ duration: 0.8 }}
              className="h-full rounded-full bg-brand"
            />
          </div>
          <p className="mt-4 italic text-muted">
            Mood improved after the afternoon bhajan session.
          </p>
          <div className="mt-5 flex items-center justify-between rounded-xl bg-cream px-4 py-3 text-2xl">
            {["😢", "😟", "😐", "😊", "😄"].map((mood) => (
              <motion.span
                key={mood}
                animate={mood === "😊" ? { scale: 1.35 } : { scale: 0.9 }}
                className={mood === "😊" ? "rounded-full bg-brand-soft p-2" : "p-2 opacity-55"}
              >
                {mood}
              </motion.span>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold">Today’s timeline</h2>
          <div className="mt-5 ml-4 border-l-2 border-line pl-7">
            {activities.map(
              ({ time, title, text, duration, mood, icon: Icon, color, iconColor }, index) => (
                <motion.article
                  key={time}
                  initial={{ opacity: 0, x: reduceMotion ? 0 : -18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: reduceMotion ? 0 : index * 0.07 }}
                  className={`relative mb-5 rounded-2xl border border-line border-l-4 bg-white p-4 last:mb-0 ${color}`}
                >
                  <span className="absolute top-6 -left-[2.37rem] size-4 rounded-full border-4 border-cream bg-brand" />
                  <div className="flex items-start gap-4">
                    <span
                      className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${iconColor}`}
                    >
                      <Icon className="size-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-muted">{time}</p>
                          <h3 className="text-lg font-bold">{title}</h3>
                        </div>
                        <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-muted">
                          {duration}
                        </span>
                      </div>
                      <p className="mt-2 leading-6 text-muted">{text}</p>
                    </div>
                    <span className="text-xl">{mood}</span>
                  </div>
                </motion.article>
              ),
            )}
          </div>
        </section>

        <section className="relative mt-8 overflow-hidden rounded-2xl border border-line bg-white p-6">
          <span className="absolute inset-x-0 top-0 h-1.5 bg-forest" />
          <h2 className="mt-1 text-xl font-bold">Medicine compliance</h2>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              ["Morning", "Amlodipine", "8:30 AM", true],
              ["Afternoon", "Eye drops", "2:00 PM", true],
              ["Evening", "Metformin", "9:00 PM", false],
            ].map(([period, medicine, time, done]) => (
              <div key={String(period)} className="text-center">
                <span
                  className={`mx-auto flex size-12 items-center justify-center rounded-full ${done ? "bg-green-50 text-green-700" : "bg-brand-soft text-brand"}`}
                >
                  {done ? <Check /> : <Clock3 />}
                </span>
                <p className="mt-2 text-sm font-bold">{period}</p>
                <p className="text-xs text-muted">{medicine}</p>
                <p className="text-xs text-muted">{time}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3">
            <p className="shrink-0 text-sm font-bold text-forest">2 of 3 taken</p>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "66%" }}
                transition={{ duration: 0.8 }}
                className="h-full bg-forest"
              />
            </div>
          </div>
        </section>

        <section className="relative mt-8 overflow-hidden rounded-2xl border border-line bg-white p-6">
          <span className="absolute inset-x-0 top-0 h-1.5 bg-[#7562a8]" />
          <h2 className="mt-1 text-xl font-bold">Voice highlights</h2>
          <p className="mt-1 text-muted">Key phrases detected today:</p>
          <div className="mt-5 flex flex-col gap-3">
            {["Maine Kamla ko miss kiya aaj…", "Rahul kab aayega?", "Bhajan sunke achha laga."].map(
              (quote) => (
                <div
                  key={quote}
                  className="flex items-center gap-3 rounded-xl bg-[#faf8ff] p-4 text-[#584680]"
                >
                  <p className="flex-1 italic">“{quote}”</p>
                  <button
                    type="button"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#7562a8] text-white"
                  >
                    <Play className="size-4 fill-current" />
                  </button>
                </div>
              ),
            )}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-[#ead19f] bg-[#fff8e8] p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="size-6 text-brand" /> SmritiVani daily summary
          </h2>
          <p className="mt-4 leading-7 text-muted">
            Maa had a generally positive day. She was most engaged during the morning reminiscence
            session about her wedding. She expressed loneliness in the evening and asked about
            Rahul’s visit. Knee pain was mentioned once—consider checking in. Bhajan therapy
            continues to show a strong positive mood impact.
          </p>
          <button type="button" className="mt-4 font-bold text-brand">
            Read full report →
          </button>
        </section>
      </main>
      <CaregiverBottomNav />
    </motion.div>
  );
}
