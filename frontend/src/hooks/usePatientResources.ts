import { useCallback, useEffect, useMemo, useState } from "react";
import { useDevice } from "../context/DeviceContext";
import {
  ApiError,
  createElderResource,
  deleteElderResource,
  getCurrentElderId,
  getElderlyProfiles,
  getPairedElderResources,
  getStoredDeviceToken,
  listElderResource,
  saveCurrentElderId,
  updateElderResource,
  type ElderResource,
} from "../services/api";

type Row = Record<string, unknown>;

export function usePatientResources(resources: ElderResource[]) {
  const device = useDevice();
  const resourceKey = useMemo(() => [...new Set(resources)].sort().join("|"), [resources]);
  const requestedResources = useMemo(() => resourceKey.split("|").filter(Boolean) as ElderResource[], [resourceKey]);
  const [elderId, setElderId] = useState("");
  const [elder, setElder] = useState<Row | null>(null);
  const [data, setData] = useState<Partial<Record<ElderResource, Row[]>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadResource = useCallback(async (id: string, resource: ElderResource) => {
    const response = await listElderResource(id, resource);
    setData((current) => ({ ...current, [resource]: response.items }));
    return response.items;
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const paired = getStoredDeviceToken() ? await getPairedElderResources(requestedResources) : null;
        const row = paired?.elderly_profile;
        const list = row ? null : await getElderlyProfiles();
        const selectedId = getCurrentElderId();
        const selectedRow = row ?? list?.items.find((item) => item.id === selectedId) ?? list?.items[0];
        if (!selectedRow || typeof selectedRow.id !== "string") throw new Error("Your caregiver needs to finish setting up this device.");
        saveCurrentElderId(selectedRow.id);
        if (active) { setElderId(selectedRow.id); setElder(selectedRow); }
        if (paired) {
          if (active) setData((current) => ({ ...current, ...paired.data }));
          return;
        }
        const results = await Promise.allSettled(requestedResources.map((resource) => listElderResource(selectedRow.id as string, resource)));
        if (!active) return;
        const next: Partial<Record<ElderResource, Row[]>> = {};
        const failures: string[] = [];
        results.forEach((result, index) => {
          if (result.status === "fulfilled") next[requestedResources[index]] = result.value.items;
          else failures.push(requestedResources[index]);
        });
        setData((current) => ({ ...current, ...next }));
        if (failures.length) setError(`Some saved information could not load: ${failures.join(", ")}.`);
      } catch (loadError) {
        if (active && getStoredDeviceToken() && loadError instanceof ApiError && loadError.status === 401) {
          device.invalidatePairing();
          return;
        }
        if (active) setError(loadError instanceof ApiError ? loadError.message : loadError instanceof Error ? loadError.message : "Could not load saved care information.");
      } finally { if (active) setIsLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [requestedResources, device.invalidatePairing]);

  const create = useCallback(async (resource: ElderResource, payload: Row) => {
    if (!elderId) throw new Error("Care profile is not ready yet.");
    const created = await createElderResource(elderId, resource, payload);
    setData((current) => ({ ...current, [resource]: [created, ...(current[resource] ?? [])] }));
    return created;
  }, [elderId]);

  const update = useCallback(async (resource: ElderResource, id: string, payload: Row) => {
    if (!elderId) throw new Error("Care profile is not ready yet.");
    const updated = await updateElderResource(elderId, resource, id, payload);
    setData((current) => ({ ...current, [resource]: (current[resource] ?? []).map((item) => String(item.id) === id ? updated : item) }));
    return updated;
  }, [elderId]);

  const remove = useCallback(async (resource: ElderResource, id: string) => {
    if (!elderId) throw new Error("Care profile is not ready yet.");
    await deleteElderResource(elderId, resource, id);
    setData((current) => ({ ...current, [resource]: (current[resource] ?? []).filter((item) => String(item.id) !== id) }));
  }, [elderId]);

  const refresh = useCallback((resource: ElderResource) => elderId ? loadResource(elderId, resource) : Promise.resolve([]), [elderId, loadResource]);

  return { elderId, elder, data, isLoading, error, create, update, remove, refresh };
}
