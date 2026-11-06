import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  HeartPulse,
  Phone,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CaregiverBottomNav } from "../../components/layout/CaregiverChrome";

const alerts = [
  {
    time: "2:34 PM",
    title: "SOS keyword detected",
    detail: "Ramesh said “help” twice during conversation.",
    status: "Pending",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700",
  },
  {
    time: "12:15 PM",
    title: "Unusual silence for 4 hours",
    detail: "SmritiVani completed a successful voice check-in.",
    status: "Resolved",
    dot: "bg-amber-500",
    badge: "bg-[#edf7ef] text-forest",
  },
  {
    time: "Yesterday",
    title: "Missed evening medicine",
    detail: "Rahul called and confirmed the dose at 9:25 PM.",
    status: "Action taken",
    dot: "bg-brand",
    badge: "bg-blue-50 text-blue-700",
  },
  {
    time: "12 June",
    title: "Possible fall phrase detected",
    detail: "Ramesh confirmed he had only dropped a walking stick.",
    status: "Resolved",
    dot: "bg-red-400",
    badge: "bg-[#edf7ef] text-forest",
  },
  {
    time: "10 June",
    title: "Morning safety check complete",
    detail: "Voice, mood, and medicine routine were normal.",
    status: "Resolved",
    dot: "bg-green-500",
    badge: "bg-[#edf7ef] text-forest",
  },
];

const contacts = [
  { name: "Rahul", relation: "Son", phone: "98765 43211", initials: "R", color: "bg-brand" },
  {
    name: "Dr. Sharma",
    relation: "Doctor",
    phone: "98765 43212",
    initials: "DS",
    color: "bg-forest",
  },
  {
    name: "Shanti Auntie",
    relation: "Neighbour",
    phone: "98765 43213",
    initials: "SA",
    color: "bg-[#7562a8]",
  },
];

function Toggle({
  active,
  onChange,
  danger = false,
}: {
  active: boolean;
  onChange: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onChange}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${active ? (danger ? "bg-red-500" : "bg-brand") : "bg-line-strong"}`}
    >
      <motion.span
        animate={{ x: active ? 26 : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 left-0 size-6 rounded-full bg-white shadow-sm"
      />
    </button>
  );
}

export default function EmergencyAlert() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [activeAlert, setActiveAlert] = useState(true);
  const [settings, setSettings] = useState({ sos: true, fall: true, silence: false });

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
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Emergency alerts</h1>
            <p className="text-base text-muted">Real-time safety monitoring</p>
          </div>
          <motion.span
            animate={activeAlert ? { scale: [1, 1.35, 1], opacity: [1, 0.6, 1] } : undefined}
            transition={{ duration: 1.4, repeat: Infinity }}
            className={`size-4 rounded-full ${activeAlert ? "bg-red-500" : "bg-green-500"}`}
            aria-label={activeAlert ? "Active alert" : "No active alert"}
          />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-28 sm:px-6">
        {activeAlert && (
          <motion.section
            animate={{ borderLeftColor: ["#ef4444", "#fca5a5", "#ef4444"] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="rounded-2xl border border-red-200 border-l-4 bg-red-50 p-6 shadow-[4px_4px_0_#fee2e2]"
          >
            <div className="flex items-start gap-4">
              <span className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-white text-red-600">
                <ShieldAlert className="size-7" />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-red-700">SOS detected</h2>
                <p className="mt-2 text-lg leading-7 text-red-900">
                  Voice distress keyword “help” detected at 2:34 PM.
                </p>
                <p className="mt-1 text-sm font-bold text-red-600">12 minutes ago</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <a
                href="tel:9876543210"
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-red-500 font-bold text-white"
              >
                <Phone className="size-5" /> Call now
              </a>
              <button
                type="button"
                onClick={() => setActiveAlert(false)}
                className="h-12 rounded-xl border-2 border-red-300 bg-white font-bold text-red-700"
              >
                Dismiss
              </button>
            </div>
          </motion.section>
        )}

        <section className="mt-8 grid grid-cols-3 gap-3">
          {[
            { value: "3", label: "Today", icon: AlertTriangle, color: "text-brand bg-brand-soft" },
            { value: "12", label: "This week", icon: CalendarDays, color: "text-forest bg-sage" },
            {
              value: "98%",
              label: "Safe score",
              icon: ShieldCheck,
              color: "text-green-700 bg-green-50",
            },
          ].map(({ value, label, icon: Icon, color }) => (
            <article
              key={label}
              className="rounded-2xl border border-line bg-white p-4 text-center"
            >
              <Icon className={`mx-auto size-6 rounded-lg p-0.5 ${color}`} />
              <p className="mt-2 text-2xl font-bold">{value}</p>
              <p className="text-xs font-bold text-muted">{label}</p>
            </article>
          ))}
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold">Voice-detected keywords</h2>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {[
              ["Help", "bg-red-100 text-red-700"],
              ["Pain", "bg-orange-100 text-orange-700"],
              ["Fall", "bg-red-100 text-red-700"],
              ["Doctor", "bg-yellow-100 text-yellow-800"],
              ["Alone", "bg-purple-100 text-purple-700"],
              ["Medicine", "bg-teal-100 text-teal-700"],
            ].map(([word, color]) => (
              <span
                key={word}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${color}`}
              >
                {word}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold">Recent alerts</h2>
          <div className="mt-5 ml-4 border-l-2 border-line pl-7">
            {alerts.map((alert, index) => (
              <motion.article
                key={`${alert.time}-${alert.title}`}
                initial={{ opacity: 0, x: reduceMotion ? 0 : -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: reduceMotion ? 0 : index * 0.08 }}
                className="relative mb-6 rounded-2xl border border-line bg-white p-5 last:mb-0"
              >
                <span
                  className={`absolute top-6 -left-[2.22rem] size-4 rounded-full border-4 border-cream ${alert.dot}`}
                />
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-muted">{alert.time}</p>
                    <h3 className="mt-1 text-lg font-bold">{alert.title}</h3>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${alert.badge}`}>
                    {alert.status}
                  </span>
                </div>
                <p className="mt-2 leading-6 text-muted">{alert.detail}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold">Emergency contacts</h2>
          <div className="mt-4 flex flex-col gap-4">
            {contacts.map((contact) => (
              <article
                key={contact.name}
                className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4"
              >
                <span
                  className={`flex size-12 shrink-0 items-center justify-center rounded-full font-bold text-white ${contact.color}`}
                >
                  {contact.initials}
                </span>
                <div className="flex-1">
                  <p className="font-bold">
                    {contact.name} — {contact.relation}
                  </p>
                  <p className="text-sm text-muted">{contact.phone}</p>
                </div>
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="flex size-12 items-center justify-center rounded-xl bg-[#edf7ef] text-forest"
                >
                  <Phone className="size-5" />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold">Safety monitoring</h2>
          <div className="mt-4 rounded-2xl border border-line bg-white px-6">
            {[
              {
                key: "sos" as const,
                title: "Voice SOS detection",
                text: "Listen for urgent words such as help or pain.",
              },
              {
                key: "fall" as const,
                title: "Fall detection",
                text: "Notice speech patterns that may follow a fall.",
              },
              {
                key: "silence" as const,
                title: "Silence alert (4 hr)",
                text: "Alert family after an unusually quiet period.",
              },
            ].map((item, index) => (
              <div
                key={item.key}
                className={`flex items-center gap-4 py-5 ${index < 2 ? "border-b border-line" : ""}`}
              >
                <div className="flex-1">
                  <p className="font-bold">{item.title}</p>
                  <p className="mt-1 text-sm leading-5 text-muted">{item.text}</p>
                </div>
                <Toggle
                  active={settings[item.key]}
                  danger={item.key === "sos"}
                  onChange={() =>
                    setSettings((current) => ({ ...current, [item.key]: !current[item.key] }))
                  }
                />
              </div>
            ))}
          </div>
        </section>
      </main>
      <CaregiverBottomNav />
    </motion.div>
  );
}
