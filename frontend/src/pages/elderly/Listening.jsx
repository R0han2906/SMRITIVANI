import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Mic, StopCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Listening() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [timer, setTimer] = useState(0);
  const [displayedWords, setDisplayedWords] = useState([]);

  const sampleTranscript = [
    "मुझे",
    "आज",
    "अपनी",
    "बेटी",
    "की",
    "याद",
    "आ",
    "रही",
    "है...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (displayedWords.length < sampleTranscript.length) {
      const timeout = setTimeout(() => {
        setDisplayedWords((prev) => [...prev, sampleTranscript[prev.length]]);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [displayedWords]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: reduceMotion ? 0 : 0.5 },
    },
  };

  const pulseDotVariants = {
    animate: {
      opacity: [1, 0.3, 1],
      transition: { duration: 1.5, repeat: Infinity, repeatType: "loop" },
    },
  };

  const ringVariants = (delay) => ({
    animate: {
      r: [20, 50],
      opacity: [0.8, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatType: "loop",
        delay,
      },
    },
  });

  const micPulseVariants = {
    animate: {
      scale: [1, 1.08, 1],
      transition: { duration: 1, repeat: Infinity, repeatType: "loop" },
    },
  };

  const getBarHeight = (index) => {
    const heights = [12, 35, 50, 42, 28, 45, 38, 22, 48, 32, 40, 36, 20, 44, 25];
    return heights[index % heights.length];
  };

  const barVariants = (index) => ({
    animate: {
      height: [
        getBarHeight(index),
        20 + Math.random() * 40,
        getBarHeight(index),
      ],
      transition: {
        duration: 0.7 + (index % 3) * 0.3,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut",
      },
    },
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-8 text-ink"
    >
      {/* Back Button - Top Left */}
      <div className="absolute top-6 left-6">
        <button
          onClick={() => navigate("/elderly")}
          className="flex size-12 items-center justify-center rounded-xl bg-brand text-white hover:scale-105 transition-transform"
        >
          <ArrowLeft className="size-6" />
        </button>
      </div>

      {/* Timer - Top Right */}
      <div className="absolute top-8 right-6">
        <p className="font-mono text-2xl font-bold text-muted">{formatTime(timer)}</p>
      </div>

      {/* Status Text */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold mb-1">
          I'm listening
          <motion.span variants={pulseDotVariants} animate="animate">
            .
          </motion.span>
          <motion.span
            variants={pulseDotVariants}
            animate="animate"
            transition={{ delay: 0.3 }}
          >
            .
          </motion.span>
          <motion.span
            variants={pulseDotVariants}
            animate="animate"
            transition={{ delay: 0.6 }}
          >
            .
          </motion.span>
        </h1>
        <p className="text-lg text-muted">Take your time, speak comfortably</p>
      </div>

      {/* Giant Pulsing Mic */}
      <div className="relative mb-12">
        {/* Pulsing rings background */}
        <svg
          className="absolute inset-0 h-44 w-44"
          viewBox="0 0 176 176"
          preserveAspectRatio="xMidYMid meet"
        >
          <motion.circle
            cx="88"
            cy="88"
            variants={ringVariants(0)}
            animate="animate"
            fill="none"
            stroke="#c9573b"
            strokeWidth="2"
          />
          <motion.circle
            cx="88"
            cy="88"
            variants={ringVariants(0.3)}
            animate="animate"
            fill="none"
            stroke="#c9573b"
            strokeWidth="2"
          />
          <motion.circle
            cx="88"
            cy="88"
            variants={ringVariants(0.6)}
            animate="animate"
            fill="none"
            stroke="#c9573b"
            strokeWidth="2"
          />
        </svg>

        {/* Mic Button */}
        <motion.button
          variants={micPulseVariants}
          animate="animate"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/elderly")}
          className="relative flex h-44 w-44 items-center justify-center rounded-full bg-brand text-white shadow-[8px_8px_0_#e6dece] transition-all z-10"
        >
          <Mic className="h-20 w-20" strokeWidth={1.5} />
        </motion.button>
      </div>

      {/* Waveform */}
      <div className="flex items-end justify-center gap-1 mb-12 h-20">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            variants={barVariants(i)}
            animate="animate"
            className="w-1.5 rounded-full bg-brand"
            style={{ height: `${getBarHeight(i)}px` }}
          />
        ))}
      </div>

      {/* Transcript */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="max-w-sm rounded-2xl border border-line bg-white p-6 mb-12 text-center shadow-[4px_4px_0_#e6dece]"
      >
        <p className="text-lg italic text-muted">
          {displayedWords.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduceMotion ? 0 : 0.2,
                delay: reduceMotion ? 0 : i * 0.15,
              }}
              className="inline-block mr-2"
            >
              {word}
            </motion.span>
          ))}
        </p>
      </motion.div>

      {/* Stop Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/elderly")}
        className="w-full max-w-xs rounded-2xl bg-red-600 py-5 shadow-[4px_4px_0_#991b1b] transition-all flex items-center justify-center gap-3"
      >
        <StopCircle className="h-6 w-6 text-white" strokeWidth={1.5} />
        <span className="text-lg font-bold text-white">Stop</span>
      </motion.button>
    </motion.div>
  );
}
