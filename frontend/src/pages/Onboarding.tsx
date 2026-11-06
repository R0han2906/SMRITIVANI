import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock3,
  Heart,
  Home,
  MapPin,
  Mic,
  Minus,
  Pencil,
  Phone,
  Pill,
  Plus,
  Sparkles,
  Stethoscope,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const languages = [
  "Hindi",
  "Tamil",
  "Bengali",
  "Telugu",
  "Marathi",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Punjabi",
  "Odia",
  "Assamese",
  "English",
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

const stepLabels = ["Profile", "Health", "Memory", "Done"];
const inputClass =
  "h-14 w-full rounded-xl border-2 border-line-strong bg-[#fffdf8] px-4 text-lg text-ink outline-none transition-all placeholder:text-[#7b8a85] focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand-soft";
const iconInputClass = `${inputClass} pl-12`;

type Medicine = {
  id: number;
  name: string;
  dosage: string;
  time: string;
  frequency: string;
  instructions: string;
};

type FamilyMember = {
  id: number;
  name: string;
  relationship: string;
  info: string;
  color: string;
  initials: string;
};

type Fact = { id: number; emoji: string; text: string };

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: typeof User;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-base font-bold text-ink">{label}</span>
      <span className="relative block">
        {Icon && (
          <Icon
            className="absolute top-1/2 left-4 z-10 size-5 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    </label>
  );
}

function Modal({
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
      className="fixed inset-0 z-[70] bg-[#24332f]/45 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        onMouseDown={(event) => event.stopPropagation()}
        className="fixed inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:p-8 md:top-1/2 md:bottom-auto md:left-1/2 md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl"
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-line-strong md:hidden" />
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-xl bg-cream text-muted hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const languageRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [recording, setRecording] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const [profile, setProfile] = useState({
    name: "Ramesh Prasad Sharma",
    age: 74,
    gender: "Male",
    language: "Hindi",
    city: "Lucknow",
    livesAlone: true,
    livesWith: "",
    doctorName: "Dr. Verma",
    doctorPhone: "98765 43210",
    hospital: "City Hospital, Lucknow",
  });
  const [medicines, setMedicines] = useState<Medicine[]>([
    {
      id: 1,
      name: "Amlodipine",
      dosage: "5mg",
      time: "08:00",
      frequency: "Daily",
      instructions: "After breakfast",
    },
    {
      id: 2,
      name: "Metformin",
      dosage: "500mg",
      time: "21:00",
      frequency: "Daily",
      instructions: "After dinner",
    },
  ]);
  const [medicineDraft, setMedicineDraft] = useState({
    name: "",
    dosage: "",
    time: "08:00",
    frequency: "Daily",
    instructions: "",
  });
  const [family, setFamily] = useState<FamilyMember[]>([
    {
      id: 1,
      name: "Rahul",
      relationship: "Son",
      info: "Bengaluru, Software Engineer",
      color: "#c9573b",
      initials: "R",
    },
    {
      id: 2,
      name: "Priya",
      relationship: "Daughter",
      info: "Dubai, Doctor",
      color: "#cc5e8f",
      initials: "P",
    },
    {
      id: 3,
      name: "Rohan",
      relationship: "Grandson",
      info: "8 years, Class 3",
      color: "#7562a8",
      initials: "Ro",
    },
  ]);
  const [familyDraft, setFamilyDraft] = useState({ name: "", relationship: "Son", info: "" });
  const [facts, setFacts] = useState<Fact[]>([
    { id: 1, emoji: "🎵", text: "Loves bhajans" },
    { id: 2, emoji: "🍚", text: "Favorite food: Kheer" },
    { id: 3, emoji: "📍", text: "From Varanasi" },
    { id: 4, emoji: "⚠️", text: "Allergic to penicillin" },
    { id: 5, emoji: "☕", text: "Adrak chai every morning" },
  ]);
  const [factDraft, setFactDraft] = useState("");
  const [factEmoji, setFactEmoji] = useState("💡");

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setLanguageOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const goToStep = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const saveMedicine = (event: FormEvent) => {
    event.preventDefault();
    if (!medicineDraft.name || !medicineDraft.dosage) return;
    setMedicines((current) => [...current, { id: Date.now(), ...medicineDraft }]);
    setMedicineDraft({ name: "", dosage: "", time: "08:00", frequency: "Daily", instructions: "" });
    setShowMedicineModal(false);
  };

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
      },
    ]);
    setFamilyDraft({ name: "", relationship: "Son", info: "" });
    setShowFamilyModal(false);
  };

  const addFact = () => {
    if (!factDraft.trim()) return;
    setFacts((current) => [
      ...current,
      { id: Date.now(), emoji: factEmoji, text: factDraft.trim() },
    ]);
    setFactDraft("");
  };

  const finish = () => {
    setCelebrating(true);
    window.setTimeout(() => navigate("/caregiver"), 1700);
  };

  const panelMotion = {
    initial: { opacity: 0, x: reduceMotion ? 0 : direction * 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: reduceMotion ? 0 : direction * -40 },
    transition: { duration: reduceMotion ? 0 : 0.3 },
  };

  return (
    <div className="min-h-screen bg-cream pb-16 text-ink">
      <header className="fixed inset-x-0 top-0 z-50 h-20 border-b border-line bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-4 sm:px-8">
          <button type="button" onClick={() => navigate("/")} className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-white">
              <Heart className="size-5 fill-current" />
            </span>
            <span className="text-xl font-bold">SmritiVani</span>
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-muted">Step {step} of 4</span>
            <button
              type="button"
              onClick={() => navigate("/caregiver")}
              className="hidden text-sm font-bold text-muted hover:text-brand sm:block"
            >
              Save and exit
            </button>
          </div>
        </div>
      </header>

      <div className="sticky top-20 z-40 border-b border-line bg-white px-4 py-5 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-start">
          {stepLabels.map((label, index) => {
            const number = index + 1;
            const completed = number < step;
            const active = number === step;
            return (
              <div key={label} className="contents">
                <div className="flex shrink-0 flex-col items-center gap-2">
                  <span
                    className={`flex size-11 items-center justify-center rounded-full text-base font-bold transition-all ${
                      completed
                        ? "bg-forest text-white"
                        : active
                          ? "bg-brand text-white ring-4 ring-brand-soft"
                          : "bg-cream text-muted"
                    }`}
                  >
                    {completed ? <Check className="size-5" /> : number}
                  </span>
                  <span
                    className={`hidden text-xs font-bold sm:block ${completed ? "text-forest" : active ? "text-brand" : "text-muted"}`}
                  >
                    {label}
                  </span>
                </div>
                {index < stepLabels.length - 1 && (
                  <span className="mx-2 mt-5 h-1 flex-1 overflow-hidden rounded-full bg-line sm:mx-4">
                    <motion.span
                      initial={false}
                      animate={{ width: completed ? "100%" : "0%" }}
                      transition={{ duration: reduceMotion ? 0 : 0.4 }}
                      className="block h-full rounded-full bg-forest"
                    />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.section
              key="profile"
              {...panelMotion}
              className="rounded-3xl border-2 border-line bg-white p-6 shadow-[8px_8px_0_#e6dece] sm:p-10"
            >
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
                STEP 1
              </span>
              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                Tell us about your parent
              </h1>
              <p className="mt-3 text-lg leading-7 text-muted">
                This helps SmritiVani make every conversation more personal and useful.
              </p>

              <div className="mt-9 flex flex-col gap-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label="Full name" icon={User}>
                    <input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className={iconInputClass}
                      placeholder="e.g., Ramesh Prasad Sharma"
                    />
                  </Field>
                  <div>
                    <p className="mb-2 text-base font-bold">Age</p>
                    <div className="flex h-14 items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setProfile({ ...profile, age: Math.max(50, profile.age - 1) })
                        }
                        className="flex size-14 items-center justify-center rounded-xl bg-cream text-muted"
                      >
                        <Minus />
                      </button>
                      <span className="w-20 text-center text-4xl font-bold">{profile.age}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setProfile({ ...profile, age: Math.min(110, profile.age + 1) })
                        }
                        className="flex size-14 items-center justify-center rounded-xl bg-brand-soft text-brand"
                      >
                        <Plus />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-base font-bold">Gender</p>
                    <div className="flex gap-2">
                      {["Male", "Female", "Other"].map((gender) => (
                        <button
                          key={gender}
                          type="button"
                          onClick={() => setProfile({ ...profile, gender })}
                          className={`h-14 flex-1 rounded-xl border-2 text-sm font-bold ${profile.gender === gender ? "border-brand bg-brand text-white" : "border-line-strong bg-white text-muted"}`}
                        >
                          {gender}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div ref={languageRef} className="relative">
                    <p className="mb-2 text-base font-bold">Primary language</p>
                    <button
                      type="button"
                      onClick={() => setLanguageOpen((value) => !value)}
                      className="flex h-14 w-full items-center justify-between rounded-xl border-2 border-line-strong bg-[#fffdf8] px-4 text-lg"
                    >
                      <span>{profile.language}</span>
                      <ChevronDown className="size-5 text-muted" />
                    </button>
                    <AnimatePresence>
                      {languageOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-x-0 top-full z-40 mt-2 max-h-60 overflow-y-auto rounded-xl border border-line bg-white p-2 shadow-xl"
                        >
                          {languages.map((language) => (
                            <button
                              key={language}
                              type="button"
                              onClick={() => {
                                setProfile({ ...profile, language });
                                setLanguageOpen(false);
                              }}
                              className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left hover:bg-brand-soft"
                            >
                              {language}
                              {profile.language === language && (
                                <Check className="size-4 text-brand" />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label="City or town" icon={MapPin}>
                    <input
                      value={profile.city}
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      className={iconInputClass}
                      placeholder="e.g., Lucknow"
                    />
                  </Field>
                  <div>
                    <p className="mb-2 text-base font-bold">Lives alone?</p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setProfile({ ...profile, livesAlone: true })}
                        className={`flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border-2 text-sm font-bold ${profile.livesAlone ? "border-brand bg-brand-soft text-brand" : "border-line-strong"}`}
                      >
                        <Home className="size-4" /> Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfile({ ...profile, livesAlone: false })}
                        className={`flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border-2 text-sm font-bold ${!profile.livesAlone ? "border-forest bg-sage text-forest" : "border-line-strong"}`}
                      >
                        <Users className="size-4" /> With family
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {!profile.livesAlone && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Field label="Lives with?">
                        <input
                          value={profile.livesWith}
                          onChange={(e) => setProfile({ ...profile, livesWith: e.target.value })}
                          className={inputClass}
                          placeholder="e.g., Spouse, daughter-in-law"
                        />
                      </Field>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="my-1 h-px bg-line" />
                <h2 className="text-xl font-bold">Doctor information</h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label="Doctor’s name" icon={Stethoscope}>
                    <input
                      value={profile.doctorName}
                      onChange={(e) => setProfile({ ...profile, doctorName: e.target.value })}
                      className={iconInputClass}
                      placeholder="e.g., Dr. Verma"
                    />
                  </Field>
                  <Field label="Doctor’s phone" icon={Phone}>
                    <input
                      type="tel"
                      value={profile.doctorPhone}
                      onChange={(e) => setProfile({ ...profile, doctorPhone: e.target.value })}
                      className={iconInputClass}
                      placeholder="98765 43210"
                    />
                  </Field>
                </div>
                <Field label="Hospital or clinic" icon={Building2}>
                  <input
                    value={profile.hospital}
                    onChange={(e) => setProfile({ ...profile, hospital: e.target.value })}
                    className={iconInputClass}
                    placeholder="e.g., City Hospital, Lucknow"
                  />
                </Field>
              </div>

              <div className="mt-10 flex justify-end">
                <button
                  type="button"
                  disabled={!profile.name || !profile.city || !profile.gender}
                  onClick={() => goToStep(2)}
                  className="flex h-14 items-center gap-2 rounded-xl bg-brand px-8 text-lg font-bold text-white shadow-[0_4px_0_#a9432d] disabled:opacity-45"
                >
                  Next step <ArrowRight className="size-5" />
                </button>
              </div>
            </motion.section>
          )}

          {step === 2 && (
            <motion.section
              key="health"
              {...panelMotion}
              className="rounded-3xl border-2 border-line bg-white p-6 shadow-[8px_8px_0_#e6dece] sm:p-10"
            >
              <span className="rounded-full bg-sage px-3 py-1 text-xs font-bold text-forest">
                STEP 2
              </span>
              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                Health and medicines
              </h1>
              <p className="mt-3 text-lg leading-7 text-muted">
                Add daily medicines so reminders can be calm, clear, and on time.
              </p>
              <h2 className="mt-9 text-xl font-bold">Current medicines</h2>
              <div className="mt-4 flex flex-col gap-4">
                {medicines.length === 0 && (
                  <div className="rounded-2xl border-2 border-dashed border-line-strong bg-cream p-8 text-center text-muted">
                    <Pill className="mx-auto size-12 opacity-50" />
                    <p className="mt-3 text-lg font-bold">No medicines added yet</p>
                  </div>
                )}
                {medicines.map((medicine) => (
                  <article
                    key={medicine.id}
                    className="flex flex-col gap-4 rounded-2xl border border-line bg-cream p-5 sm:flex-row sm:items-center"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sage text-forest">
                      <Pill className="size-6" />
                    </span>
                    <div className="flex-1">
                      <p className="text-lg font-bold">{medicine.name}</p>
                      <p className="text-sm text-muted">
                        {medicine.dosage} · {medicine.frequency} · {medicine.instructions}
                      </p>
                      <p className="mt-1 font-bold text-forest">{medicine.time}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex size-10 items-center justify-center rounded-lg bg-white text-muted"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setMedicines((current) =>
                            current.filter((item) => item.id !== medicine.id),
                          )
                        }
                        className="flex size-10 items-center justify-center rounded-lg bg-red-50 text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </article>
                ))}
                <button
                  type="button"
                  onClick={() => setShowMedicineModal(true)}
                  className="flex h-14 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#9fc8b5] bg-sage text-lg font-bold text-forest"
                >
                  <Plus className="size-5" /> Add medicine
                </button>
              </div>
              <div className="mt-10 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="flex h-14 items-center gap-2 rounded-xl border-2 border-line-strong px-6 font-bold text-muted"
                >
                  <ChevronLeft /> Back
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="flex h-14 items-center gap-2 rounded-xl bg-brand px-8 text-lg font-bold text-white shadow-[0_4px_0_#a9432d]"
                >
                  Next <ArrowRight className="size-5" />
                </button>
              </div>
            </motion.section>
          )}

          {step === 3 && (
            <motion.section
              key="memory"
              {...panelMotion}
              className="rounded-3xl border-2 border-line bg-white p-6 shadow-[8px_8px_0_#e6dece] sm:p-10"
            >
              <span className="rounded-full bg-[#eee9fa] px-3 py-1 text-xs font-bold text-[#665199]">
                STEP 3
              </span>
              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                Build the memory bank
              </h1>
              <p className="mt-3 text-lg leading-7 text-muted">
                Help SmritiVani know the people, routines, and details that make your parent’s life
                their own.
              </p>

              <h2 className="mt-9 text-xl font-bold">Family members</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {family.map((person) => (
                  <article
                    key={person.id}
                    className="relative rounded-2xl border-2 border-line bg-white p-5"
                  >
                    <div className="flex items-start gap-4">
                      <span
                        style={{ backgroundColor: person.color }}
                        className="flex size-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
                      >
                        {person.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="text-lg font-bold">{person.name}</p>
                        <p className="text-sm font-bold text-[#7562a8]">{person.relationship}</p>
                        <p className="mt-1 text-sm leading-5 text-muted">{person.info}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFamily((current) => current.filter((item) => item.id !== person.id))
                      }
                      className="absolute top-3 right-3 text-red-500"
                    >
                      <X className="size-4" />
                    </button>
                  </article>
                ))}
                <button
                  type="button"
                  onClick={() => setShowFamilyModal(true)}
                  className="flex min-h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#b9aad9] bg-[#faf8ff] text-[#7562a8]"
                >
                  <Plus className="size-8" />
                  <span className="mt-2 font-bold">Add family member</span>
                </button>
              </div>

              <div className="my-8 h-px bg-line" />
              <h2 className="text-xl font-bold">Important facts</h2>
              <p className="mt-1 text-base text-muted">
                Things your parent loves, needs, or should remember.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {facts.map((fact) => (
                  <span
                    key={fact.id}
                    className="flex items-center gap-2 rounded-full border border-[#ead19f] bg-[#fff8e8] px-4 py-2.5 text-sm font-bold"
                  >
                    {fact.emoji} {fact.text}
                    <button
                      type="button"
                      onClick={() =>
                        setFacts((current) => current.filter((item) => item.id !== fact.id))
                      }
                      className="text-muted hover:text-red-600"
                    >
                      <X className="size-4" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-5 flex gap-3">
                <select
                  value={factEmoji}
                  onChange={(e) => setFactEmoji(e.target.value)}
                  className="h-14 w-16 rounded-xl border-2 border-line-strong bg-cream px-2 text-xl"
                >
                  {["💡", "🎵", "🍚", "📍", "⚠️", "☕", "📖"].map((emoji) => (
                    <option key={emoji}>{emoji}</option>
                  ))}
                </select>
                <input
                  value={factDraft}
                  onChange={(e) => setFactDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addFact()}
                  className={`${inputClass} min-w-0 flex-1`}
                  placeholder="Add a fact…"
                />
                <button
                  type="button"
                  onClick={addFact}
                  className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand text-white"
                >
                  <Plus />
                </button>
              </div>

              <div className="mt-10 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="flex h-14 items-center gap-2 rounded-xl border-2 border-line-strong px-6 font-bold text-muted"
                >
                  <ChevronLeft /> Back
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(4)}
                  className="flex h-14 items-center gap-2 rounded-xl bg-brand px-8 text-lg font-bold text-white shadow-[0_4px_0_#a9432d]"
                >
                  Review <ArrowRight className="size-5" />
                </button>
              </div>
            </motion.section>
          )}

          {step === 4 && (
            <motion.section
              key="done"
              {...panelMotion}
              className="rounded-3xl border-2 border-line bg-white p-6 shadow-[8px_8px_0_#e6dece] sm:p-10"
            >
              <span className="rounded-full bg-[#edf7ef] px-3 py-1 text-xs font-bold text-forest">
                STEP 4
              </span>
              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                You’re all set! 🎉
              </h1>
              <p className="mt-3 text-lg leading-7 text-muted">
                Here is the care profile you created for {profile.name.split(" ")[0]}.
              </p>

              <div className="mt-8 flex flex-col gap-6">
                <div className="rounded-2xl border border-line bg-cream p-6">
                  <h2 className="mb-3 text-xl font-bold">Parent profile</h2>
                  {[
                    ["Name", profile.name],
                    ["Age", `${profile.age}`],
                    ["Language", profile.language],
                    ["City", profile.city],
                    [
                      "Lives",
                      profile.livesAlone ? "Alone" : `With ${profile.livesWith || "family"}`,
                    ],
                    ["Doctor", `${profile.doctorName}, ${profile.hospital}`],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex justify-between gap-6 border-b border-line py-2.5 last:border-0"
                    >
                      <span className="text-muted">{label}</span>
                      <span className="text-right font-bold">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-[#b9d5c1] bg-sage p-6">
                  <h2 className="text-xl font-bold">Medicines</h2>
                  <div className="mt-3 flex flex-col gap-2">
                    {medicines.map((medicine) => (
                      <p key={medicine.id} className="flex justify-between gap-4">
                        <span>
                          💊 {medicine.name} {medicine.dosage}
                        </span>
                        <strong>{medicine.time}</strong>
                      </p>
                    ))}
                  </div>
                  <p className="mt-3 text-sm font-bold text-forest">
                    {medicines.length} medicines added
                  </p>
                </div>

                <div className="rounded-2xl border border-[#cfc1ec] bg-[#faf8ff] p-6">
                  <h2 className="text-xl font-bold">Family members</h2>
                  <div className="mt-4 flex flex-wrap gap-4">
                    {family.map((person) => (
                      <div key={person.id} className="text-center">
                        <span
                          style={{ backgroundColor: person.color }}
                          className="mx-auto flex size-12 items-center justify-center rounded-full font-bold text-white"
                        >
                          {person.initials}
                        </span>
                        <p className="mt-1 text-sm font-bold">{person.name}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-sm font-bold text-[#665199]">
                    {family.length} family members added
                  </p>
                </div>

                <div className="rounded-2xl border border-[#ead19f] bg-[#fff8e8] p-6">
                  <h2 className="text-xl font-bold">Memory facts</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {facts.map((fact) => (
                      <span
                        key={fact.id}
                        className="rounded-full bg-white px-3 py-1.5 text-sm font-bold"
                      >
                        {fact.emoji} {fact.text}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm font-bold text-brand">{facts.length} facts saved</p>
                </div>
              </div>

              <motion.button
                type="button"
                onClick={finish}
                whileHover={reduceMotion ? undefined : { y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="mt-10 flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-brand px-5 text-xl font-bold text-white shadow-[0_5px_0_#a9432d]"
              >
                <Sparkles className="size-6" /> Start SmritiVani for {profile.name.split(" ")[0]}{" "}
                <ArrowRight className="size-6" />
              </motion.button>
              <p className="mt-5 text-center text-sm text-muted">
                You can edit every detail later in Settings.
              </p>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showMedicineModal && (
          <Modal title="Add medicine" onClose={() => setShowMedicineModal(false)}>
            <form onSubmit={saveMedicine} className="mt-6 flex flex-col gap-5">
              <Field label="Medicine name" icon={Pill}>
                <input
                  value={medicineDraft.name}
                  onChange={(e) => setMedicineDraft({ ...medicineDraft, name: e.target.value })}
                  className={iconInputClass}
                  placeholder="e.g., Amlodipine"
                />
              </Field>
              <Field label="Dosage">
                <input
                  value={medicineDraft.dosage}
                  onChange={(e) => setMedicineDraft({ ...medicineDraft, dosage: e.target.value })}
                  className={inputClass}
                  placeholder="e.g., 5mg"
                />
              </Field>
              <Field label="Time" icon={Clock3}>
                <input
                  type="time"
                  value={medicineDraft.time}
                  onChange={(e) => setMedicineDraft({ ...medicineDraft, time: e.target.value })}
                  className={iconInputClass}
                />
              </Field>
              <div>
                <p className="mb-2 font-bold">Frequency</p>
                <div className="grid grid-cols-2 gap-2">
                  {["Daily", "Twice Daily", "Weekly", "As Needed"].map((frequency) => (
                    <button
                      key={frequency}
                      type="button"
                      onClick={() => setMedicineDraft({ ...medicineDraft, frequency })}
                      className={`min-h-11 rounded-xl px-2 text-sm font-bold ${medicineDraft.frequency === frequency ? "bg-forest text-white" : "bg-cream text-muted"}`}
                    >
                      {frequency}
                    </button>
                  ))}
                </div>
              </div>
              <label>
                <span className="mb-2 block font-bold">Instructions</span>
                <textarea
                  value={medicineDraft.instructions}
                  onChange={(e) =>
                    setMedicineDraft({ ...medicineDraft, instructions: e.target.value })
                  }
                  className="h-24 w-full rounded-xl border-2 border-line-strong bg-[#fffdf8] p-4 outline-none focus:border-forest focus:ring-4 focus:ring-sage"
                  placeholder="e.g., Take after breakfast with water"
                />
              </label>
              <button
                type="submit"
                className="h-14 rounded-xl bg-forest text-lg font-bold text-white"
              >
                Save medicine
              </button>
            </form>
          </Modal>
        )}
        {showFamilyModal && (
          <Modal title="Add family member" onClose={() => setShowFamilyModal(false)}>
            <form onSubmit={saveFamily} className="mt-6 flex flex-col gap-5">
              <Field label="Name" icon={User}>
                <input
                  value={familyDraft.name}
                  onChange={(e) => setFamilyDraft({ ...familyDraft, name: e.target.value })}
                  className={iconInputClass}
                  placeholder="Full name"
                />
              </Field>
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
              <button
                type="button"
                className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-line-strong bg-cream text-muted"
              >
                <Camera className="size-8" />
                <span className="mt-2 text-sm font-bold">Tap to upload photo</span>
                <span className="text-xs">Optional</span>
              </button>
              <label>
                <span className="mb-2 block font-bold">Short info</span>
                <textarea
                  value={familyDraft.info}
                  onChange={(e) => setFamilyDraft({ ...familyDraft, info: e.target.value })}
                  className="h-24 w-full rounded-xl border-2 border-line-strong p-4 outline-none focus:border-[#7562a8]"
                  placeholder="Lives in Bengaluru, calls every evening"
                />
              </label>
              <div className="rounded-xl border border-line bg-cream p-4">
                <p className="font-bold">Record 10 seconds of your voice</p>
                <p className="mt-1 text-sm text-muted">
                  This helps your parent recognize voice messages.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <motion.button
                    type="button"
                    onClick={() => setRecording((value) => !value)}
                    animate={
                      recording
                        ? {
                            boxShadow: [
                              "0 0 0 0 rgba(220,38,38,.3)",
                              "0 0 0 12px rgba(220,38,38,0)",
                            ],
                          }
                        : undefined
                    }
                    transition={{ repeat: Infinity, duration: 1.3 }}
                    className="flex size-12 items-center justify-center rounded-full bg-red-500 text-white"
                  >
                    <Mic />
                  </motion.button>
                  {recording && <span className="font-bold text-red-600">00:05 recording</span>}
                </div>
              </div>
              <button
                type="submit"
                className="h-14 rounded-xl bg-[#7562a8] text-lg font-bold text-white"
              >
                Save family member
              </button>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {celebrating && (
          <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
            {Array.from({ length: 36 }, (_, index) => (
              <motion.span
                key={index}
                initial={{ y: -30, x: `${(index * 37) % 100}vw`, opacity: 1, rotate: 0 }}
                animate={{ y: "105vh", opacity: 0, rotate: 360 + index * 20 }}
                transition={{ duration: 1.3 + (index % 5) * 0.22, ease: "easeIn" }}
                className={`absolute top-0 size-3 rounded-full ${["bg-brand", "bg-forest", "bg-[#7562a8]", "bg-pink-500", "bg-amber-400"][index % 5]}`}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
