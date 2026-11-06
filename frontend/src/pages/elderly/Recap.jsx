import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Recap() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const highlights = [
    {
      id: 1,
      emoji: "💊",
      text: "Took both medicines on time",
    },
    {
      id: 2,
      emoji: "🎵",
      text: "Listened to music",
    },
    {
      id: 3,
      emoji: "📞",
      text: "Talked to Rahul for 15 min",
    },
  ];

  const tomorrowEvents = [
    { emoji: "🏥", text: "Doctor's visit — 4 PM" },
    { emoji: "🎂", text: "Birthday celebration!" },
  ];

  const floatVariants = {
    animate: {
      y: [0, -8, 0],
      transition: { duration: 3, repeat: Infinity, repeatType: "loop", ease: "easeInOut" },
    },
  };

  const twinkleVariants = {
    animate: {
      opacity: [0.3, 1, 0.3],
      transition: { duration: 3, repeat: Infinity, repeatType: "loop" },
    },
  };

  const highlightVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: reduceMotion ? 0 : 0.6 + i * 0.1, duration: 0.4 },
    }),
  };

  const starPositions = [
    { top: "10%", left: "10%", delay: 0 },
    { top: "15%", right: "15%", delay: 0.5 },
    { top: "60%", left: "5%", delay: 1 },
    { bottom: "20%", right: "10%", delay: 0.8 },
    { bottom: "30%", left: "20%", delay: 1.2 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 pb-20 text-white overflow-hidden"
    >
      {/* Decorative Stars */}
      {starPositions.map((pos, i) => (
        <motion.div
          key={i}
          variants={twinkleVariants}
          animate="animate"
          transition={{ delay: pos.delay }}
          className="absolute text-2xl opacity-30"
          style={pos}
        >
          ✨
        </motion.div>
      ))}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center gap-3 border-b border-purple-700/50 bg-indigo-900/50 px-4 py-6 backdrop-blur-sm"
      >
        <motion.div variants={floatVariants} animate="animate" className="text-5xl">
          🌙
        </motion.div>
        <h1 className="text-3xl font-black text-center">Good night</h1>
        <p className="text-xl text-purple-200">How was your day?</p>
      </motion.div>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {/* Mood Card */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8 rounded-3xl bg-white/10 p-8 backdrop-blur-sm"
        >
          <p className="text-center text-xl text-purple-200 mb-4">Your mood today:</p>
          <div className="text-center">
            <motion.p
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-7xl mb-3"
            >
              😊
            </motion.p>
            <h2 className="text-3xl font-bold text-yellow-400">Great day!</h2>
          </div>
          <div className="mt-4 flex justify-center gap-2">
            <span className="text-2xl">✨</span>
            <span className="text-2xl">✨</span>
            <span className="text-2xl">✨</span>
          </div>
        </motion.section>

        {/* Today's Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mb-8"
        >
          <h2 className="mb-6 text-2xl font-bold text-white">Today's Highlights</h2>

          <div className="flex flex-col gap-4">
            {highlights.map((highlight, i) => (
              <motion.article
                key={highlight.id}
                custom={i}
                variants={highlightVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center gap-4 rounded-2xl bg-white/10 px-6 py-4 backdrop-blur-sm"
              >
                <span className="text-3xl">{highlight.emoji}</span>
                <p className="text-2xl text-white">{highlight.text}</p>
              </motion.article>
            ))}
          </div>
        </motion.div>

        {/* AI Goodnight Message */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="mb-8 rounded-3xl border-2 border-yellow-400/30 bg-white/10 p-8 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">✨</span>
            <p className="text-lg text-purple-200">SmritiVani</p>
          </div>

          <p className="text-2xl leading-relaxed text-white italic">
            You did great today. We'll meet again tomorrow. Sleep well and take care.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-6 flex items-center gap-2 rounded-full bg-yellow-400/20 px-4 py-3 font-bold text-yellow-300 backdrop-blur-sm transition-all"
          >
            <Play className="h-5 w-5 fill-current" />
            <span>Listen</span>
          </motion.button>
        </motion.section>

        {/* Tomorrow Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          className="mb-8"
        >
          <p className="text-xl text-purple-300 mb-4">Tomorrow's schedule:</p>
          <div className="flex flex-col gap-3">
            {tomorrowEvents.map((event, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 + i * 0.1 }}
                className="text-2xl text-white"
              >
                {event.emoji} {event.text}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Goodnight Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/elderly")}
          className="w-full rounded-2xl bg-purple-600 py-6 text-2xl font-bold text-white shadow-lg transition-all active:shadow-md"
        >
          Good night 😴
        </motion.button>
      </main>
    </motion.div>
  );
}
