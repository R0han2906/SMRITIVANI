import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  createElderResource,
  deleteElderResource,
  getCurrentElderId,
  getElderlyProfiles,
  listElderResource,
  saveCurrentElderId,
  updateElderResource,
  type ElderResource,
} from "../services/api";

export function useElderResource(resource: ElderResource) {
  const [elderId, setElderId] = useState("");
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (id: string) => {
    const result = await listElderResource(id, resource);
    setItems(result.items);
  }, [resource]);

  const refresh = useCallback(async () => {
    if (!elderId) return;
    setError("");
    try { await load(elderId); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not load this care information."); }
  }, [elderId, load]);

  useEffect(() => {
    let active = true;
    async function initialize() {
      setIsLoading(true);
      setError("");
      try {
        let selectedId = getCurrentElderId();
        if (selectedId) {
          try {
            const result = await listElderResource(selectedId, resource);
            if (active) { setElderId(selectedId); setItems(result.items); }
            return;
          } catch (err) {
            if (!(err instanceof ApiError) || err.status !== 404) throw err;
            // The locally selected profile may have been deleted or access revoked.
          }
        }
        const { items: elders } = await getElderlyProfiles();
        const elder = elders.find((row) => row.id === selectedId) ?? elders[0];
        if (!elder || typeof elder.id !== "string") throw new Error("No care profile found. Create one from onboarding first.");
        selectedId = elder.id;
        saveCurrentElderId(selectedId);
        const result = await listElderResource(selectedId, resource);
        if (active) { setElderId(selectedId); setItems(result.items); }
      } catch (err) {
        if (active) setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not load this care information.");
      } finally { if (active) setIsLoading(false); }
    }
    void initialize();
    return () => { active = false; };
  }, [resource]);

  const create = useCallback(async (data: Record<string, unknown>) => {
    if (!elderId) throw new Error("Care profile is not ready yet.");
    const created = await createElderResource(elderId, resource, data);
    setItems((current) => [created, ...current]);
    return created;
  }, [elderId, resource]);

  const update = useCallback(async (id: string, data: Record<string, unknown>) => {
    if (!elderId) throw new Error("Care profile is not ready yet.");
    const updated = await updateElderResource(elderId, resource, id, data);
    setItems((current) => current.map((item) => item.id === id ? updated : item));
    return updated;
  }, [elderId, resource]);

  const remove = useCallback(async (id: string) => {
    if (!elderId) throw new Error("Care profile is not ready yet.");
    await deleteElderResource(elderId, resource, id);
    setItems((current) => current.filter((item) => item.id !== id));
  }, [elderId, resource]);

  return { elderId, items, setItems, isLoading, error, setError, refresh, create, update, remove };
}
