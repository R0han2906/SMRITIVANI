import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Pill, Check, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Medicine() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [medicines, setMedicines] = useState([
    { id: 1, name: "Metformin 500mg", time: "8:30 AM", dosage: "1 tablet, after meals", status: "pending", color: "bg-orange-50" },
    { id: 2, name: "Amlodipine 5mg", time: "8:30 AM", dosage: "1 tablet", status: "taken", color: "bg-green-50" },
    { id: 3, name: "Vitamin D", time: "1:00 PM", dosage: "1 tablet", status: "later", color: "bg-slate-50" },
  ]);

  const handleTaken = () => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === 1 ? { ...m, status: "taken" } : m))
    );
  };

  const handleLater = () => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === 1 ? { ...m, status: "later" } : m))
    );
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.02, 1],
      transition: { duration: 2, repeat: Infinity, repeatType: "loop" },
    },
  };

  const bellRingVariants = {
    animate: {
      rotate: [0, -15, 15, -15, 15, 0],
      transition: { duration: 0.6, repeat: Infinity, repeatDelay: 2 },
    },
  };

  const medicineItemVariants = {
    hidden: { opacity: 0, x: reduceMotion ? 0 : 20 },
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
      className="min-h-screen bg-[#f0fdf4] pb-20 text-ink"
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
          <h1 className="text-3xl font-black">My Medicines 💊</h1>
          <p className="mt-1 text-xl text-slate-500">Morning 8:30</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {/* Current Medicine Alert */}
        <motion.section
          variants={pulseVariants}
          animate="animate"
          className="mb-8 rounded-3xl border-2 border-green-500 bg-green-50 p-8"
        >
          <div className="text-center">
            <motion.div
              variants={bellRingVariants}
              animate="animate"
              className="mb-4 flex justify-center"
            >
              <Pill className="h-16 w-16 text-green-600" strokeWidth={1.5} />
            </motion.div>

            <p className="text-2xl font-bold text-green-700">Take this medicine now!</p>

            <h2 className="mt-4 text-4xl font-black text-slate-800">Metformin 500mg</h2>

            <p className="mt-3 text-xl text-slate-600">1 tablet, after meals</p>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleTaken}
              className="flex-1 rounded-2xl bg-green-500 py-5 text-2xl font-black text-white shadow-[4px_4px_0_#e6dece] transition-all active:shadow-md"
            >
              Taken ✅
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLater}
              className="flex-1 rounded-2xl bg-yellow-100 py-5 text-2xl font-black text-yellow-700 shadow-[4px_4px_0_#e6dece] transition-all active:shadow-md"
            >
              Later ⏰
            </motion.button>
          </div>
        </motion.section>

        {/* Today's Medicines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <h2 className="mb-6 text-2xl font-bold">All Medicines Today</h2>

          <div className="flex flex-col gap-4">
            {medicines.map((med, i) => {
              const statusColor = {
                taken: "border-l-4 border-l-green-500 opacity-60",
                pending: "border-l-4 border-l-orange-500",
                later: "opacity-50",
              }[med.status];

              const statusIcon = {
                taken: <Check className="h-8 w-8 text-green-600" />,
                pending: <Clock className="h-8 w-8 text-orange-600" />,
                later: <Clock className="h-8 w-8 text-slate-400" />,
              }[med.status];

              const statusEmoji = {
                taken: "✅",
                pending: "⏳",
                later: "🕐",
              }[med.status];

              return (
                <motion.article
                  key={med.id}
                  custom={i}
                  variants={medicineItemVariants}
                  initial="hidden"
                  animate="visible"
                  className={`flex items-center gap-6 rounded-2xl bg-white p-6 shadow-[4px_4px_0_#e6dece] transition-all ${statusColor}`}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                      med.status === "taken"
                        ? "bg-green-100"
                        : med.status === "pending"
                          ? "bg-orange-100"
                          : "bg-slate-100"
                    }`}
                  >
                    {statusIcon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-2xl font-bold text-slate-800">{med.name}</p>
                    <p className="mt-1 text-xl text-slate-500">{med.time}</p>
                  </div>

                  <span className="text-2xl">{statusEmoji}</span>
                </motion.article>
              );
            })}
          </div>
        </motion.div>

        {/* Voice Reminder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-8 rounded-2xl bg-slate-100 px-6 py-4"
        >
          <p className="text-center text-lg text-slate-600">
            👂 Say <span className="font-bold">"medicine"</span> to set a reminder
          </p>
        </motion.div>
      </main>
    </motion.div>
  );
}
