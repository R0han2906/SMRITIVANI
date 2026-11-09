import { useState } from "react";
import { ArrowLeft, Heart, LoaderCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDevice } from "../../context/DeviceContext";

export default function ClaimCodeEntry() {
  const navigate = useNavigate();
  const { pairDevice } = useDevice();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addDigit = (digit: string) => { setError(""); setCode((value) => value.length >= 6 ? value : value + digit); };
  const submit = async () => {
    if (code.length < 4) { setError("Please enter the code shared by your caregiver."); return; }
    setIsSubmitting(true); setError("");
    try { await pairDevice(code); navigate("/elderly", { replace: true }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "We could not connect this device. Please check the code and try again."); }
    finally { setIsSubmitting(false); }
  };

  return <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-8 text-ink"><section className="w-full max-w-md rounded-3xl border-2 border-line bg-white p-6 text-center shadow-[8px_8px_0_#e6dece] sm:p-8">
    <Link to="/" className="mb-4 flex size-12 items-center justify-center rounded-xl bg-cream text-muted" aria-label="Back"><ArrowLeft /></Link>
    <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-sage text-forest"><Heart className="size-8 fill-current" /></span>
    <h1 className="mt-4 text-3xl font-bold">Code daalein</h1><p className="mt-2 text-lg text-muted">Enter the code your caregiver gave you.</p>
    <div aria-label="Pairing code" className="mt-6 flex min-h-16 items-center justify-center rounded-xl border-2 border-line-strong bg-cream px-4 text-3xl font-bold tracking-[0.35em]">{code.padEnd(6, "•")}</div>
    <div className="mx-auto mt-5 grid max-w-xs grid-cols-3 gap-3">{["1","2","3","4","5","6","7","8","9"].map((digit) => <button key={digit} type="button" onClick={() => addDigit(digit)} disabled={isSubmitting} className="min-h-16 rounded-xl border border-line bg-white text-2xl font-bold shadow-sm active:bg-sage">{digit}</button>)}<span /><button type="button" onClick={() => addDigit("0")} disabled={isSubmitting} className="min-h-16 rounded-xl border border-line bg-white text-2xl font-bold shadow-sm active:bg-sage">0</button><button type="button" onClick={() => { setCode((value) => value.slice(0, -1)); setError(""); }} disabled={isSubmitting} aria-label="Delete last digit" className="flex min-h-16 items-center justify-center rounded-xl border border-line bg-white text-2xl shadow-sm active:bg-sage">⌫</button></div>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-left font-semibold text-red-700">{error}</p>}
    <button type="button" onClick={() => void submit()} disabled={isSubmitting || code.length < 4} className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand text-lg font-bold text-white disabled:opacity-50">{isSubmitting && <LoaderCircle className="size-5 animate-spin" />}Connect this device</button>
    <p className="mt-4 text-sm leading-6 text-muted">Your caregiver can find or create this code in their SmritiVani account.</p>
  </section></main>;
}
