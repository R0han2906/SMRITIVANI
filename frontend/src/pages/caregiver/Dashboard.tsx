import { motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  Brain,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Heart,
  Home,
  Mic,
  Pill,
  Play,
  Plus,
  Quote,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const events = [
  {
    icon: CheckCircle2,
    title: "Morning medicine",
    detail: "8:00 AM · Amlodipine 5mg",
    status: "Done",
    style: "bg-[#edf7ef] text-forest",
    card: "opacity-75",
  },
  {
    icon: Clock3,
    title: "Eye checkup",
    detail: "2:00 PM · Dr. Verma, City Hospital",
    status: "Upcoming",
    style: "bg-brand-soft text-brand",
    card: "border-l-4 border-l-brand",
  },
  {
    icon: CalendarDays,
    title: "Evening walk",
    detail: "5:00 PM · 15 minute garden walk",
    status: "Pending",
    style: "bg-cream text-muted",
    card: "",
  },
];

const medicines = [
  { name: "Amlodipine 5mg", time: "8:00 AM", state: "Taken at 8:05 AM", done: true },
  { name: "Eye drops", time: "2:00 PM", state: "Due in 1 hour", done: false },
  { name: "Metformin 500mg", time: "9:00 PM", state: "Due in 4 hours", done: false },
];

const family = [
  { initials: "R", name: "Rahul", relation: "Son", color: "bg-brand" },
  { initials: "P", name: "Priya", relation: "Daughter", color: "bg-[#cc5e8f]" },
  { initials: "Ro", name: "Rohan", relation: "Grandson", color: "bg-[#7562a8]" },
];

const waveform = [
  10, 18, 28, 16, 34, 22, 12, 30, 26, 16, 36, 20, 14, 28, 38, 22, 12, 26, 32, 18, 10, 24, 35, 20,
  14, 30, 24, 12, 28, 18, 10, 22, 30, 16, 12, 26, 20, 14, 24, 10,
];

const navItems = [
  { label: "Home", icon: Home, path: "/caregiver" },
  { label: "Memory", icon: Brain, path: "/caregiver/memory" },
  { label: "Events", icon: CalendarDays, path: "/caregiver/events" },
  { label: "Notes", icon: Mic, path: "/caregiver/notes" },
  { label: "Profile", icon: User, path: "/caregiver/settings" },
];

function Section({
  children,
  index,
  className = "",
}: {
  children: React.ReactNode;
  index: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ delay: reduceMotion ? 0 : index * 0.06, duration: reduceMotion ? 0 : 0.4 }}
      className={`mt-8 ${className}`}
    >
      {children}
    </motion.section>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-cream pb-28 text-ink"
    >
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-line bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-full max-w-[1100px] items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-white">
              <Heart className="size-5 fill-current" aria-hidden="true" />
            </span>
            <span className="text-xl font-bold">SmritiVani</span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/caregiver/emergency")}
              className="relative flex size-10 items-center justify-center rounded-xl hover:bg-cream"
            >
              <Bell className="size-6 text-muted" aria-hidden="true" />
              <span className="absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                2
              </span>
            </button>
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white"
            >
              RS
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-20 sm:px-6">
        <motion.section
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20, scale: reduceMotion ? 1 : 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.4 }}
          className="rounded-3xl border-2 border-line bg-white p-5 shadow-[6px_6px_0_#e6dece] sm:p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-brand text-2xl font-bold text-white">
                RS
              </span>
              <div>
                <h1 className="text-2xl font-bold">Ramesh Sharma</h1>
                <p className="mt-1 text-base text-muted">74 years · Lucknow · Lives alone</p>
              </div>
            </div>
            <span className="flex items-center gap-2 rounded-full bg-[#edf7ef] px-3 py-1.5 text-sm font-bold text-forest">
              <span className="size-2 rounded-full bg-green-500 motion-safe:animate-pulse" />
              Active now
            </span>
          </div>

          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-line bg-cream p-4">
            <span className="text-4xl" aria-hidden="true">
              😊
            </span>
            <div>
              <p className="text-xs font-bold tracking-wider text-muted uppercase">Today’s mood</p>
              <p className="text-xl font-bold text-forest">Happy and calm</p>
            </div>
            <span className="ml-auto flex items-center gap-1 text-sm font-bold text-forest">
              <TrendingUp className="size-5" aria-hidden="true" /> 82/100
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { icon: Mic, value: "4", label: "Chats", color: "bg-sage text-forest" },
              { icon: Pill, value: "1/3", label: "Medicines", color: "bg-[#edf7ef] text-forest" },
              { icon: Bell, value: "0", label: "Alerts", color: "bg-brand-soft text-brand" },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className={`rounded-2xl p-3 text-center ${color}`}>
                <Icon className="mx-auto size-5" aria-hidden="true" />
                <p className="mt-1 text-2xl font-bold">{value}</p>
                <p className="text-xs font-bold">{label}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <Section index={1}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <CalendarDays className="size-6 text-brand" aria-hidden="true" /> Today’s events
            </h2>
            <Link to="/caregiver/events" className="text-sm font-bold text-forest hover:underline">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {events.map(({ icon: Icon, title, detail, status, style, card }, index) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, x: reduceMotion ? 0 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: reduceMotion ? 0 : index * 0.08 }}
                className={`flex items-center gap-4 rounded-2xl border border-line bg-white p-4 ${card}`}
              >
                <span
                  className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${style}`}
                >
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{title}</p>
                  <p className="mt-0.5 truncate text-sm text-muted">{detail}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${style}`}>
                  {status}
                </span>
              </motion.article>
            ))}
            <button
              type="button"
              className="flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#9fc8b5] bg-sage text-sm font-bold text-forest hover:bg-[#dbeadb]"
            >
              <Plus className="size-5" aria-hidden="true" /> Add event
            </button>
          </div>
        </Section>

        <Section index={2}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Pill className="size-6 text-forest" aria-hidden="true" /> Medicines today
            </h2>
            <div className="flex items-center gap-2 text-sm font-bold text-forest">
              1/3 taken
              <span className="h-2 w-24 overflow-hidden rounded-full bg-line">
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: "33.333%" }}
                  className="block h-full rounded-full bg-forest"
                />
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {medicines.map((medicine) => (
              <article
                key={medicine.name}
                className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4"
              >
                <span
                  className={`flex size-11 shrink-0 items-center justify-center rounded-full ${medicine.done ? "bg-[#edf7ef] text-forest" : "bg-brand-soft text-brand"}`}
                >
                  {medicine.done ? <Check className="size-5" /> : <Clock3 className="size-5" />}
                </span>
                <div className="flex-1">
                  <p className="font-bold">{medicine.name}</p>
                  <p className="text-sm text-muted">{medicine.time}</p>
                </div>
                <p
                  className={`text-right text-xs font-bold ${medicine.done ? "text-forest" : "text-brand"}`}
                >
                  {medicine.state}
                </p>
              </article>
            ))}
          </div>
        </Section>

        <Section index={3}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Brain className="size-6 text-[#7562a8]" aria-hidden="true" /> Memory bank
            </h2>
            <Link
              to="/caregiver/memory"
              className="text-sm font-bold text-[#7562a8] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="flex snap-x gap-4 overflow-x-auto pb-2">
            {family.map((person) => (
              <article
                key={person.name}
                className="w-32 shrink-0 snap-start rounded-2xl border border-line bg-white p-4 text-center"
              >
                <span
                  className={`mx-auto flex size-14 items-center justify-center rounded-full text-lg font-bold text-white ${person.color}`}
                >
                  {person.initials}
                </span>
                <p className="mt-2 font-bold">{person.name}</p>
                <p className="text-xs text-muted">{person.relation}</p>
              </article>
            ))}
            <button
              type="button"
              className="flex w-32 shrink-0 snap-start flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line-strong bg-white p-4 text-[#7562a8]"
            >
              <Plus className="size-7" />
              <span className="mt-2 text-sm font-bold">Add person</span>
            </button>
          </div>
        </Section>

        <Section index={4}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Mic className="size-6 text-brand" aria-hidden="true" /> Voice notes
            </h2>
            <span className="text-sm font-bold text-brand">View all</span>
          </div>
          <article className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center">
              <span className="flex size-9 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                R
              </span>
              <p className="ml-2 text-sm font-bold">From Rahul</p>
              <p className="ml-2 text-xs text-muted">2 hours ago</p>
              <span className="ml-auto size-2.5 rounded-full bg-blue-500" aria-label="Unheard" />
            </div>
            <div className="mt-4 flex h-10 items-center gap-[3px]" aria-hidden="true">
              {waveform.map((height, index) => (
                <span
                  key={index}
                  className={`w-[3px] rounded-full ${index < 24 ? "bg-forest" : "bg-[#b9d5c1]"}`}
                  style={{ height }}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-forest text-white"
              >
                <Play className="size-4 fill-current" aria-hidden="true" />
              </button>
              <span className="text-sm text-muted">0:15</span>
              <p className="min-w-0 flex-1 truncate text-sm italic text-muted">
                “Papa, main Sunday ko aa raha hoon…”
              </p>
            </div>
            <button
              type="button"
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-soft text-sm font-bold text-brand"
            >
              <Mic className="size-4" /> Record a voice note for Papa
            </button>
          </article>
        </Section>

        <Section index={5} className="mb-8">
          <article className="relative overflow-hidden rounded-3xl border-2 border-line bg-[#fffdf7] p-6 shadow-[6px_6px_0_#e6dece] sm:p-8">
            <Quote className="absolute top-3 right-4 size-20 text-brand-soft" aria-hidden="true" />
            <Sparkles
              className="absolute right-24 bottom-8 size-6 text-amber-300/70 motion-safe:animate-pulse"
              aria-hidden="true"
            />
            <p className="text-sm font-bold tracking-wider text-brand uppercase">
              SmritiVani daily summary
            </p>
            <p className="mt-1 text-sm text-muted">Generated at 8:00 PM</p>
            <p className="relative mt-5 text-lg leading-8 text-ink">
              Ramesh ji had a wonderful day today. He took his morning medicine on time at 8:05 AM
              and enjoyed his adrak chai. He had a 12-minute conversation with Rahul in the evening
              and was visibly happy. He listened to Hanuman Chalisa for 20 minutes. One minor
              confusion episode was detected at 4 PM when he asked “where am I?”, but he felt
              settled again within two minutes after SmritiVani reassured him. Overall mood:
              positive and calm.
            </p>
            <div className="mt-7 flex items-center">
              {[
                ["8 AM", "😊"],
                ["12 PM", "😊"],
                ["4 PM", "🥹"],
                ["8 PM", "😊"],
              ].map(([time, mood], index, items) => (
                <div key={time} className="contents">
                  <div className="text-center">
                    <span className="text-xl">{mood}</span>
                    <p className="mt-1 text-xs font-bold text-muted">{time}</p>
                  </div>
                  {index < items.length - 1 && <span className="mx-2 h-0.5 flex-1 bg-[#b9d5c1]" />}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigate("/caregiver/log")}
              className="mt-6 min-h-12 rounded-xl bg-brand-soft px-5 font-bold text-brand"
            >
              Open complete daily log
            </button>
          </article>
        </Section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto h-[76px] max-w-2xl rounded-t-2xl border-x border-t border-line bg-white/95 px-2 shadow-[0_-8px_24px_rgba(64,55,40,0.08)] backdrop-blur-sm">
        <div className="flex h-full items-center justify-around">
          {navItems.map(({ label, icon: Icon, path }) => {
            const active = label === "Home";
            return (
              <motion.button
                key={label}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(path)}
                className={`relative flex min-w-14 flex-col items-center gap-1 px-2 py-2 ${active ? "text-brand" : "text-muted"}`}
              >
                {active && <span className="absolute -top-1 h-1 w-7 rounded-full bg-brand" />}
                <Icon className={`size-6 ${active ? "scale-110" : ""}`} />
                <span className="text-xs font-bold">{label}</span>
              </motion.button>
            );
          })}
        </div>
      </nav>
    </motion.div>
  );
}
