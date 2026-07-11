"use client";

import { useCallback, useEffect, useState } from "react";
import {
  flipQaPremiumMode,
  getInitialQaPremiumMode,
  QA_PREMIUM_MODE_STORAGE_KEY,
  setQaPremiumModeInStorage,
  type QaPremiumMode,
} from "@/lib/qaPremiumMode";

/**
 * Estado QA premium hidratado de forma SSR-safe.
 *
 * `qaPremiumMode` arranca con un valor constante (igual al fallback de
 * `getInitialQaPremiumMode()` cuando `window` no existe) para que el HTML del
 * servidor coincida con el primer render del cliente y no haya hydration
 * mismatch en el botón flotante. Tras el mount, el efecto sincroniza el
 * estado con `localStorage`.
 *
 * `hydrated` indica si ya leímos `localStorage`; los consumidores (la barra
 * flotante) lo usan para no renderizar UI dependiente del modo hasta entonces.
 */
export function useQaPremiumMode(): {
  qaPremiumMode: QaPremiumMode;
  toggleQaPremium: () => void;
  hydrated: boolean;
} {
  const [qaPremiumMode, setQaPremiumMode] = useState<QaPremiumMode>("premium");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setQaPremiumMode(getInitialQaPremiumMode());
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== null && e.key !== QA_PREMIUM_MODE_STORAGE_KEY) return;
      setQaPremiumMode(getInitialQaPremiumMode());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleQaPremium = useCallback(() => {
    setQaPremiumMode((prev) => {
      const next = flipQaPremiumMode(prev);
      setQaPremiumModeInStorage(next);
      return next;
    });
  }, []);

  return { qaPremiumMode, toggleQaPremium, hydrated };
}
