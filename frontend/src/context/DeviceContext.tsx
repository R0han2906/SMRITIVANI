import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEVICE_STATE_CHANGE_EVENT, disablePatientDevice, getPairedElderProfile, getStoredDeviceToken, saveDevicePairing, unpairCurrentDevice, verifyDevicePairing, type DevicePairing } from "../services/api";

type DeviceContextValue = {
  isPaired: boolean;
  requiresPairing: boolean;
  isLoading: boolean;
  elderlyProfile: Record<string, unknown> | null;
  pairDevice: (code: string) => Promise<void>;
  unpairDevice: () => Promise<void>;
  invalidatePairing: () => void;
  refreshProfile: () => Promise<void>;
};

const DeviceContext = createContext<DeviceContextValue | null>(null);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [isPaired, setIsPaired] = useState(() => Boolean(getStoredDeviceToken()));
  const [requiresPairing, setRequiresPairing] = useState(false);
  const isLoading = false;
  const [elderlyProfile, setElderlyProfile] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const syncStoredPairing = () => {
      const paired = Boolean(getStoredDeviceToken());
      setIsPaired(paired);
      setRequiresPairing(false);
      if (!paired) setElderlyProfile(null);
    };
    window.addEventListener(DEVICE_STATE_CHANGE_EVENT, syncStoredPairing);
    return () => window.removeEventListener(DEVICE_STATE_CHANGE_EVENT, syncStoredPairing);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!getStoredDeviceToken()) { setIsPaired(false); setRequiresPairing(false); setElderlyProfile(null); return; }
    const result = await getPairedElderProfile();
    setElderlyProfile(result.elderly_profile);
    setIsPaired(true);
    setRequiresPairing(false);
  }, []);

  // A stored token is only a UI hint. The first paired-resource request validates
  // it with the backend and returns the profile and screen data together.
  const invalidatePairing = useCallback(() => {
    disablePatientDevice();
    setElderlyProfile(null);
    setIsPaired(false);
    setRequiresPairing(true);
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
    finally { invalidatePairing(); }
  }, [invalidatePairing]);

  const value = useMemo(() => ({ isPaired, requiresPairing, isLoading, elderlyProfile, pairDevice, unpairDevice, invalidatePairing, refreshProfile }), [isPaired, requiresPairing, isLoading, elderlyProfile, pairDevice, unpairDevice, invalidatePairing, refreshProfile]);
  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDevice() {
  const value = useContext(DeviceContext);
  if (!value) throw new Error("useDevice must be used within DeviceProvider");
  return value;
}
