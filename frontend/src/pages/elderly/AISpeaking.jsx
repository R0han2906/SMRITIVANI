import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, Volume2, Repeat2, Mic, Home, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AISpeaking() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [displayedText, setDisplayedText] = useState("");

  const fullText =
    "Hi there, your daughter loves you very much. She will call you tomorrow. Don't worry.";

  const sentences = [
    "Hi there, your daughter loves you very much.",
    "She will call you tomorrow.",
    "Don't worry.",
  ];

  useEffect(() => {
    let sentenceIndex = 0;
    let charIndex = 0;

    const timer = setInterval(() => {
      if (sentenceIndex < sentences.length) {
        const currentSentence = sentences[sentenceIndex];
        if (charIndex < currentSentence.length) {
          setDisplayedText(
            (prev) => prev + currentSentence.charAt(charIndex),
          );
          charIndex++;
        } else {
          charIndex = 0;
          sentenceIndex++;
          setDisplayedText((prev) => prev + " ");
        }
      }
    }, 50);

    return () => clearInterval(timer);
  }, []);

  const floatVariants = {
    animate: {
      y: reduceMotion ? 0 : [0, -12, 0],
      transition: { duration: 3, repeat: Infinity, repeatType: "loop", ease: "easeInOut" },
    },
  };

  const glowVariants = {
    animate: {
      boxShadow: [
        "0 0 20px 0 rgba(20, 184, 166, 0.3)",
        "0 0 40px 0 rgba(20, 184, 166, 0.6)",
        "0 0 20px 0 rgba(20, 184, 166, 0.3)",
      ],
      transition: { duration: 3, repeat: Infinity, repeatType: "loop" },
    },
  };

  const bubbleVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 150, damping: 15, duration: 0.5 },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: reduceMotion ? 0 : 0.6 + i * 0.1, duration: 0.4 },
    }),
  };

  const barVariants = (index) => ({
    animate: {
      height: [8, 30 + Math.random() * 20, 8],
      transition: {
        duration: 0.6 + (index % 3) * 0.2,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut",
      },
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-teal-50 via-cyan-50 to-white flex flex-col items-center justify-center px-4 py-8 text-ink"
    >
      {/* Back Button - Top Left */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => navigate("/elderly")}
          className="flex size-12 items-center justify-center rounded-xl bg-teal-500 text-white hover:scale-105 transition-transform"
        >
          <ArrowLeft className="size-6" />
        </button>
      </div>

      {/* AI Avatar Section */}
      <motion.div className="mb-8 flex flex-col items-center">
        <motion.div
          variants={glowVariants}
          animate="animate"
          className="relative"
        >
          <motion.div
            variants={floatVariants}
            animate="animate"
            className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 text-white shadow-lg"
          >
            <Sparkles className="h-14 w-14" strokeWidth={1.5} />
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-4 text-xl font-bold text-teal-600"
        >
          SmritiVani
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex items-center gap-1"
        >
          <p className="text-lg text-slate-500">Speaking</p>
          <span className="flex gap-1">
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-slate-500"
            />
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              className="h-1.5 w-1.5 rounded-full bg-slate-500"
            />
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
              className="h-1.5 w-1.5 rounded-full bg-slate-500"
            />
          </span>
        </motion.div>
      </motion.div>

      {/* Speech Bubble */}
      <motion.div
        variants={bubbleVariants}
        initial="hidden"
        animate="visible"
        className="relative mb-8 max-w-sm rounded-3xl border-2 border-line bg-white p-8 shadow-[6px_6px_0_#e6dece]"
      >
        {/* Triangle pointer */}
        <div className="absolute -top-4 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l-2 border-t-2 border-line" />

        <p className="text-2xl leading-relaxed text-slate-800">{displayedText}</p>
      </motion.div>

      {/* Audio Waveform */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="mb-8 flex w-full max-w-sm items-center gap-3 rounded-2xl bg-teal-50 px-4 py-4"
      >
        <Volume2 className="h-6 w-6 shrink-0 text-teal-600" />

        <div className="flex h-10 flex-1 items-center justify-center gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              variants={barVariants(i)}
              animate="animate"
              className="w-1.5 rounded-full bg-teal-400"
            />
          ))}
        </div>

        <p className="shrink-0 text-lg text-slate-400">0:15 / 0:32</p>
      </motion.div>

      {/* Action Buttons */}
      <motion.div className="w-full max-w-sm space-y-3">
        <motion.button
          custom={0}
          variants={buttonVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/elderly/listening")}
          className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-teal-100 font-bold text-teal-700 shadow-[4px_4px_0_#e6dece] transition-all"
        >
          <Repeat2 className="h-6 w-6" strokeWidth={2} />
          <span className="text-xl">Listen Again</span>
        </motion.button>

        <motion.button
          custom={1}
          variants={buttonVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/elderly/listening")}
          className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-brand font-bold text-white shadow-[4px_4px_0_#e6dece] transition-all"
        >
          <Mic className="h-6 w-6" strokeWidth={2} />
          <span className="text-xl">Speak Again</span>
        </motion.button>

        <motion.button
          custom={2}
          variants={buttonVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/elderly")}
          className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-300 bg-white font-bold text-slate-700 shadow-[4px_4px_0_#e6dece] transition-all"
        >
          <Home className="h-6 w-6" strokeWidth={2} />
          <span className="text-xl">Go Home</span>
        </motion.button>
      </motion.div>

      {/* Helper Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="mt-8 text-center text-lg italic text-slate-400"
      >
        Ask me anything, I'm here to help
      </motion.p>
    </motion.div>
  );
}
