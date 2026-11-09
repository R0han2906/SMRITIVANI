import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useDevice } from "../context/DeviceContext";

export default function PatientDeviceRoute({ children }: { children: ReactNode }) {
  const { isPaired, isLoading } = useDevice();
  if (isLoading) return <main className="flex min-h-screen items-center justify-center bg-cream text-lg font-bold text-ink">Connecting your device…</main>;
  if (!isPaired) return <Navigate to="/elderly/pair" replace />;
  return children;
}
