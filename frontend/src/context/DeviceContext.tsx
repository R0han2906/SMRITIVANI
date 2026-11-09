import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { disablePatientDevice, getPairedElderProfile, getStoredDeviceToken, saveDevicePairing, unpairCurrentDevice, verifyDevicePairing, type DevicePairing } from "../services/api";

type DeviceContextValue = {
  isPaired: boolean;
  requiresPairing: boolean;
  isLoading: boolean;
  elderlyProfile: Record<string, unknown> | null;
  pairDevice: (code: string) => Promise<void>;
  unpairDevice: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const DeviceContext = createContext<DeviceContextValue | null>(null);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [isPaired, setIsPaired] = useState(false);
  const [requiresPairing, setRequiresPairing] = useState(() => Boolean(getStoredDeviceToken()));
  const [isLoading, setIsLoading] = useState(true);
  const [elderlyProfile, setElderlyProfile] = useState<Record<string, unknown> | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!getStoredDeviceToken()) { setIsPaired(false); setRequiresPairing(false); setElderlyProfile(null); return; }
    const result = await getPairedElderProfile();
    setElderlyProfile(result.elderly_profile);
    setIsPaired(true);
    setRequiresPairing(false);
  }, []);

  useEffect(() => {
    let active = true;
    if (!getStoredDeviceToken()) { setIsLoading(false); return; }
    getPairedElderProfile().then((result) => {
      if (active) { setElderlyProfile(result.elderly_profile); setIsPaired(true); setRequiresPairing(false); }
    }).catch(() => {
      if (active) { disablePatientDevice(); setElderlyProfile(null); setIsPaired(false); setRequiresPairing(true); }
    }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const pairDevice = useCallback(async (code: string) => {
    const pairing: DevicePairing = await verifyDevicePairing(code);
    saveDevicePairing(pairing);
    setElderlyProfile(pairing.elderly_profile);
    setIsPaired(true);
    setRequiresPairing(false);
  }, []);

  const unpairDevice = useCallback(async () => {
    try { if (getStoredDeviceToken()) await unpairCurrentDevice(); }
    finally { disablePatientDevice(); setIsPaired(false); setRequiresPairing(true); setElderlyProfile(null); }
  }, []);

  const value = useMemo(() => ({ isPaired, requiresPairing, isLoading, elderlyProfile, pairDevice, unpairDevice, refreshProfile }), [isPaired, requiresPairing, isLoading, elderlyProfile, pairDevice, unpairDevice, refreshProfile]);
  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDevice() {
  const value = useContext(DeviceContext);
  if (!value) throw new Error("useDevice must be used within DeviceProvider");
  return value;
}
