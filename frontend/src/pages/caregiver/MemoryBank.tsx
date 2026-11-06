import { FormEvent, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  BookOpen,
  Brain,
  CalendarDays,
  Camera,
  Heart,
  Home,
  Lightbulb,
  MapPin,
  MessageSquare,
  Mic,
  Pencil,
  Phone,
  Play,
  Plus,
  Save,
  Sparkles,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

type Tab = "family" | "facts" | "stories";
type FamilyMember = {
  id: number;
  name: string;
  relationship: string;
  info: string;
  city: string;
  phone?: string;
  lastTalked: string;
  initials: string;
  color: string;
  birthday?: string;
};
type Fact = {
  id: number;
  emoji: string;
  category: string;
  text: string;
  source: string;
  color: string;
  important?: boolean;
};

const tabs = [
  { id: "family" as const, label: "Family", icon: Users },
  { id: "facts" as const, label: "Facts", icon: Lightbulb },
  { id: "stories" as const, label: "Stories", icon: BookOpen },
];
const relationships = [
  "Son",
  "Daughter",
  "Grandson",
  "Granddaughter",
  "Spouse",
  "Brother",
  "Sister",
  "Neighbor",
  "Other",
];
const categoryEmojis = ["🎵", "🍚", "📍", "⚠️", "☕", "📖", "💡", "❤️"];
const waveform = [
  12, 22, 30, 16, 28, 18, 10, 25, 32, 20, 14, 27, 18, 30, 12, 24, 16, 28, 20, 10, 24, 31, 18, 13,
  27, 20, 12, 24, 16, 28,
];
const inputClass =
  "h-14 w-full rounded-xl border-2 border-line-strong bg-[#fffdf8] px-4 text-lg text-ink outline-none placeholder:text-[#7b8a85] focus:border-brand focus:ring-4 focus:ring-brand-soft";

const navItems = [
  { label: "Home", icon: Home, path: "/caregiver" },
  { label: "Memory", icon: Brain, path: "/caregiver/memory" },
  { label: "Events", icon: CalendarDays, path: "/caregiver/events" },
  { label: "Notes", icon: Mic, path: "/caregiver/notes" },
  { label: "Profile", icon: User, path: "/caregiver/settings" },
];

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
      className="fixed inset-0 z-[70] bg-[#24332f]/45 backdrop-blur-sm"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        onMouseDown={(event) => event.stopPropagation()}
        className="fixed inset-x-0 bottom-0 mx-auto max-h-[90vh] max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-line-strong" />
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-xl bg-cream text-muted"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

export default function MemoryBank() {
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<Tab>("family");
  const [filter, setFilter] = useState("All");
  const [familyModal, setFamilyModal] = useState(false);
  const [factModal, setFactModal] = useState(false);
  const [familyDraft, setFamilyDraft] = useState({
    name: "",
    relationship: "Son",
    phone: "",
    city: "",
    info: "",
  });
  const [factDraft, setFactDraft] = useState({ emoji: "💡", text: "" });
  const [family, setFamily] = useState<FamilyMember[]>([
    {
      id: 1,
      name: "Rahul Sharma",
      relationship: "Son",
      info: "Lives in Bengaluru. Software Engineer. Calls every evening at 9 PM.",
      city: "Bengaluru",
      phone: "98765 43211",
      lastTalked: "Yesterday",
      initials: "R",
      color: "#c9573b",
    },
    {
      id: 2,
      name: "Priya Sharma",
      relationship: "Daughter",
      info: "Lives in Dubai. Doctor. Visits twice a year.",
      city: "Dubai",
      phone: "98765 43212",
      lastTalked: "2 days ago",
      initials: "P",
      color: "#cc5e8f",
    },
    {
      id: 3,
      name: "Rohan Sharma",
      relationship: "Grandson",
      info: "8 years old. Class 3. Loves cricket and video games.",
      city: "Bengaluru",
      lastTalked: "Sunday",
      initials: "Ro",
      color: "#7562a8",
      birthday: "20 Jan",
    },
  ]);
  const [facts, setFacts] = useState<Fact[]>([
    {
      id: 1,
      emoji: "🎵",
      category: "Music",
      text: "Loves bhajans, especially Hanuman Chalisa and Raghupati Raghav Raja Ram.",
      source: "Learned from conversation on 12 Jan",
      color: "text-[#7562a8] bg-[#eee9fa]",
    },
    {
      id: 2,
      emoji: "🍚",
      category: "Food",
      text: "Favorite food is Kheer—his late wife used to make it every Diwali. He gets emotional when talking about it.",
      source: "Learned from conversation on 14 Jan",
      color: "text-brand bg-brand-soft",
    },
    {
      id: 3,
      emoji: "📍",
      category: "Places",
      text: "Grew up in Varanasi near Dashashwamedh Ghat. Still talks about morning Ganga aarti.",
      source: "Shared during a morning conversation",
      color: "text-forest bg-sage",
    },
    {
      id: 4,
      emoji: "⚠️",
      category: "Health",
      text: "Allergic to penicillin. Must inform any new doctor.",
      source: "Added by Rahul",
      color: "text-red-700 bg-red-50",
      important: true,
    },
    {
      id: 5,
      emoji: "☕",
      category: "Habits",
      text: "Drinks adrak chai every morning at 7 AM. Likes the tea strong.",
      source: "Learned from daily routine",
      color: "text-amber-700 bg-amber-50",
    },
    {
      id: 6,
      emoji: "📖",
      category: "Life Story",
      text: "Worked as a school teacher for 35 years and taught mathematics. Students still visit him.",
      source: "Shared on 10 Jan",
      color: "text-[#a94f79] bg-pink-50",
    },
  ]);

  const saveFamily = (event: FormEvent) => {
    event.preventDefault();
    if (!familyDraft.name) return;
    setFamily((current) => [
      ...current,
      {
        id: Date.now(),
        ...familyDraft,
        initials: familyDraft.name.slice(0, 2),
        color: "#35675a",
        lastTalked: "Not yet",
      },
    ]);
    setFamilyDraft({ name: "", relationship: "Son", phone: "", city: "", info: "" });
    setFamilyModal(false);
  };

  const saveFact = (event: FormEvent) => {
    event.preventDefault();
    if (!factDraft.text.trim()) return;
    setFacts((current) => [
      ...current,
      {
        id: Date.now(),
        emoji: factDraft.emoji,
        category: "Personal",
        text: factDraft.text.trim(),
        source: "Added by family",
        color: "text-forest bg-sage",
      },
    ]);
    setFactDraft({ emoji: "💡", text: "" });
    setFactModal(false);
  };

  const visibleFacts =
    filter === "All"
      ? facts
      : facts.filter(
          (fact) =>
            fact.category === filter || (filter === "Stories" && fact.category === "Life Story"),
        );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-cream pb-28 text-ink"
    >
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-line bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-full max-w-[1100px] items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-white">
              <Heart className="size-5 fill-current" />
            </span>
            <span className="text-xl font-bold">SmritiVani</span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/caregiver/emergency")}
              className="relative flex size-10 items-center justify-center rounded-xl hover:bg-cream"
            >
              <Bell className="size-6 text-muted" />
              <span className="absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                2
              </span>
            </button>
            <span className="flex size-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
              RS
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-20 sm:px-6">
        <header className="pt-4">
          <h1 className="text-4xl font-bold tracking-tight">Memory bank</h1>
          <p className="mt-2 text-lg text-muted">
            The people, details, and stories that matter to Ramesh.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <span className="rounded-full bg-brand-soft px-3 py-1.5 text-sm font-bold text-brand">
              {family.length} family
            </span>
            <span className="rounded-full bg-sage px-3 py-1.5 text-sm font-bold text-forest">
              {facts.length} facts
            </span>
            <span className="rounded-full bg-[#eee9fa] px-3 py-1.5 text-sm font-bold text-[#665199]">
              2 stories
            </span>
          </div>
        </header>

        <div className="sticky top-16 z-40 -mx-1 mt-6 bg-cream/95 py-3 backdrop-blur-sm">
          <div className="flex gap-1 rounded-2xl border border-line bg-[#eee9df] p-1.5">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all ${activeTab === id ? "bg-white text-brand shadow-sm" : "text-muted hover:text-ink"}`}
              >
                <Icon className="size-5" /> {label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "family" && (
            <motion.section
              key="family"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4"
            >
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setFamilyModal(true)}
                  className="flex h-12 items-center gap-2 rounded-xl bg-[#7562a8] px-5 text-sm font-bold text-white shadow-[0_3px_0_#584680]"
                >
                  <Plus className="size-4" /> Add member
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {family.map((person, index) => (
                  <motion.article
                    key={person.id}
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduceMotion ? 0 : index * 0.07 }}
                    className="relative overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-[4px_4px_0_#e6dece]"
                  >
                    <span
                      style={{ backgroundColor: person.color }}
                      className="absolute inset-x-0 top-0 h-1.5"
                    />
                    {person.birthday && (
                      <span className="absolute top-4 right-3 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800">
                        Birthday: {person.birthday}
                      </span>
                    )}
                    <span
                      style={{ backgroundColor: person.color }}
                      className="mx-auto flex size-20 items-center justify-center rounded-2xl text-3xl font-bold text-white"
                    >
                      {person.initials}
                    </span>
                    <h2 className="mt-4 text-center text-xl font-bold">{person.name}</h2>
                    <p
                      style={{ color: person.color }}
                      className="mt-1 text-center text-sm font-bold"
                    >
                      {person.relationship}
                    </p>
                    <p className="mt-3 min-h-15 text-center text-sm leading-5 text-muted">
                      {person.info}
                    </p>
                    <div className="my-4 h-px bg-line" />
                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span>📍 {person.city}</span>
                      {person.phone && <span>☎ {person.phone}</span>}
                      <span>💬 {person.lastTalked}</span>
                    </div>
                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        className="flex h-10 flex-1 items-center justify-center gap-1 rounded-lg bg-sage text-xs font-bold text-forest"
                      >
                        <Phone className="size-4" /> Call
                      </button>
                      <button
                        type="button"
                        className="flex h-10 flex-1 items-center justify-center gap-1 rounded-lg bg-cream text-xs font-bold text-muted"
                      >
                        <Pencil className="size-4" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFamily((current) => current.filter((item) => item.id !== person.id))
                        }
                        className="flex size-10 items-center justify-center rounded-lg bg-red-50 text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </motion.article>
                ))}
                <button
                  type="button"
                  onClick={() => setFamilyModal(true)}
                  className="flex min-h-72 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#b9aad9] bg-[#faf8ff] text-[#7562a8]"
                >
                  <span className="flex size-16 items-center justify-center rounded-full bg-[#eee9fa]">
                    <Plus className="size-7" />
                  </span>
                  <span className="mt-3 font-bold">Add family member</span>
                  <span className="mt-1 text-xs">Help SmritiVani recognize them</span>
                </button>
              </div>
            </motion.section>
          )}

          {activeTab === "facts" && (
            <motion.section
              key="facts"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4"
            >
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setFactModal(true)}
                  className="flex h-12 items-center gap-2 rounded-xl bg-forest px-5 text-sm font-bold text-white shadow-[0_3px_0_#244d43]"
                >
                  <Plus className="size-4" /> Add fact
                </button>
              </div>
              <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
                {["All", "Music", "Food", "Places", "Health", "Habits", "Stories"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${filter === item ? "border-forest bg-forest text-white" : "border-line bg-white text-muted"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                {visibleFacts.map((fact, index) => (
                  <motion.article
                    key={fact.id}
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduceMotion ? 0 : index * 0.06 }}
                    className={`flex items-start gap-4 rounded-2xl border border-line bg-white p-5 ${fact.important ? "border-l-4 border-l-red-500" : ""}`}
                  >
                    <span
                      className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl ${fact.color}`}
                    >
                      {fact.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-bold tracking-wider uppercase ${fact.color.split(" ")[0]}`}
                      >
                        {fact.category}
                      </p>
                      <p className="mt-1 text-base leading-6">{fact.text}</p>
                      <p className="mt-3 flex items-center gap-1 text-xs text-muted">
                        <MessageSquare className="size-3" /> {fact.source}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button type="button" className="text-muted">
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFacts((current) => current.filter((item) => item.id !== fact.id))
                        }
                        className="text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.section>
          )}

          {activeTab === "stories" && (
            <motion.section
              key="stories"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-5"
            >
              <div className="mb-4 flex items-start gap-3 rounded-2xl border border-[#cfc1ec] bg-[#faf8ff] p-4">
                <Sparkles className="mt-0.5 size-5 shrink-0 text-[#7562a8]" />
                <div>
                  <p className="font-bold text-[#665199]">Saved from meaningful conversations</p>
                  <p className="mt-1 text-sm leading-5 text-muted">
                    SmritiVani preserves stories your parent chooses to share during daily
                    conversations.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-5">
                {[
                  {
                    date: "14 January, 3:30 PM",
                    mood: "🥹 Emotional",
                    title: "Childhood in Varanasi",
                    text: "Haan beta, jab hum chhote the na, maa subah 5 baje uthaati thi. Phir hum ghat pe jaate the. Ganga mein snaan karte the. Kitna achha time tha woh…",
                    duration: "2:45",
                  },
                  {
                    date: "13 January, 11:00 AM",
                    mood: "😊 Happy",
                    title: "Wedding day memories",
                    text: "Shaadi ka din yaad hai? Baraat nikli thi shaam ko… tumhari maa ne laal saree pehni thi. Sab log kitne khush the…",
                    duration: "1:30",
                  },
                ].map((story, index) => (
                  <motion.article
                    key={story.title}
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduceMotion ? 0 : index * 0.1 }}
                    className="overflow-hidden rounded-2xl border border-line bg-white shadow-[4px_4px_0_#e6dece]"
                  >
                    <div className="bg-[#faf8ff] p-5">
                      <div className="flex flex-wrap justify-between gap-2 text-sm text-muted">
                        <span>{story.date}</span>
                        <span className="font-bold text-[#665199]">{story.mood}</span>
                      </div>
                      <h2 className="mt-2 text-xl font-bold">{story.title}</h2>
                    </div>
                    <div className="p-5">
                      <p className="text-base leading-7 italic text-muted">“{story.text}”</p>
                      <button type="button" className="mt-2 text-sm font-bold text-[#7562a8]">
                        Read full story
                      </button>
                      <div className="mt-5 flex items-center gap-3">
                        <button
                          type="button"
                          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#7562a8] text-white"
                        >
                          <Play className="size-4 fill-current" />
                        </button>
                        <div className="flex h-8 flex-1 items-center gap-[2px]" aria-hidden="true">
                          {waveform.map((height, bar) => (
                            <span
                              key={bar}
                              className="w-[3px] rounded-full bg-[#9e8dc9]"
                              style={{ height: height * 0.75 }}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted">{story.duration}</span>
                      </div>
                      <p className="mt-4 flex items-center gap-1 text-xs text-muted">
                        <Save className="size-3" /> Saved automatically
                      </p>
                    </div>
                  </motion.article>
                ))}
                <div className="rounded-2xl border-2 border-dashed border-line-strong bg-cream p-8 text-center text-muted">
                  <BookOpen className="mx-auto size-12 opacity-50" />
                  <p className="mx-auto mt-3 max-w-sm text-base">
                    More stories will appear as Ramesh talks with SmritiVani.
                  </p>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {familyModal && (
          <Sheet title="Add family member" onClose={() => setFamilyModal(false)}>
            <form onSubmit={saveFamily} className="mt-6 flex flex-col gap-5">
              <label>
                <span className="mb-2 block font-bold">Full name</span>
                <div className="relative">
                  <User className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
                  <input
                    value={familyDraft.name}
                    onChange={(e) => setFamilyDraft({ ...familyDraft, name: e.target.value })}
                    className={`${inputClass} pl-12`}
                    placeholder="Full name"
                  />
                </div>
              </label>
              <div>
                <p className="mb-2 font-bold">Relationship</p>
                <div className="grid grid-cols-3 gap-2">
                  {relationships.map((relationship) => (
                    <button
                      key={relationship}
                      type="button"
                      onClick={() => setFamilyDraft({ ...familyDraft, relationship })}
                      className={`min-h-11 rounded-xl px-1 text-xs font-bold ${familyDraft.relationship === relationship ? "bg-[#7562a8] text-white" : "bg-cream text-muted"}`}
                    >
                      {relationship}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block font-bold">Phone</span>
                  <div className="relative">
                    <Phone className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
                    <input
                      type="tel"
                      value={familyDraft.phone}
                      onChange={(e) => setFamilyDraft({ ...familyDraft, phone: e.target.value })}
                      className={`${inputClass} pl-12`}
                      placeholder="98765 43210"
                    />
                  </div>
                </label>
                <label>
                  <span className="mb-2 block font-bold">City</span>
                  <div className="relative">
                    <MapPin className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
                    <input
                      value={familyDraft.city}
                      onChange={(e) => setFamilyDraft({ ...familyDraft, city: e.target.value })}
                      className={`${inputClass} pl-12`}
                      placeholder="Bengaluru"
                    />
                  </div>
                </label>
              </div>
              <button
                type="button"
                className="flex h-28 flex-col items-center justify-center rounded-xl border-2 border-dashed border-line-strong bg-cream text-muted"
              >
                <Camera className="size-7" />
                <span className="mt-2 text-sm font-bold">Tap to upload photo</span>
              </button>
              <label>
                <span className="mb-2 block font-bold">About this person</span>
                <textarea
                  value={familyDraft.info}
                  onChange={(e) => setFamilyDraft({ ...familyDraft, info: e.target.value })}
                  className="h-24 w-full rounded-xl border-2 border-line-strong p-4 outline-none focus:border-[#7562a8]"
                  placeholder="Lives in Bengaluru, calls every evening"
                />
              </label>
              <button
                type="submit"
                className="h-14 rounded-xl bg-[#7562a8] text-lg font-bold text-white"
              >
                Save member
              </button>
            </form>
          </Sheet>
        )}
        {factModal && (
          <Sheet title="Add a fact" onClose={() => setFactModal(false)}>
            <form onSubmit={saveFact} className="mt-6">
              <p className="mb-3 font-bold">Choose a category</p>
              <div className="flex flex-wrap gap-2">
                {categoryEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFactDraft({ ...factDraft, emoji })}
                    className={`flex size-12 items-center justify-center rounded-xl text-2xl ${factDraft.emoji === emoji ? "bg-forest ring-4 ring-sage" : "bg-cream"}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <label className="mt-5 block">
                <span className="mb-2 block font-bold">Fact</span>
                <textarea
                  value={factDraft.text}
                  onChange={(e) => setFactDraft({ ...factDraft, text: e.target.value })}
                  className="h-28 w-full rounded-xl border-2 border-line-strong p-4 text-lg outline-none focus:border-forest focus:ring-4 focus:ring-sage"
                  placeholder="e.g., Loves Kheer, allergic to penicillin"
                />
              </label>
              <button
                type="submit"
                className="mt-6 h-14 w-full rounded-xl bg-forest text-lg font-bold text-white"
              >
                Save fact
              </button>
            </form>
          </Sheet>
        )}
      </AnimatePresence>

      <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto h-[76px] max-w-2xl rounded-t-2xl border-x border-t border-line bg-white/95 px-2 shadow-[0_-8px_24px_rgba(64,55,40,0.08)] backdrop-blur-sm">
        <div className="flex h-full items-center justify-around">
          {navItems.map(({ label, icon: Icon, path }) => {
            const active = location.pathname === path;
            return (
              <motion.button
                key={label}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(path)}
                className={`relative flex min-w-14 flex-col items-center gap-1 px-2 py-2 ${active ? "text-brand" : "text-muted"}`}
              >
                {active && <span className="absolute -top-1 h-1 w-7 rounded-full bg-brand" />}
                <Icon className={`size-6 ${active ? "scale-110" : ""}`} />
                <span className="text-xs font-bold">{label}</span>
              </motion.button>
            );
          })}
        </div>
      </nav>
    </motion.div>
  );
}
