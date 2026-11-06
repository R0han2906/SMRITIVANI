import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Phone } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Emergency() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [calling, setCalling] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const handleSOS = () => {
    setCalling(true);
    let count = 5;
    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(timer);
        setCalling(false);
      }
    }, 1000);
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.1, 1],
      transition: { duration: 0.8, repeat: Infinity, repeatType: "loop" },
    },
  };

  const ringVariants = {
    animate: {
      r: [0, 50],
      opacity: [0.8, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatType: "loop",
      },
    },
  };

  const screenPulseVariants = {
    animate: {
      backgroundColor: calling ? "#ef4444" : "#dc2626",
      transition: { duration: 2, repeat: Infinity, repeatType: "loop" },
    },
  };

  return (
    <motion.div
      variants={screenPulseVariants}
      animate={!calling ? "animate" : {}}
      className={`min-h-screen flex flex-col items-center justify-center px-4 py-8 ${
        calling ? "bg-green-600" : "bg-red-600"
      }`}
    >
      {/* Top Text */}
      {!calling ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <AlertTriangle className="h-10 w-10 text-white" strokeWidth={2} />
            <h1 className="text-4xl font-black text-white">Need Help?</h1>
          </div>
          <p className="text-2xl text-red-100">Don't worry, we're here</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-12 text-center"
        >
          <p className="text-3xl font-bold text-white mb-2">Calling...</p>
          <p className="text-xl text-green-100">Calling Rahul</p>
        </motion.div>
      )}

      {/* SOS Button or Countdown */}
      {!calling ? (
        <motion.div className="relative mb-12">
          {/* Pulsing rings */}
          <svg className="absolute inset-0 h-52 w-52" viewBox="0 0 208 208">
            <motion.circle
              cx="104"
              cy="104"
              variants={ringVariants}
              animate="animate"
              fill="none"
              stroke="white"
              strokeWidth="3"
            />
            <motion.circle
              cx="104"
              cy="104"
              variants={ringVariants}
              animate="animate"
              fill="none"
              stroke="white"
              strokeWidth="3"
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
                delay: 0.3,
              }}
            />
            <motion.circle
              cx="104"
              cy="104"
              variants={ringVariants}
              animate="animate"
              fill="none"
              stroke="white"
              strokeWidth="3"
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
                delay: 0.6,
              }}
            />
          </svg>

          {/* SOS Button */}
          <motion.button
            variants={pulseVariants}
            animate="animate"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSOS}
            className="relative flex h-52 w-52 items-center justify-center rounded-full bg-white text-6xl font-black text-red-600 shadow-2xl transition-all z-10"
          >
            SOS
          </motion.button>
        </motion.div>
      ) : (
        <motion.div className="mb-12 text-center">
          <motion.p
            key={countdown}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="text-7xl font-black text-white"
          >
            {countdown}
          </motion.p>
        </motion.div>
      )}

      {/* Countdown or Contacts */}
      {calling ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCalling(false)}
          className="mb-12 rounded-2xl border-4 border-white bg-transparent px-8 py-5 text-2xl font-bold text-white transition-all h-16"
        >
          Cancel
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mb-12 text-center"
        >
          <p className="text-xl text-red-100 mb-6">Or call these:</p>
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-2xl bg-white/20 px-6 py-4 font-bold text-white backdrop-blur-sm transition-all"
            >
              <Phone className="h-6 w-6" />
              <span className="text-lg">Rahul</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-2xl bg-white/20 px-6 py-4 font-bold text-white backdrop-blur-sm transition-all"
            >
              <Phone className="h-6 w-6" />
              <span className="text-lg">Emergency 108</span>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Voice SOS */}
      {!calling && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="text-center"
        >
          <p className="text-2xl font-bold text-white mb-3">
            Or shout <span className="text-3xl">'HELP!'</span>
          </p>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <p className="text-3xl">🎤</p>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
