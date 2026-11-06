import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Phone, Play, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Family() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const familyMembers = [
    {
      id: 1,
      name: "Rahul",
      relation: "Son",
      initials: "R",
      color: "bg-blue-200",
      textColor: "text-blue-700",
      newMessages: 2,
    },
    {
      id: 2,
      name: "Priya",
      relation: "Daughter",
      initials: "P",
      color: "bg-pink-200",
      textColor: "text-pink-700",
      newMessages: 1,
    },
    {
      id: 3,
      name: "Chotu",
      relation: "Grandson",
      initials: "C",
      color: "bg-yellow-200",
      textColor: "text-yellow-700",
      newMessages: 0,
      lastCall: "Yesterday",
    },
  ];

  const voiceMessages = [
    {
      id: 1,
      from: "Rahul",
      message:
        "Mom, I'm coming tomorrow evening. I'll bring sweets for you!",
      duration: "0:18",
      time: "9:30 AM",
    },
    {
      id: 2,
      from: "Priya",
      message: "Mom, take your medicine on time!",
      duration: "0:08",
      time: "2:00 PM",
    },
  ];

  const memberVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: reduceMotion ? 0 : i * 0.1, duration: 0.4 },
    }),
  };

  const messageVariants = {
    hidden: { opacity: 0, x: reduceMotion ? 0 : -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: reduceMotion ? 0 : 0.5 + i * 0.1, duration: 0.4 },
    }),
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.1, 1],
      transition: { duration: 2, repeat: Infinity, repeatType: "loop" },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#fff7ed] pb-20 text-ink"
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
          <h1 className="text-3xl font-black">My Family 👨‍👩‍👧</h1>
          <p className="mt-1 text-xl text-slate-500">Messages from loved ones</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {/* Family Members */}
        <motion.div className="mb-8">
          <div className="flex flex-col gap-6">
            {familyMembers.map((member, i) => (
              <motion.article
                key={member.id}
                custom={i}
                variants={memberVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col items-center gap-4 rounded-3xl bg-white p-8 shadow-[6px_6px_0_#e6dece]"
              >
                <div className="relative">
                  <div
                    className={`flex h-24 w-24 items-center justify-center rounded-full text-4xl font-black ${member.color} ${member.textColor}`}
                  >
                    {member.initials}
                  </div>
                  {member.newMessages > 0 && (
                    <motion.span
                      variants={pulseVariants}
                      animate="animate"
                      className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
                    >
                      {member.newMessages}
                    </motion.span>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold">{member.name}</p>
                  <p className="text-lg text-slate-500">{member.relation}</p>
                  {member.newMessages > 0 && (
                    <p className="mt-1 text-lg font-bold text-orange-600">
                      {member.newMessages} new messages
                    </p>
                  )}
                  {member.lastCall && (
                    <p className="mt-1 text-lg text-slate-400">Called {member.lastCall}</p>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all"
                >
                  <Phone className="h-8 w-8" strokeWidth={2} />
                </motion.button>
              </motion.article>
            ))}
          </div>
        </motion.div>

        {/* Voice Messages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <h2 className="mb-6 text-2xl font-bold">Today's Messages 🎤</h2>

          <div className="flex flex-col gap-6">
            {voiceMessages.map((msg, i) => (
              <motion.article
                key={msg.id}
                custom={i}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                className="rounded-2xl bg-white p-6 shadow-[4px_4px_0_#e6dece]"
              >
                <p className="text-lg text-slate-500">{msg.from} said:</p>
                <p className="mt-3 text-2xl italic text-slate-800">"{msg.message}"</p>

                <div className="mt-6 flex items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition-all"
                  >
                    <Play className="h-8 w-8 fill-current" />
                  </motion.button>

                  <div className="flex-1">
                    <p className="text-xl font-bold text-slate-800">{msg.duration}</p>
                    <p className="text-lg text-slate-400">{msg.time}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.div>

        {/* Reply Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="mt-8 flex flex-col items-center rounded-3xl bg-white p-8 shadow-[6px_6px_0_#e6dece]"
        >
          <h2 className="text-2xl font-bold">Reply</h2>
          <p className="mt-2 text-xl text-slate-500">Press button below and speak</p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-500 text-white shadow-[8px_8px_0_#e6dece] transition-all"
          >
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(249, 115, 22, 0.6)",
                  "0 0 0 20px rgba(249, 115, 22, 0)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
            >
              <Mic className="h-10 w-10" strokeWidth={2} />
            </motion.div>
          </motion.button>
        </motion.div>
      </main>
    </motion.div>
  );
}
