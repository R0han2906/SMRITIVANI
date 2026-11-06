import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Database,
  Download,
  Heart,
  LogOut,
  Settings as SettingsIcon,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CaregiverBottomNav } from "../../components/layout/CaregiverChrome";

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
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
        active ? (danger ? "bg-red-500" : "bg-brand") : "bg-line-strong"
      }`}
    >
      <motion.span
        animate={{ x: active ? 26 : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 left-0 size-6 rounded-full bg-white shadow-sm"
      />
    </button>
  );
}

const plans = [
  {
    name: "Prem (Love)",
    price: "₹199",
    badge: "Most popular",
    color: "#7562a8",
    tint: "bg-[#faf8ff]",
    border: "border-[#cfc1ec]",
    button: "bg-[#7562a8]",
    features: [
      "20 conversations per day",
      "Medicine and event reminders",
      "Voice biometrics",
      "Weekly health report",
      "Emergency keyword detection",
    ],
  },
  {
    name: "Seva (Care)",
    price: "₹499",
    badge: "Best value",
    color: "#35675a",
    tint: "bg-sage",
    border: "border-[#b9d5c1]",
    button: "bg-forest",
    features: [
      "Unlimited conversations",
      "Everything in Prem",
      "24/7 emergency monitoring",
      "Family voice messages",
      "Doctor report export",
      "Priority voice processing",
    ],
  },
];

export default function Settings() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [appSettings, setAppSettings] = useState({ dark: false, bhajans: true });
  const [notifications, setNotifications] = useState({
    medicines: true,
    emergency: true,
    daily: true,
    mood: false,
    weekly: true,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.45 }}
      className="min-h-screen bg-cream pb-28 text-ink"
    >
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-2xl items-center gap-4 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex size-12 items-center justify-center rounded-xl bg-cream text-muted"
          >
            <ArrowLeft className="size-6" />
          </button>
          <h1 className="flex-1 text-2xl font-bold">Settings</h1>
          <SettingsIcon className="size-6 text-muted" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-28 sm:px-6">
        <section className="rounded-2xl border border-line bg-white p-6 text-center shadow-[4px_4px_0_#e6dece]">
          <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-brand-soft text-2xl font-bold text-brand">
            RS
          </span>
          <h2 className="mt-4 text-2xl font-bold">Rahul Sharma</h2>
          <p className="mt-1 text-muted">rahul.sharma@email.com</p>
          <button type="button" className="mt-3 font-bold text-brand underline underline-offset-4">
            Edit profile
          </button>
          <p className="mt-3 text-sm text-muted">Member since June 2025</p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold">Your plan</h2>
          <motion.article
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative mt-4 overflow-hidden rounded-2xl border-2 border-brand bg-white p-6 shadow-[5px_5px_0_#f9e4da]"
          >
            <span className="absolute top-0 right-0 rounded-bl-2xl bg-brand-soft px-4 py-2 text-xs font-bold text-brand">
              CURRENT
            </span>
            <h3 className="text-2xl font-bold">Sneha (Free)</h3>
            <p className="mt-1 text-xl text-muted">₹0 / month</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-3">
                {[
                  "5 voice conversations per day",
                  "Basic medicine reminders",
                  "Daily mood summary",
                ].map((feature) => (
                  <p key={feature} className="flex items-center gap-2 text-base">
                    <Check className="size-5 shrink-0 text-forest" /> {feature}
                  </p>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                {[
                  "No voice biometrics",
                  "No emergency detection",
                  "No unlimited conversations",
                ].map((feature) => (
                  <p key={feature} className="flex items-center gap-2 text-base text-muted">
                    <X className="size-5 shrink-0 text-red-400" /> {feature}
                  </p>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <div className="mb-2 flex justify-between gap-4 text-sm font-bold">
                <span>3 of 5 conversations used today</span>
                <span className="text-brand">60%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-line">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "60%" }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full bg-brand"
                />
              </div>
            </div>
          </motion.article>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {plans.map((plan, index) => (
              <motion.article
                key={plan.name}
                initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: reduceMotion ? 0 : index * 0.12 }}
                className={`relative overflow-hidden rounded-2xl border bg-white p-6 ${plan.border}`}
              >
                <span
                  className="absolute inset-x-0 top-0 h-1.5"
                  style={{ backgroundColor: plan.color }}
                />
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${plan.tint}`}
                  style={{ color: plan.color }}
                >
                  {plan.badge}
                </span>
                <h3 className="mt-4 text-2xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-3xl font-bold" style={{ color: plan.color }}>
                  {plan.price}
                  <span className="text-base font-normal text-muted"> / month</span>
                </p>
                <div className="mt-6 flex min-h-48 flex-col gap-3">
                  {plan.features.map((feature) => (
                    <p key={feature} className="flex items-start gap-2 text-sm leading-5">
                      <Check className="mt-0.5 size-4 shrink-0" style={{ color: plan.color }} />
                      {feature}
                    </p>
                  ))}
                </div>
                <button
                  type="button"
                  className={`mt-5 h-12 w-full rounded-xl font-bold text-white ${plan.button}`}
                >
                  Upgrade
                </button>
              </motion.article>
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-muted">
            All plans include Gnani.ai voice technology. Cancel anytime.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold">App settings</h2>
          <div className="mt-4 rounded-2xl border border-line bg-white px-6">
            {[
              { title: "Language", value: "English / हिंदी" },
              { title: "Voice speed", value: "Normal" },
              { title: "Notification time", value: "8 AM, 8 PM" },
            ].map((item, index) => (
              <motion.button
                key={item.title}
                type="button"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: reduceMotion ? 0 : index * 0.05 }}
                className="flex min-h-16 w-full items-center gap-4 border-b border-line py-4 text-left"
              >
                <span className="flex-1 font-bold">{item.title}</span>
                <span className="text-muted">{item.value}</span>
                <ChevronRight className="size-5 text-muted" />
              </motion.button>
            ))}
            <div className="flex min-h-16 items-center gap-4 border-b border-line py-4">
              <span className="flex-1 font-bold">Dark mode</span>
              <Toggle
                active={appSettings.dark}
                onChange={() => setAppSettings((current) => ({ ...current, dark: !current.dark }))}
              />
            </div>
            <div className="flex min-h-16 items-center gap-4 py-4">
              <span className="flex-1 font-bold">Auto-play bhajans</span>
              <Toggle
                active={appSettings.bhajans}
                onChange={() =>
                  setAppSettings((current) => ({ ...current, bhajans: !current.bhajans }))
                }
              />
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold">Notifications</h2>
          <div className="mt-4 rounded-2xl border border-line bg-white px-6">
            {[
              { key: "medicines" as const, title: "Medicine reminders" },
              { key: "emergency" as const, title: "Emergency alerts", danger: true },
              { key: "daily" as const, title: "Daily summary" },
              { key: "mood" as const, title: "Mood changes" },
              { key: "weekly" as const, title: "Weekly report" },
            ].map((item, index) => (
              <div
                key={item.key}
                className={`flex min-h-16 items-center gap-4 py-4 ${
                  index < 4 ? "border-b border-line" : ""
                }`}
              >
                <span className="flex-1 font-bold">{item.title}</span>
                <Toggle
                  active={notifications[item.key]}
                  danger={item.danger}
                  onChange={() =>
                    setNotifications((current) => ({
                      ...current,
                      [item.key]: !current[item.key],
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold">Data and privacy</h2>
          <div className="mt-4 rounded-2xl border border-line bg-white px-6">
            {[
              { title: "Download voice data", icon: Download, color: "text-forest" },
              { title: "Delete all recordings", icon: Trash2, color: "text-red-600" },
              { title: "Privacy policy", icon: Shield, color: "text-muted" },
              { title: "Gnani API data usage", icon: Database, color: "text-muted" },
            ].map(({ title, icon: Icon, color }, index) => (
              <button
                key={title}
                type="button"
                className={`flex min-h-16 w-full items-center gap-4 py-4 text-left ${
                  index < 3 ? "border-b border-line" : ""
                } ${color}`}
              >
                <Icon className="size-5" />
                <span className="flex-1 font-bold">{title}</span>
                <ChevronRight className="size-5 text-muted" />
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-line bg-white p-6 text-center">
          <Heart className="mx-auto size-7 fill-brand text-brand" />
          <p className="mt-3 text-lg font-bold">SmritiVani v1.0</p>
          <p className="mt-1 text-muted">Built with care for India’s elderly</p>
          <p className="mt-3 text-sm text-muted">Powered by Gnani.ai Voice Technology</p>
          <p className="mt-1 text-xs text-muted">Made for Gnani AI Instagram Challenge 2025</p>
        </section>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-lg font-bold text-red-600"
        >
          <LogOut className="size-5" /> Log out
        </button>
      </main>
      <CaregiverBottomNav activeOverride="Profile" />
    </motion.div>
  );
}
