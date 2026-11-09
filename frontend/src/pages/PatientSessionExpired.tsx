import { Heart, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

export default function PatientSessionExpired() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5 py-10 text-ink">
      <section className="w-full max-w-lg rounded-3xl border-2 border-line bg-white p-8 text-center shadow-[8px_8px_0_#e6dece]">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-sage text-forest"><Heart className="size-8 fill-current" /></span>
        <h1 className="mt-5 text-3xl font-bold">Caregiver sign-in is needed</h1>
        <p className="mt-3 leading-7 text-muted">This device’s saved access has expired. Ask your caregiver to sign in again to restore your care information. You won’t need to sign in yourself.</p>
        <Link to="/login" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-5 font-bold text-white"><UserRound className="size-5" /> Caregiver sign in</Link>
      </section>
    </main>
  );
}
