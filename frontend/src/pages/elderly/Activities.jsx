import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Play, Heart, Zap } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Activities() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const activities = [
    { id: 1, name: "Reading", duration: "30 min", icon: "📖", color: "bg-amber-50" },
    { id: 2, name: "Walking", duration: "45 min", icon: "🚶", color: "bg-green-50" },
    { id: 3, name: "Meditation", duration: "20 min", icon: "🧘", color: "bg-purple-50" },
    { id: 4, name: "Gardening", duration: "1 hour", icon: "🌱", color: "bg-lime-50" },
    { id: 5, name: "Music", duration: "45 min", icon: "🎵", color: "bg-pink-50" },
    { id: 6, name: "Games", duration: "30 min", icon: "🎮", color: "bg-blue-50" },
  ];

  const activityVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: reduceMotion ? 0 : 0.3 + i * 0.1, duration: 0.4 },
    }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-amber-100 via-orange-50 to-yellow-50 pb-20 text-ink"
    >
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-amber-200 bg-white/95 px-4 py-4 backdrop-blur-sm">
        <button
          onClick={() => navigate("/elderly")}
          className="flex size-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800 hover:bg-amber-200"
        >
          <ArrowLeft className="size-6" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-amber-900">My Activities ✨</h1>
          <p className="text-sm text-amber-700">Things I enjoy</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {/* Activities Grid */}
        <motion.div className="grid grid-cols-2 gap-4">
          {activities.map((activity, i) => (
            <motion.button
              key={activity.id}
              custom={i}
              variants={activityVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center justify-center gap-3 rounded-3xl ${activity.color} p-8 shadow-[4px_4px_0_#e6dece] transition-all`}
            >
              <span className="text-5xl">{activity.icon}</span>
              <p className="text-xl font-bold text-slate-800">{activity.name}</p>
              <p className="text-sm text-slate-500">{activity.duration}</p>
            </motion.button>
          ))}
        </motion.div>

        {/* Recommendations */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="mt-8 rounded-3xl bg-white p-8 shadow-[6px_6px_0_#e6dece]"
        >
          <h2 className="mb-4 text-2xl font-bold">Recommendations</h2>
          <div className="flex flex-col gap-3">
            {[
              "Daily walks improve mobility and mood",
              "Reading keeps your mind sharp",
              "Meditation reduces stress and promotes relaxation",
            ].map((tip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.1 }}
                className="flex items-center gap-3 text-lg text-slate-700"
              >
                <Zap className="h-5 w-5 text-amber-600" />
                {tip}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Voice Command */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-lg italic text-amber-700">
            🎤 Say an activity name to start
          </p>
        </motion.div>
      </main>
    </motion.div>
  );
}
