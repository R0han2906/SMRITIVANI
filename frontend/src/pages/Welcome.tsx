import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Heart,
  Languages,
  Mic,
  PhoneCall,
  Pill,
  ShieldCheck,
  UserPlus,
  Users,
  Volume2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const steps = [
  {
    number: "1",
    icon: UserPlus,
    title: "Add your loved one",
    description: "Tell us their preferred name, language, medicines, and important family details.",
  },
  {
    number: "2",
    icon: Mic,
    title: "They simply speak",
    description:
      "No typing or complicated menus. SmritiVani listens and responds in their language.",
  },
  {
    number: "3",
    icon: ShieldCheck,
    title: "You stay informed",
    description:
      "Receive clear medicine updates, wellbeing summaries, and urgent alerts when needed.",
  },
];

const entrance = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export default function Welcome() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const reduceMotion = useReducedMotion();
  const goToCaregiver = () => navigate(isAuthenticated ? "/caregiver" : "/signup");

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.45, ease: "easeOut" as const };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.35 }}
      className="min-h-screen overflow-x-hidden bg-cream text-ink"
    >
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-cream/95 backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-4 sm:px-8 lg:px-12">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-brand"
            aria-label="Go to SmritiVani home"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-white">
              <Heart className="size-6 fill-current" aria-hidden="true" />
            </span>
            <span className="text-left">
              <span className="block text-[1.35rem] leading-none font-bold tracking-tight sm:text-2xl">
                SmritiVani
              </span>
              <span className="mt-1 hidden text-sm font-medium text-muted sm:block">
                A familiar voice, always nearby
              </span>
            </span>
          </button>

          <div className="ml-4 flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="min-h-12 rounded-xl px-3 text-base font-bold text-ink transition-colors hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-5"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="min-h-12 rounded-xl bg-brand px-4 text-base font-bold text-white shadow-[0_4px_0_#a9432d] transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-0 active:shadow-none sm:px-6"
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-line bg-cream px-4 pt-32 pb-16 sm:px-8 sm:pt-36 sm:pb-20 lg:px-12 lg:pt-40 lg:pb-24">
          <div className="mx-auto grid max-w-[1240px] items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <div>
              <motion.div
                variants={entrance}
                initial="hidden"
                animate="visible"
                transition={transition}
                className="mb-7 inline-flex items-center gap-3 rounded-full border border-line bg-white px-4 py-2 text-base font-bold text-forest"
              >
                <Volume2 className="size-5 text-brand" aria-hidden="true" />
                Made for elders, not for screens
              </motion.div>

              <motion.h1
                variants={entrance}
                initial="hidden"
                animate="visible"
                transition={{ ...transition, delay: reduceMotion ? 0 : 0.08 }}
                className="max-w-3xl text-[2.8rem] leading-[1.08] font-bold tracking-[-0.035em] text-ink sm:text-6xl lg:text-[4.4rem]"
              >
                Everyday care, in a voice that feels <span className="text-brand">familiar.</span>
              </motion.h1>

              <motion.p
                variants={entrance}
                initial="hidden"
                animate="visible"
                transition={{ ...transition, delay: reduceMotion ? 0 : 0.16 }}
                className="mt-7 max-w-2xl text-xl leading-8 text-muted sm:text-[1.35rem] sm:leading-9"
              >
                SmritiVani speaks with your parents in their own language, reminds them about
                medicines, checks in gently, and keeps the family connected.
              </motion.p>

              <motion.div
                variants={entrance}
                initial="hidden"
                animate="visible"
                transition={{ ...transition, delay: reduceMotion ? 0 : 0.24 }}
                className="mt-9 flex flex-col gap-4 sm:flex-row"
              >
                <button
                  type="button"
                  onClick={goToCaregiver}
                  className="inline-flex min-h-15 items-center justify-center gap-3 rounded-2xl bg-brand px-7 text-lg font-bold text-white shadow-[0_5px_0_#a9432d] transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-brand active:translate-y-0 active:shadow-none"
                >
                  Set up for my parent
                  <ArrowRight className="size-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="inline-flex min-h-15 items-center justify-center gap-3 rounded-2xl border-2 border-line-strong bg-white px-7 text-lg font-bold text-ink transition-colors hover:border-brand hover:bg-brand-soft focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  See how it works
                  <ChevronRight className="size-5" aria-hidden="true" />
                </button>
              </motion.div>

              <motion.div
                variants={entrance}
                initial="hidden"
                animate="visible"
                transition={{ ...transition, delay: reduceMotion ? 0 : 0.32 }}
                className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-6"
              >
                <span className="inline-flex items-center gap-2 text-base font-bold text-forest">
                  <Languages className="size-5" aria-hidden="true" />
                  Hindi · Tamil · Bengali · Marathi
                </span>
                <span className="inline-flex items-center gap-2 text-base font-bold text-forest">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                  Private and family-controlled
                </span>
              </motion.div>
            </div>

            <motion.div
              variants={entrance}
              initial="hidden"
              animate="visible"
              transition={{ ...transition, delay: reduceMotion ? 0 : 0.18 }}
              className="relative"
            >
              <div className="rounded-[2rem] border-2 border-line-strong bg-white p-5 shadow-[12px_12px_0_#e5dcc9] sm:p-8">
                <div className="flex items-center justify-between border-b border-line pb-5">
                  <div>
                    <p className="text-sm font-bold tracking-[0.12em] text-muted uppercase">
                      Today, 8:02 AM
                    </p>
                    <p className="mt-1 text-2xl font-bold text-ink">Good morning, Papa</p>
                  </div>
                  <span className="flex size-12 items-center justify-center rounded-full bg-sage text-forest">
                    <Volume2 className="size-6" aria-hidden="true" />
                  </span>
                </div>

                <div className="py-8 text-center">
                  <p className="text-lg font-medium text-muted">You can speak now</p>
                  <motion.div
                    animate={reduceMotion ? undefined : { scale: [1, 1.04, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    className="mx-auto mt-5 flex size-32 items-center justify-center rounded-full border-[10px] border-brand-soft bg-brand text-white shadow-[0_7px_0_#a9432d]"
                  >
                    <Mic className="size-12" strokeWidth={2.5} aria-hidden="true" />
                  </motion.div>
                  <p className="mt-6 text-2xl leading-8 font-bold text-ink">
                    “Meri subah ki dawai?”
                  </p>
                  <p className="mx-auto mt-3 max-w-sm text-lg leading-7 text-muted">
                    Yes Papa, it is time for your morning tablet. I’ll let the family know when
                    you’ve taken it.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-2xl border border-[#b9d5c1] bg-[#edf7ef] p-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-forest">
                      <Pill className="size-6" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-muted">Medicine</span>
                      <span className="block text-base font-bold text-ink">Taken at 8:05</span>
                    </span>
                    <Check className="ml-auto size-5 text-forest" aria-hidden="true" />
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-[#ead19f] bg-[#fff8e8] p-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#94661d]">
                      <CalendarDays className="size-6" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-muted">Next up</span>
                      <span className="block text-base font-bold text-ink">Doctor at 2 PM</span>
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-b border-line bg-white px-4 py-10 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-[1120px] gap-6 sm:grid-cols-3">
            {[
              { icon: PhoneCall, title: "Just talk", text: "No new app to learn" },
              { icon: Languages, title: "Your language", text: "Clear, familiar conversation" },
              { icon: ShieldCheck, title: "Family connected", text: "Updates when they matter" },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-center gap-4 sm:justify-center">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sage text-forest">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-lg font-bold text-ink">{title}</span>
                  <span className="block text-base text-muted">{text}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section
          id="how-it-works"
          className="bg-cream px-4 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24"
        >
          <div className="mx-auto max-w-[1160px]">
            <motion.div
              variants={entrance}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={transition}
              className="max-w-2xl"
            >
              <p className="text-base font-bold tracking-[0.12em] text-brand uppercase">
                Simple from the first day
              </p>
              <h2 className="mt-3 text-4xl leading-tight font-bold tracking-tight text-ink sm:text-5xl">
                Care should not feel complicated.
              </h2>
              <p className="mt-5 text-xl leading-8 text-muted">
                Three clear steps. No technical knowledge needed.
              </p>
            </motion.div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.article
                    key={step.number}
                    variants={entrance}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ ...transition, delay: reduceMotion ? 0 : index * 0.1 }}
                    className="rounded-[1.75rem] border-2 border-line-strong bg-white p-7"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-2xl font-bold text-brand">
                        {step.number}
                      </span>
                      <Icon className="size-8 text-forest" aria-hidden="true" />
                    </div>
                    <h3 className="mt-8 text-2xl font-bold text-ink">{step.title}</h3>
                    <p className="mt-4 text-lg leading-7 text-muted">{step.description}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-sage px-4 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <div className="mx-auto max-w-[1040px]">
            <div className="text-center">
              <p className="text-base font-bold tracking-[0.12em] text-forest uppercase">
                Let’s begin
              </p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
                Who are you setting this up for?
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-xl leading-8 text-muted">
                Choose one option. We’ll guide you through the rest, one step at a time.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <button
                type="button"
                onClick={goToCaregiver}
                className="group rounded-[1.75rem] border-2 border-line-strong bg-white p-7 text-left transition-colors hover:border-brand focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-brand sm:p-9"
              >
                <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  <Users className="size-8" aria-hidden="true" />
                </span>
                <span className="mt-7 block text-2xl font-bold text-ink">I’m a family member</span>
                <span className="mt-3 block text-lg leading-7 text-muted">
                  I want to set up care and receive updates for my parent or grandparent.
                </span>
                <span className="mt-8 flex min-h-13 items-center justify-between rounded-xl bg-brand px-5 text-lg font-bold text-white">
                  Continue as family
                  <ArrowRight
                    className="size-5 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/elderly")}
                className="group rounded-[1.75rem] border-2 border-line-strong bg-white p-7 text-left transition-colors hover:border-forest focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-forest sm:p-9"
              >
                <span className="flex size-16 items-center justify-center rounded-2xl bg-sage text-forest">
                  <Heart className="size-8 fill-current" aria-hidden="true" />
                </span>
                <span className="mt-7 block text-2xl font-bold text-ink">
                  I’m the patient
                </span>
                <span className="mt-3 block text-lg leading-7 text-muted">
                  If your caregiver has set up this device, open SmritiVani and start using it without signing in.
                </span>
                <span className="mt-8 flex min-h-13 items-center justify-between rounded-xl bg-forest px-5 text-lg font-bold text-white">
                  Open patient mode
                  <ArrowRight
                    className="size-5 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#fffaf0] px-4 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-white">
              <Heart className="size-5 fill-current" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xl font-bold text-ink">SmritiVani</p>
              <p className="text-base text-muted">Made with care for India’s elders</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-base font-medium text-muted">
            <span>Powered by Gnani.ai</span>
            <span>© 2025 SmritiVani</span>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
