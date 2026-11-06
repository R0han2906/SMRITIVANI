import { FormEvent, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bell,
  Eye,
  EyeOff,
  Globe2,
  Heart,
  Loader2,
  Lock,
  Mail,
  Pill,
  Shield,
  Smartphone,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const fieldClass =
  "h-14 w-full rounded-xl border-2 border-line-strong bg-[#fffdf8] text-lg text-ink outline-none transition-all duration-200 placeholder:text-[#7b8a85] focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand-soft";

const stats = [
  {
    icon: Activity,
    title: "A friendly daily check-in",
    text: "Conversation that follows their pace",
  },
  {
    icon: Pill,
    title: "Medicine routine at a glance",
    text: "Simple updates without information overload",
  },
  {
    icon: Bell,
    title: "Important alerts, right away",
    text: "Clear messages when your attention is needed",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = formData.email.trim() !== "" && formData.password.trim() !== "";
  const motionTransition = { duration: reduceMotion ? 0 : 0.45 };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setLoginError(true);
      return;
    }

    setLoginError(false);
    setIsSubmitting(true);
    window.setTimeout(() => {
      navigate("/onboarding");
    }, 1500);
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.35 }}
      className="min-h-screen bg-cream text-ink lg:grid lg:grid-cols-[45%_55%] xl:grid-cols-2"
    >
      <aside className="relative hidden min-h-screen overflow-hidden border-r border-line bg-sage p-10 lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -top-28 -left-28 size-88 rounded-full border-[72px] border-white/35" />
        <div className="absolute right-12 bottom-12 size-36 rounded-full border-[28px] border-forest/10" />

        <motion.div
          initial={{ opacity: 0, x: reduceMotion ? 0 : -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={motionTransition}
          className="relative z-10"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-forest"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-forest text-white">
              <Heart className="size-7 fill-current" aria-hidden="true" />
            </span>
            <span className="text-2xl font-bold tracking-tight">SmritiVani</span>
          </Link>

          <h1 className="mt-14 max-w-xl text-4xl leading-[1.15] font-bold tracking-tight xl:text-5xl">
            Welcome back. Your family’s day is close at hand.
          </h1>
          <p className="mt-6 max-w-xl text-xl leading-8 text-muted">
            See medicine updates, daily conversations, and the moments that matter—all in one calm,
            easy-to-read place.
          </p>

          <div className="mt-12 flex flex-col gap-4">
            {stats.map(({ icon: Icon, title, text }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: reduceMotion ? 0 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...motionTransition, delay: reduceMotion ? 0 : 0.1 + index * 0.08 }}
                className="flex items-center gap-4 rounded-2xl border border-white/75 bg-white/55 p-5"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-forest">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-lg font-bold">{title}</span>
                  <span className="mt-1 block text-base text-muted">{text}</span>
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.figure
          initial={{ opacity: 0, x: reduceMotion ? 0 : -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...motionTransition, delay: reduceMotion ? 0 : 0.35 }}
          className="relative z-10 mt-12 rounded-3xl border border-white/80 bg-white/60 p-6"
        >
          <blockquote className="text-lg leading-7 font-medium">
            “I live in Dubai and my mother is in Lucknow. Our daily connection now feels reassuring,
            not worrying.”
          </blockquote>
          <figcaption className="mt-5 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-forest text-sm font-bold text-white">
              PS
            </span>
            <span>
              <span className="block font-bold">Priya Sharma, Dubai</span>
              <span className="block text-sm text-muted">Daughter and caregiver</span>
            </span>
          </figcaption>
        </motion.figure>
      </aside>

      <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 md:p-12 lg:p-10 xl:p-16">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
            <Link to="/" className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-brand text-white">
                <Heart className="size-6 fill-current" aria-hidden="true" />
              </span>
              <span className="text-xl font-bold">SmritiVani</span>
            </Link>
            <p className="text-right text-sm text-muted">
              New here?{" "}
              <Link
                to="/signup"
                className="font-bold text-brand underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...motionTransition, delay: reduceMotion ? 0 : 0.15 }}
            className="rounded-3xl border-2 border-line bg-white p-6 shadow-[8px_8px_0_#e6dece] sm:p-8 md:p-10"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Welcome back</h2>
            <p className="mt-3 text-lg leading-7 text-muted">Log in to check on your loved one.</p>

            <div className="my-7 h-px bg-line" />

            <div className="flex flex-col gap-3">
              <motion.button
                type="button"
                whileHover={reduceMotion ? undefined : { y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border-2 border-line-strong bg-white px-4 text-base font-bold text-ink transition-colors hover:border-brand hover:bg-brand-soft focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <Globe2 className="size-5 text-brand" aria-hidden="true" />
                Continue with Google
              </motion.button>
              <motion.button
                type="button"
                whileHover={reduceMotion ? undefined : { y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border-2 border-line-strong bg-white px-4 text-base font-bold text-ink transition-colors hover:border-forest hover:bg-sage focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-forest"
              >
                <Smartphone className="size-5 text-forest" aria-hidden="true" />
                Continue with phone number
              </motion.button>
            </div>

            <div className="my-7 flex items-center gap-4">
              <span className="h-px flex-1 bg-line" />
              <span className="text-sm font-bold text-muted">or use email</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="flex flex-col gap-5">
                <motion.label
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...motionTransition, delay: reduceMotion ? 0 : 0.2 }}
                  className="block"
                >
                  <span className="mb-2 block text-base font-bold">Email address</span>
                  <span className="relative block">
                    <Mail
                      className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(event) => {
                        setFormData((current) => ({ ...current, email: event.target.value }));
                        setLoginError(false);
                      }}
                      placeholder="rahul@example.com"
                      className={`${fieldClass} pr-4 pl-12`}
                    />
                  </span>
                </motion.label>

                <motion.div
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...motionTransition, delay: reduceMotion ? 0 : 0.28 }}
                >
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <label htmlFor="login-password" className="text-base font-bold">
                      Password
                    </label>
                    <button type="button" className="text-sm font-bold text-brand hover:underline">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock
                      className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={(event) => {
                        setFormData((current) => ({ ...current, password: event.target.value }));
                        setLoginError(false);
                      }}
                      placeholder="Enter your password"
                      className={`${fieldClass} pr-12 pl-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-cream hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </motion.div>
              </div>

              <label className="mt-5 flex cursor-pointer items-center gap-3 text-base text-muted">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="size-5 cursor-pointer accent-[#c9573b]"
                />
                Remember me for 30 days
              </label>

              <AnimatePresence>
                {loginError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
                  >
                    <AlertCircle
                      className="mt-0.5 size-5 shrink-0 text-red-600"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-bold text-red-700">
                      Enter your email and password, then try again.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                whileHover={canSubmit && !isSubmitting && !reduceMotion ? { y: -1 } : undefined}
                whileTap={canSubmit && !isSubmitting ? { scale: 0.98 } : undefined}
                className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-lg font-bold text-white shadow-[0_4px_0_#a9432d] transition-transform disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                    Logging in…
                  </>
                ) : (
                  <>
                    Log in
                    <ArrowRight className="size-5" aria-hidden="true" />
                  </>
                )}
              </motion.button>
            </form>

            <p className="mt-7 text-center text-base text-muted">
              Don’t have an account?{" "}
              <Link
                to="/signup"
                className="font-bold text-brand underline-offset-4 hover:underline"
              >
                Create one free
              </Link>
            </p>

            <div className="my-7 h-px bg-line" />

            <div className="rounded-2xl border border-[#b9d5c1] bg-sage p-5 text-center">
              <Heart className="mx-auto size-7 fill-forest text-forest" aria-hidden="true" />
              <p className="mt-3 text-lg font-bold">Are you using SmritiVani yourself?</p>
              <p className="mt-1 text-base text-muted">
                No login needed. You can simply start talking.
              </p>
              <button
                type="button"
                onClick={() => navigate("/elderly")}
                className="mt-4 min-h-12 rounded-xl bg-forest px-6 text-base font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-forest"
              >
                Go to voice companion
              </button>
            </div>
          </motion.div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-sm font-bold text-muted">
            <span className="flex items-center gap-1.5">
              <Shield className="size-4" aria-hidden="true" />
              Encrypted
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="size-4" aria-hidden="true" />
              Private
            </span>
            <span className="flex items-center gap-1.5">
              <Heart className="size-4" aria-hidden="true" />
              Free plan
            </span>
          </div>
        </div>
      </section>
    </motion.main>
  );
}
