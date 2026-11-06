import { FormEvent, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Brain,
  Eye,
  EyeOff,
  Globe2,
  Heart,
  Lock,
  Mail,
  Pill,
  Shield,
  ShieldCheck,
  Smartphone,
  User,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const fieldClass =
  "h-14 w-full rounded-xl border-2 border-line-strong bg-[#fffdf8] text-lg text-ink outline-none transition-all duration-200 placeholder:text-[#7b8a85] focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand-soft";

const features = [
  {
    icon: ShieldCheck,
    title: "Help is never far away",
    text: "Receive a clear alert when your parent may need you.",
  },
  {
    icon: Pill,
    title: "Gentle medicine reminders",
    text: "Timely reminders spoken in the language they know best.",
  },
  {
    icon: Brain,
    title: "Stories stay in the family",
    text: "Save the memories and moments they choose to share.",
  },
];

type FormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: "", color: "" };
  if (password.length <= 4) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (password.length <= 7) return { score: 2, label: "Fair", color: "bg-brand" };

  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (password.length >= 12 && hasNumber && hasSymbol) {
    return { score: 4, label: "Strong", color: "bg-forest" };
  }
  if (password.length >= 8 && hasMixedCase) {
    return { score: 3, label: "Good", color: "bg-amber-500" };
  }
  return { score: 2, label: "Fair", color: "bg-brand" };
}

export default function Signup() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);
  const passwordsMismatch =
    formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;
  const isComplete =
    Object.values(formData).every((value) => value.trim()) && !passwordsMismatch && agreedToTerms;

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isComplete) {
      setErrors({ form: "Please complete every field before continuing." });
      return;
    }
    console.log(formData);
    navigate("/onboarding");
  };

  const motionTransition = { duration: reduceMotion ? 0 : 0.45 };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.35 }}
      className="min-h-screen bg-cream text-ink lg:grid lg:grid-cols-[45%_55%] xl:grid-cols-2"
    >
      <aside className="relative hidden min-h-screen overflow-hidden border-r border-line bg-brand-soft p-10 lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -top-32 -left-32 size-96 rounded-full border-[80px] border-white/30" />
        <div className="absolute right-10 bottom-10 size-40 rounded-full border-[32px] border-brand/10" />

        <motion.div
          initial={{ opacity: 0, x: reduceMotion ? 0 : -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={motionTransition}
          className="relative z-10"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand text-white">
              <Heart className="size-7 fill-current" aria-hidden="true" />
            </span>
            <span className="text-2xl font-bold tracking-tight">SmritiVani</span>
          </Link>

          <h1 className="mt-14 max-w-xl text-4xl leading-[1.15] font-bold tracking-tight xl:text-5xl">
            A simple way to care, even from far away.
          </h1>
          <p className="mt-6 max-w-xl text-xl leading-8 text-muted">
            Create your free family account. We’ll guide you one clear step at a time—no card and no
            technical knowledge needed.
          </p>

          <div className="mt-12 flex flex-col gap-5">
            {features.map(({ icon: Icon, title, text }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: reduceMotion ? 0 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...motionTransition, delay: reduceMotion ? 0 : 0.1 + index * 0.08 }}
                className="flex items-start gap-4 rounded-2xl border border-white/70 bg-white/55 p-5"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-brand">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-lg font-bold">{title}</span>
                  <span className="mt-1 block text-base leading-6 text-muted">{text}</span>
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.figure
          initial={{ opacity: 0, x: reduceMotion ? 0 : -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...motionTransition, delay: reduceMotion ? 0 : 0.35 }}
          className="relative z-10 mt-12 rounded-3xl border border-white/80 bg-white/65 p-6"
        >
          <blockquote className="text-lg leading-7 font-medium">
            “SmritiVani makes every check-in feel calm and personal. My mother feels independent,
            and I feel close to her.”
          </blockquote>
          <figcaption className="mt-5 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
              RK
            </span>
            <span>
              <span className="block font-bold">Rajesh Kumar, Bengaluru</span>
              <span className="block text-sm text-muted">Son and caregiver</span>
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
              Have an account?{" "}
              <Link to="/login" className="font-bold text-brand underline-offset-4 hover:underline">
                Log in
              </Link>
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...motionTransition, delay: reduceMotion ? 0 : 0.15 }}
            className="rounded-3xl border-2 border-line bg-white p-6 shadow-[8px_8px_0_#e6dece] sm:p-8 md:p-10"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Create your account</h2>
            <p className="mt-3 text-lg leading-7 text-muted">
              Start with a free family account. It only takes a minute.
            </p>

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
                  <span className="mb-2 block text-base font-bold">Full name</span>
                  <span className="relative block">
                    <User
                      className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      autoComplete="name"
                      value={formData.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      placeholder="e.g., Rahul Sharma"
                      className={`${fieldClass} pr-4 pl-12`}
                    />
                  </span>
                </motion.label>

                <motion.label
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...motionTransition, delay: reduceMotion ? 0 : 0.25 }}
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
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder="rahul@example.com"
                      className={`${fieldClass} pr-4 pl-12`}
                    />
                  </span>
                </motion.label>

                <motion.label
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...motionTransition, delay: reduceMotion ? 0 : 0.3 }}
                  className="block"
                >
                  <span className="mb-2 block text-base font-bold">Phone number</span>
                  <span className="relative block">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 rounded-lg border border-line bg-cream px-2.5 py-1.5 text-sm font-bold text-muted">
                      IN +91
                    </span>
                    <input
                      type="tel"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      placeholder="98765 43210"
                      className={`${fieldClass} pr-4 pl-25`}
                    />
                  </span>
                </motion.label>

                <motion.div
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...motionTransition, delay: reduceMotion ? 0 : 0.35 }}
                >
                  <label htmlFor="signup-password" className="mb-2 block text-base font-bold">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={(event) => updateField("password", event.target.value)}
                      placeholder="At least 8 characters"
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
                  {strength.score > 0 && (
                    <div className="mt-3" aria-label={`Password strength: ${strength.label}`}>
                      <div className="flex h-1.5 gap-1.5">
                        {[1, 2, 3, 4].map((bar) => (
                          <span key={bar} className="flex-1 overflow-hidden rounded-full bg-line">
                            <motion.span
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: bar <= strength.score ? 1 : 0 }}
                              className={`block h-full origin-left rounded-full ${strength.color}`}
                            />
                          </span>
                        ))}
                      </div>
                      <p className="mt-1.5 text-sm font-bold text-muted">
                        {strength.label} password
                      </p>
                    </div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...motionTransition, delay: reduceMotion ? 0 : 0.4 }}
                >
                  <label htmlFor="confirm-password" className="mb-2 block text-base font-bold">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={(event) => updateField("confirmPassword", event.target.value)}
                      placeholder="Re-enter your password"
                      aria-invalid={passwordsMismatch}
                      className={`${fieldClass} pr-12 pl-12 ${passwordsMismatch ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-cream hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
                      aria-label={
                        showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-5" />
                      ) : (
                        <Eye className="size-5" />
                      )}
                    </button>
                  </div>
                  {passwordsMismatch && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-red-600">
                      <AlertCircle className="size-4" aria-hidden="true" />
                      Passwords don’t match
                    </p>
                  )}
                </motion.div>
              </div>

              <label className="mt-6 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(event) => setAgreedToTerms(event.target.checked)}
                  className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[#c9573b]"
                />
                <span className="text-base leading-6 text-muted">
                  I agree to the{" "}
                  <Link to="/terms" className="font-bold text-brand underline underline-offset-3">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="font-bold text-brand underline underline-offset-3">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              {errors.form && (
                <p className="mt-4 flex items-center gap-2 text-sm font-bold text-red-600">
                  <AlertCircle className="size-4" aria-hidden="true" />
                  {errors.form}
                </p>
              )}

              <motion.button
                type="submit"
                disabled={!isComplete}
                whileHover={isComplete && !reduceMotion ? { y: -1 } : undefined}
                whileTap={isComplete ? { scale: 0.98 } : undefined}
                className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-lg font-bold text-white shadow-[0_4px_0_#a9432d] transition-transform disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
              >
                Create account
                <ArrowRight className="size-5" aria-hidden="true" />
              </motion.button>
            </form>

            <p className="mt-7 text-center text-base text-muted">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-brand underline-offset-4 hover:underline">
                Log in
              </Link>
            </p>
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
