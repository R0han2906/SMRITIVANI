import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Mic,
  Pill,
  Calendar,
  Users,
  Music,
  Moon,
  AlertTriangle,
  Heart,
  Bell,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function ElderlyHome() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [greeting, setGreeting] = useState("नमस्ते माँ! 🙏");

      {useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning! 🌅");
    } else if (hour < 17) {
      setGreeting("Hello there! 👋");
    } else {
      setGreeting("Good evening! 🌆");
    }
  }, []);

  const quickActions = [
    { icon: Pill, label: "Medicine", path: "/elderly/medicine", color: "bg-brand" },
    { icon: Calendar, label: "Events", path: "/elderly/events", color: "bg-forest" },
    { icon: Users, label: "Family", path: "/elderly/family", color: "bg-[#7562a8]" },
    { icon: Music, label: "Activities", path: "/elderly/activities", color: "bg-[#cc5e8f]" },
    { icon: Moon, label: "Recap", path: "/elderly/recap", color: "bg-[#a94f79]" },
    { icon: AlertTriangle, label: "Help", path: "/elderly/emergency", color: "bg-red-600" },
  ];

  const pulseVariants = {
    animate: {
      boxShadow: [
        "0 0 0 0 rgba(201, 87, 59, 0.6)",
        "0 0 0 25px rgba(201, 87, 59, 0)",
      ],
      transition: { duration: 2, repeat: Infinity, repeatType: "loop" },
    },
  };

  const floatVariants = {
    animate: {
      y: reduceMotion ? 0 : [0, -8, 0],
      transition: { duration: 3, repeat: Infinity, repeatType: "loop", ease: "easeInOut" },
    },
  };

  const gridButtonVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 16 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: reduceMotion ? 0 : i * 0.08, duration: reduceMotion ? 0 : 0.4 },
    }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-cream pb-24 text-ink"
    >
      {/* Header */}
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
              className="relative flex size-10 items-center justify-center rounded-xl hover:bg-cream"
            >
              <Bell className="size-6 text-muted" aria-hidden="true" />
            </button>
            <span className="flex size-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
              यु
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-4 pt-20 sm:px-6">
        {/* Greeting Card */}
        <motion.section
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20, scale: reduceMotion ? 1 : 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.4 }}
          className="rounded-3xl border-2 border-line bg-white p-6 shadow-[6px_6px_0_#e6dece] sm:p-8"
        >
          <div className="text-center">
            <h1 className="text-4xl font-bold">{greeting}</h1>
            <p className="mt-3 text-lg text-muted">Wishing you a great day</p>
          </div>
        </motion.section>

        {/* Mic Button Section */}
        <motion.section className="mt-8 flex flex-col items-center">
          <motion.div variants={pulseVariants} animate="animate" className="relative">
            <motion.button
              variants={floatVariants}
              animate="animate"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/elderly/listening")}
              className="relative flex h-40 w-40 items-center justify-center rounded-full bg-brand text-white shadow-[8px_8px_0_#e6dece] transition-all"
            >
              <Mic className="h-20 w-20" strokeWidth={1.5} />
            </motion.button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-6 text-center text-xl font-bold text-brand"
          >
            Tell me, I'm listening
          </motion.p>
        </motion.section>

        {/* Quick Actions Header */}
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-12 mb-6"
        >
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <span className="text-2xl">✨</span> Quick Access
          </h2>
          <p className="mt-2 text-base text-muted">Easy access to what you need</p>
        </motion.div>

        {/* Quick Action Grid */}
        <motion.section className="grid grid-cols-3 gap-3 mb-8">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                custom={i}
                variants={gridButtonVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(action.path)}
                className={`flex flex-col items-center justify-center gap-3 rounded-2xl ${action.color} px-3 py-6 text-white shadow-[4px_4px_0_#e6dece] transition-all`}
              >
                <Icon className="h-8 w-8" strokeWidth={1.5} />
                <p className="text-center text-xs font-bold">{action.label}</p>
              </motion.button>
            );
          })}
        </motion.section>

        {/* Status Card */}
        <motion.section
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="rounded-3xl border-2 border-line bg-white p-6 shadow-[6px_6px_0_#e6dece] sm:p-8"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-wider text-muted uppercase">Your Status</p>
              <p className="mt-2 text-2xl font-bold">All Good ✓</p>
              <p className="mt-1 text-sm text-muted">You're taking your medicines on time</p>
            </div>
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#edf7ef] text-2xl">
              😊
            </span>
          </div>
        </motion.section>

        {/* Help Section */}
        <motion.section
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.4 }}
          className="mt-8 rounded-2xl border border-line-strong bg-brand-soft p-5"
        >
          <p className="text-sm leading-6 text-brand">
            <span className="font-bold">💡 Help:</span> Press "Help" if you need anything or want to talk. We're here for you.
          </p>
        </motion.section>
      </main>

      {/* Footer text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="py-6 text-center"
      >
        <p className="text-sm text-muted">SmritiVani — Your Companion</p>
      </motion.div>
    </motion.div>
  );
}



}
