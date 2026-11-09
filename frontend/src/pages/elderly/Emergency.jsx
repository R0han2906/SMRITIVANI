import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Phone, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePatientResources } from "../../hooks/usePatientResources";
import useScreenVoiceRouter from "../../hooks/useScreenVoiceRouter";

export default function Emergency() {
  const navigate = useNavigate();
  const { data, isLoading, error, create } = usePatientResources(["contacts", "alerts"]);
  const { isFromVoice, voiceIntent, markVoiceHandled } = useScreenVoiceRouter();
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const contacts = (data.contacts ?? []).filter((contact) => Boolean(contact.phone));
  const activeAlert = (data.alerts ?? []).find((alert) => ["open", "acknowledged"].includes(String(alert.status)));

  useEffect(() => {
    // If routed via emergency voice intent, auto-send alert
    if (isFromVoice && voiceIntent === "emergency") {
      void sendAlert();
      markVoiceHandled();
    }
  }, [isFromVoice, voiceIntent]);

  const sendAlert = async () => {
    setIsSending(true); setActionError(""); setMessage("");
    try {
      await create("alerts", { type: "distress", transcript: "SOS alert created from the patient emergency screen." });
      setMessage("Your SOS alert has been saved to your care profile.");
    } catch (saveError) { setActionError(saveError instanceof Error ? saveError.message : "Could not save the SOS alert."); }
    finally { setIsSending(false); }
  };

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-screen flex-col bg-red-600 px-4 py-6 text-white sm:px-6">
      <header className="mx-auto flex w-full max-w-2xl items-center gap-4"><button type="button" onClick={() => navigate("/elderly")} aria-label="Back to home" className="flex size-12 items-center justify-center rounded-xl bg-white/20"><ArrowLeft className="size-6" /></button><div><h1 className="text-3xl font-black">Need help?</h1><p className="text-lg text-red-100">Call someone you trust</p></div></header>
      <section className="mx-auto my-7 w-full max-w-2xl rounded-3xl bg-red-700/60 p-6 text-center"><AlertTriangle className="mx-auto size-10" /><p className="mt-3 text-xl font-bold">Send an SOS alert to your saved care profile</p><button type="button" disabled={isSending || Boolean(activeAlert)} onClick={() => void sendAlert()} className="mx-auto mt-5 flex min-h-32 min-w-32 items-center justify-center rounded-full border-8 border-red-200 bg-white px-8 text-4xl font-black text-red-700 shadow-xl disabled:opacity-60">{isSending ? "…" : activeAlert ? "SENT" : "SOS"}</button><p className="mt-4 text-sm leading-6 text-red-100">This records an alert for your caregiver to review. It does not place a call or send a push notification.</p>{activeAlert && <p className="mt-3 rounded-xl bg-white/15 p-3 font-bold">An alert is currently {String(activeAlert.status)}.</p>}{message && <p role="status" className="mt-3 rounded-xl bg-green-700 p-3 font-bold">{message}</p>}{(error || actionError) && <p role="alert" className="mt-3 rounded-xl bg-white p-3 font-bold text-red-700">{actionError || error}</p>}</section>
      <section className="mx-auto w-full max-w-2xl rounded-3xl bg-white p-6 text-ink shadow-xl"><h2 className="flex items-center gap-2 text-2xl font-bold"><Phone className="size-6 text-green-700" />Call your contacts</h2>{isLoading ? <p className="mt-4 text-muted">Loading saved contacts…</p> : contacts.length ? <div className="mt-4 flex flex-col gap-3">{contacts.map((contact) => { const phone = String(contact.phone); return <a key={String(contact.id)} href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="flex min-h-16 items-center justify-between gap-4 rounded-2xl bg-green-50 p-4 text-lg font-bold text-green-900"><span><span className="block">{String(contact.name ?? "Emergency contact")}</span><span className="text-sm font-normal text-slate-600">{[contact.relationship, phone].filter(Boolean).map(String).join(" · ")}</span></span><Phone className="size-6 shrink-0" /></a>; })}</div> : <p className="mt-4 rounded-xl bg-cream p-4 text-muted">No phone contacts are saved yet. Ask your caregiver to add one.</p>}<p className="mt-5 flex items-start gap-2 text-sm leading-6 text-muted"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-forest" />For immediate danger, use your phone to contact local emergency services. SmritiVani cannot place emergency calls automatically.</p></section>
    </motion.main>
  );
}
