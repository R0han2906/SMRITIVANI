import { FormEvent, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check, Heart, LogOut, Settings as SettingsIcon, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { CaregiverBottomNav } from "../../components/layout/CaregiverChrome";
import { disablePatientDevice, getCurrentElderId, saveCurrentElderId, updateElderProfile, createDevicePairingCode, getCaregiverDashboard, revokeCaregiverPairedDevices } from "../../services/api";
import { GNANI_SPEECH_LANGUAGES, toGnaniLanguageCode } from "../../utils/languages";

type Elder = { id: string; name: string; age?: number | null; city?: string | null; language?: string; lives_alone?: boolean; doctor_name?: string | null; doctor_phone?: string | null };
const inputClass = "h-12 w-full rounded-xl border-2 border-line-strong bg-cream px-4 text-base outline-none focus:border-brand";

export default function Settings() {
  const navigate = useNavigate();
  const { logout, user, updateProfile } = useAuth();
  const reduceMotion = useReducedMotion();
  const [elder, setElder] = useState<Elder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pairingCode, setPairingCode] = useState("");
  const [isCreatingPairingCode, setIsCreatingPairingCode] = useState(false);
  const [pairedDevice, setPairedDevice] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSavingElder, setIsSavingElder] = useState(false);
  const [elderDraft, setElderDraft] = useState({ name: "", age: "", language: "hi-IN", city: "", lives_alone: true, doctor_name: "", doctor_phone: "" });
  const [profile, setProfile] = useState({
    display_name: typeof user?.display_name === "string" ? user.display_name : "",
    phone: typeof user?.phone === "string" ? user.phone : "",
    city: typeof user?.city === "string" ? user.city : "",
  });

  useEffect(() => {
    setProfile({
      display_name: typeof user?.display_name === "string" ? user.display_name : "",
      phone: typeof user?.phone === "string" ? user.phone : "",
      city: typeof user?.city === "string" ? user.city : "",
    });
  }, [user]);

  useEffect(() => {
    let active = true;
    getCaregiverDashboard(getCurrentElderId(), false).then((result) => {
      const item = result.elder;
      if (typeof item.id === "string" && typeof item.name === "string") {
        saveCurrentElderId(item.id);
        if (active) {
          const loaded = { id: item.id, name: item.name, age: typeof item.age === "number" ? item.age : null, city: typeof item.city === "string" ? item.city : null, language: toGnaniLanguageCode(item.language), lives_alone: Boolean(item.lives_alone), doctor_name: typeof item.doctor_name === "string" ? item.doctor_name : "", doctor_phone: typeof item.doctor_phone === "string" ? item.doctor_phone : "" };
          setElder(loaded);
          setPairedDevice(result.paired_device);
          setElderDraft({ name: loaded.name, age: loaded.age === null ? "" : String(loaded.age), language: loaded.language ?? "hindi", city: loaded.city ?? "", lives_alone: loaded.lives_alone ?? true, doctor_name: loaded.doctor_name ?? "", doctor_phone: loaded.doctor_phone ?? "" });
        }
      }
    }).catch((loadError) => {
      if (active) setError(loadError instanceof Error ? loadError.message : "Could not load your care profile.");
    }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const saveElder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!elder) return;
    setError(""); setSuccess(""); setIsSavingElder(true);
    try {
      const updated = await updateElderProfile(elder.id, { name: elderDraft.name.trim(), age: elderDraft.age ? Number(elderDraft.age) : null, language: elderDraft.language, city: elderDraft.city.trim() || null, lives_alone: elderDraft.lives_alone, doctor_name: elderDraft.doctor_name.trim() || null, doctor_phone: elderDraft.doctor_phone.trim() || null });
      setElder({ ...elder, name: String(updated.name ?? elderDraft.name), age: typeof updated.age === "number" ? updated.age : null, city: typeof updated.city === "string" ? updated.city : null, language: String(updated.language ?? elderDraft.language), lives_alone: Boolean(updated.lives_alone), doctor_name: typeof updated.doctor_name === "string" ? updated.doctor_name : "", doctor_phone: typeof updated.doctor_phone === "string" ? updated.doctor_phone : "" });
      setSuccess("The care profile has been updated.");
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Could not update the care profile."); }
    finally { setIsSavingElder(false); }
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(""); setSuccess(""); setIsSaving(true);
    try {
      await updateProfile({ display_name: profile.display_name.trim(), phone: profile.phone.trim(), city: profile.city.trim() });
      setSuccess("Your account details have been saved.");
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Could not save your account details."); }
    finally { setIsSaving(false); }
  };

  const generatePairingCode = async () => {
    if (!elder) return;
    setError(""); setSuccess(""); setIsCreatingPairingCode(true); setPairingCode("");
    try {
      const result = await createDevicePairingCode(elder.id);
      setPairingCode(result.claim_code);
      setSuccess("Pairing code created. It expires in 15 minutes and can be used once.");
    } catch (issueError) { setError(issueError instanceof Error ? issueError.message : "Could not create a device pairing code."); }
    finally { setIsCreatingPairingCode(false); }
  };

  const unpairDevice = async () => {
    if (!elder) return;
    setError(""); setSuccess("");
    try { await revokeCaregiverPairedDevices(elder.id); setPairedDevice(null); setSuccess("The elderly device has been unpaired. Generate a new code to reconnect it."); }
    catch (unpairError) { setError(unpairError instanceof Error ? unpairError.message : "Could not unpair the device."); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-cream pb-28 text-ink">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-2xl items-center gap-4 px-4 sm:px-6">
          <button type="button" onClick={() => navigate("/caregiver")} aria-label="Back to dashboard" className="flex size-12 items-center justify-center rounded-xl bg-cream text-muted"><ArrowLeft className="size-6" /></button>
          <h1 className="flex-1 text-2xl font-bold">Settings</h1><SettingsIcon className="size-6 text-muted" />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pt-28 sm:px-6">
        {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}
        {success && <p role="status" className="mb-5 rounded-xl border border-[#b9d5c1] bg-sage p-4 text-sm font-bold text-forest">{success}</p>}

        <section className="rounded-2xl border border-line bg-white p-6 shadow-[4px_4px_0_#e6dece]">
          <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand"><User /></span><div><h2 className="text-xl font-bold">Caregiver account</h2><p className="text-sm text-muted">Update the details saved to your account.</p></div></div>
          <form onSubmit={saveProfile} className="mt-6 space-y-4">
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Name</span><input required value={profile.display_name} onChange={(event) => setProfile({ ...profile, display_name: event.target.value })} className={inputClass} /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Phone</span><input type="tel" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} className={inputClass} /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">City</span><input value={profile.city} onChange={(event) => setProfile({ ...profile, city: event.target.value })} className={inputClass} /></label>
            <button type="submit" disabled={isSaving || !profile.display_name.trim()} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-forest px-5 font-bold text-white disabled:opacity-50">{isSaving ? "Saving…" : <><Check className="size-4" /> Save account details</>}</button>
          </form>
        </section>

        <section className="mt-7 rounded-2xl border border-line bg-white p-6">
          <h2 className="text-xl font-bold">Elder care profile</h2>
          {isLoading ? <p className="mt-4 text-muted">Loading care profile…</p> : elder ? <form onSubmit={(event) => void saveElder(event)} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Name</span><input required maxLength={200} value={elderDraft.name} onChange={(event) => setElderDraft({ ...elderDraft, name: event.target.value })} className={inputClass} /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Age</span><input type="number" min={0} max={125} value={elderDraft.age} onChange={(event) => setElderDraft({ ...elderDraft, age: event.target.value })} className={inputClass} /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Primary language</span><select required value={elderDraft.language} onChange={(event) => setElderDraft({ ...elderDraft, language: event.target.value })} className={inputClass}>{GNANI_SPEECH_LANGUAGES.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}</select><span className="mt-1 block text-xs text-muted">Used for microphone recognition and spoken replies.</span></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">City or town</span><input maxLength={160} value={elderDraft.city} onChange={(event) => setElderDraft({ ...elderDraft, city: event.target.value })} className={inputClass} /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Doctor’s name</span><input value={elderDraft.doctor_name} onChange={(event) => setElderDraft({ ...elderDraft, doctor_name: event.target.value })} className={inputClass} /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Doctor’s phone</span><input type="tel" value={elderDraft.doctor_phone} onChange={(event) => setElderDraft({ ...elderDraft, doctor_phone: event.target.value })} className={inputClass} /></label>
            <label className="flex min-h-12 items-center gap-3 font-bold sm:col-span-2"><input type="checkbox" checked={elderDraft.lives_alone} onChange={(event) => setElderDraft({ ...elderDraft, lives_alone: event.target.checked })} className="size-5 accent-brand" />Lives alone</label>
            <button type="submit" disabled={isSavingElder || !elderDraft.name.trim()} className="min-h-12 rounded-xl bg-forest px-5 font-bold text-white disabled:opacity-50 sm:col-span-2">{isSavingElder ? "Saving…" : "Save care profile"}</button>
          </form> : <p className="mt-4 text-muted">No care profile exists yet. <Link to="/onboarding" className="font-bold text-brand underline">Start onboarding</Link></p>}
        </section>

        <section className="mt-7 rounded-2xl border border-line bg-white p-6">
          <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-sage text-forest"><Heart className="fill-current" /></span><div><h2 className="text-xl font-bold">Pair your loved one’s device</h2><p className="text-sm text-muted">Create a one-time code to connect a separate tablet or phone. The elderly device won’t need an email or password.</p></div></div>
          {isLoading ? <p className="mt-5 text-muted">Loading care profile…</p> : elder ? <>
            <div className="mt-5 rounded-xl bg-cream p-4"><p className="font-bold">{elder.name}</p><p className="text-sm text-muted">{[elder.age ? `${elder.age} years` : null, elder.city].filter(Boolean).join(" · ")}</p></div>
            <p className="mt-4 text-sm leading-6 text-muted">{pairedDevice ? `Device paired ${pairedDevice.first_paired_at ? `on ${new Date(String(pairedDevice.first_paired_at)).toLocaleString()}` : ""}. Last active ${pairedDevice.last_seen_at ? new Date(String(pairedDevice.last_seen_at)).toLocaleString() : "recently"}.` : "No device is paired. Share a one-time code with your loved one or enter it on their device. The code expires after 15 minutes."}</p>
            {pairingCode && <p aria-live="polite" className="mt-4 rounded-xl border-2 border-forest bg-sage px-5 py-4 text-center font-mono text-4xl font-bold tracking-[0.4em] text-forest">{pairingCode}</p>}
            <button type="button" onClick={() => void generatePairingCode()} disabled={isCreatingPairingCode} className="mt-4 min-h-12 rounded-xl bg-brand px-5 font-bold text-white disabled:opacity-50">{isCreatingPairingCode ? "Creating code…" : pairingCode ? "Generate replacement code" : "Generate pairing code"}</button>
            {pairedDevice && <button type="button" onClick={() => void unpairDevice()} className="ml-3 mt-4 min-h-12 rounded-xl border border-red-200 bg-red-50 px-5 font-bold text-red-700">Unpair device</button>}
          </> : <div className="mt-5 rounded-xl bg-cream p-4"><p className="font-bold">No care profile found</p><Link to="/onboarding" className="mt-3 inline-block font-bold text-brand underline">Set up a profile</Link></div>}
        </section>

        <section className="mt-7 rounded-2xl border border-line bg-white p-6"><div className="flex items-center gap-3"><Heart className="size-6 fill-brand text-brand" /><div><h2 className="font-bold">Other account features</h2><p className="text-sm text-muted">Subscription, notification preferences, and privacy exports are not available in the current backend.</p></div></div></section>
        <button type="button" onClick={() => { disablePatientDevice(); void logout().catch(() => undefined).finally(() => navigate("/")); }} className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-lg font-bold text-red-600"><LogOut className="size-5" /> Log out</button>
      </main>
      <CaregiverBottomNav activeOverride="Profile" />
    </motion.div>
  );
}
