import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Bhajan() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [isPlaying, setIsPlaying] = useState(true);

  const bhajans = [
    { id: 1, name: "Hanuman Chalisa", duration: "5:00", playing: true },
    { id: 2, name: "Om Jai Jagdish Hare", duration: "4:30", playing: false },
    { id: 3, name: "Gayatri Mantra", duration: "6:15", playing: false },
    { id: 4, name: "Shiv Tandav Stotram", duration: "7:00", playing: false },
    { id: 5, name: "Aarti Kunj Bihari Ki", duration: "5:45", playing: false },
  ];

  const glowVariants = {
    animate: {
      boxShadow: [
        "0 0 20px 0 rgba(217, 119, 6, 0.3)",
        "0 0 40px 0 rgba(217, 119, 6, 0.6)",
        "0 0 20px 0 rgba(217, 119, 6, 0.3)",
      ],
      transition: { duration: 3, repeat: Infinity, repeatType: "loop" },
    },
  };

  const mandalaVariants = {
    animate: {
      rotate: 360,
      transition: { duration: 60, repeat: Infinity, repeatType: "loop", ease: "linear" },
    },
  };

  const bhajanVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: reduceMotion ? 0 : 0.5 + i * 0.1, duration: 0.4 },
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
          <h1 className="text-3xl font-black text-amber-900">भजन 🙏</h1>
          <p className="text-sm text-amber-700">🕉️</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {/* Now Playing Card */}
        <motion.section
          variants={glowVariants}
          animate="animate"
          className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-200 to-orange-100 p-8 shadow-[6px_6px_0_#e6dece]"
        >
          {/* Mandala Background */}
          <motion.div
            variants={mandalaVariants}
            animate="animate"
            className="absolute inset-0 flex items-center justify-center opacity-10"
          >
            <div className="text-9xl">🪷</div>
          </motion.div>

          <div className="relative">
            <h2 className="text-3xl font-black text-amber-900">Hanuman Chalisa</h2>
            <p className="mt-1 text-xl text-amber-700">गुलशन कुमार</p>

            {/* Progress Bar */}
            <div className="mt-6 flex items-center gap-3">
              <p className="text-sm text-amber-700">2:15</p>
              <div className="flex-1 h-3 rounded-full bg-amber-300">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "45%" }}
                  className="h-full rounded-full bg-amber-700"
                />
              </div>
              <p className="text-sm text-amber-700">5:00</p>
            </div>

            {/* Controls */}
            <div className="mt-8 flex items-center justify-center gap-8">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="text-amber-600 transition-all"
              >
                <SkipBack className="h-10 w-10" strokeWidth={2} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-700 text-white shadow-lg transition-all"
              >
                {isPlaying ? (
                  <Pause className="h-12 w-12 fill-current" />
                ) : (
                  <Play className="h-12 w-12 fill-current" />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="text-amber-600 transition-all"
              >
                <SkipForward className="h-10 w-10" strokeWidth={2} />
              </motion.button>
            </div>

            {/* Volume */}
            <div className="mt-8 flex items-center gap-3">
              <Volume2 className="h-6 w-6 shrink-0 text-amber-700" />
              <div className="flex-1 h-3 rounded-full bg-amber-300">
                <motion.div className="h-full w-2/3 rounded-full bg-amber-700" />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Bhajans List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <h2 className="mb-6 text-2xl font-bold text-amber-900">और भजन</h2>

          <div className="flex flex-col gap-3">
            {bhajans.map((bhajan, i) => (
              <motion.article
                key={bhajan.id}
                custom={i}
                variants={bhajanVariants}
                initial="hidden"
                animate="visible"
                className={`flex items-center gap-5 rounded-2xl p-5 shadow-[4px_4px_0_#e6dece] transition-all ${
                  bhajan.playing ? "bg-amber-200" : "bg-white/80"
                }`}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                    bhajan.playing ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-700"
                  } text-xl font-bold`}
                >
                  {i + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-2xl font-bold ${
                      bhajan.playing ? "text-amber-900" : "text-slate-800"
                    }`}
                  >
                    {bhajan.name}
                  </p>
                  <p className="mt-1 text-lg text-slate-500">{bhajan.duration}</p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className={`h-8 w-8 ${
                    bhajan.playing ? "fill-amber-600 text-amber-600" : "text-amber-500"
                  }`} />
                </motion.button>
              </motion.article>
            ))}
          </div>
        </motion.div>

        {/* Voice Command */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-lg italic text-amber-700">
            🎤 बोलिए <span className="font-bold">'अगला भजन'</span> या <span className="font-bold">'रुक जाओ'</span>
          </p>
        </motion.div>
      </main>
    </motion.div>
  );
}
