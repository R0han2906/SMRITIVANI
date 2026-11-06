import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Bell, Stethoscope } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Events() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const events = [
    {
      id: 1,
      time: "8:00",
      name: "Morning Medicine",
      detail: "Morning medicine",
      emoji: "💊",
      status: "done",
      color: "text-green-600",
    },
    {
      id: 2,
      time: "11:00",
      name: "Family Call",
      detail: "Rahul's call",
      emoji: "📞",
      status: "done",
      color: "text-green-600",
    },
    {
      id: 3,
      time: "16:00",
      name: "Doctor Visit",
      detail: "Dr. Sharma",
      emoji: "🏥",
      status: "upcoming",
      color: "text-purple-600",
      highlighted: true,
    },
    {
      id: 4,
      time: "19:00",
      name: "Evening Activity",
      detail: "Relaxation time",
      emoji: "🌅",
      status: "upcoming",
      color: "text-slate-400",
    },
  ];

  const glowVariants = {
    animate: {
      boxShadow: [
        "0 0 20px 0 rgba(168, 85, 247, 0.2)",
        "0 0 40px 0 rgba(168, 85, 247, 0.4)",
        "0 0 20px 0 rgba(168, 85, 247, 0.2)",
      ],
      transition: { duration: 3, repeat: Infinity, repeatType: "loop" },
    },
  };

  const countdownVariants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: { duration: 2, repeat: Infinity, repeatType: "loop" },
    },
  };

  const eventVariants = {
    hidden: { opacity: 0, x: reduceMotion ? 0 : -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: reduceMotion ? 0 : i * 0.1, duration: 0.4 },
    }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#f5f3ff] pb-20 text-ink"
    >
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-line bg-white/95 px-4 py-4 backdrop-blur-sm">
        <button
          onClick={() => navigate("/elderly")}
          className="flex size-12 items-center justify-center rounded-xl bg-cream text-muted hover:bg-slate-100"
        >
          <ArrowLeft className="size-6" />
        </button>
        <div>
          <h1 className="text-3xl font-black">Today's Schedule 📅</h1>
          <p className="mt-1 text-xl text-slate-500">June 15, Sunday</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {/* Next Event Hero Card */}
        <motion.section
          variants={glowVariants}
          animate="animate"
          className="mb-8 rounded-3xl border-l-8 border-l-purple-500 bg-purple-50 p-8"
        >
          <p className="text-lg font-bold text-purple-600">Next Event</p>

          <h2 className="mt-3 text-3xl font-black text-slate-800">Doctor's Visit</h2>

          <div className="mt-6 flex items-center gap-4">
            <Stethoscope className="h-12 w-12 text-purple-400" strokeWidth={1.5} />
            <div>
              <p className="text-2xl font-bold text-purple-600">4:00 PM</p>
              <p className="mt-1 text-xl text-slate-500">In 3 hours</p>
            </div>
          </div>

          <motion.button
            variants={countdownVariants}
            animate="animate"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-500 py-4 font-bold text-white shadow-[4px_4px_0_#e6dece] transition-all"
          >
            <Bell className="h-6 w-6" />
            <span className="text-xl">Remind Me</span>
          </motion.button>
        </motion.section>

        {/* Today's Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <h2 className="mb-6 text-2xl font-bold">Today's Activities</h2>

          <div className="flex flex-col gap-4">
            {events.map((event, i) => (
              <motion.article
                key={event.id}
                custom={i}
                variants={eventVariants}
                initial="hidden"
                animate="visible"
                className={`flex items-start gap-6 rounded-2xl bg-white p-6 shadow-[4px_4px_0_#e6dece] transition-all ${
                  event.highlighted ? "border-2 border-purple-300" : ""
                }`}
              >
                <div className="shrink-0">
                  <p className={`text-2xl font-bold ${event.color}`}>{event.time}</p>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-bold text-slate-800">{event.name}</p>
                  <p className="mt-1 text-lg text-slate-500">{event.detail}</p>
                </div>

                <span className="shrink-0 text-3xl">{event.emoji}</span>
              </motion.article>
            ))}
          </div>
        </motion.div>

        {/* Tomorrow Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-[4px_4px_0_#e6dece]"
        >
          <p className="text-xl font-bold text-slate-800">Tomorrow: Doctor's visit, Birthday celebration 🎂</p>
        </motion.div>
      </main>
    </motion.div>
  );
}
