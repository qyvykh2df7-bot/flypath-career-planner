"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MicrophoneStatus = "idle" | "requesting_permission" | "recording" | "stopped" | "unsupported" | "error";

type UseMicrophoneResult = {
  status: MicrophoneStatus;
  error: string | null;
  isSupported: boolean;
  start: () => Promise<MediaStream | null>;
  stop: () => void;
  reset: () => void;
};

function hasGetUserMedia(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

export function useMicrophone(): UseMicrophoneResult {
  const streamRef = useRef<MediaStream | null>(null);
  // Stable initial values that match both server and first client render.
  // Browser-API check deferred to useEffect so SSR and hydration produce identical HTML.
  const [status, setStatus] = useState<MicrophoneStatus>("idle");
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStatus((current) => (current === "unsupported" ? "unsupported" : "stopped"));
  }, []);

  const start = useCallback(async () => {
    if (!hasGetUserMedia()) {
      setStatus("unsupported");
      setError("Microphone access is not supported in this browser yet.");
      return null;
    }

    setStatus("requesting_permission");
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setStatus("recording");
      return stream;
    } catch (err) {
      streamRef.current = null;
      setStatus("error");
      setError(err instanceof Error ? err.message : "Microphone permission was denied.");
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setError(null);
    setStatus(hasGetUserMedia() ? "idle" : "unsupported");
  }, [stop]);

  // Check real browser support after mount so SSR HTML matches first client render.
  useEffect(() => {
    const ok = hasGetUserMedia();
    setIsSupported(ok);
    if (!ok) setStatus("unsupported");
  }, []);

  useEffect(() => stop, [stop]);

  return {
    status,
    error,
    isSupported,
    start,
    stop,
    reset,
  };
}
