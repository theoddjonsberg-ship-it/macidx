import { useEffect, useRef, useState } from "react";

const WARNING_MS = 25 * 60 * 1000;
const SIGNOUT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"];

interface Options {
  enabled: boolean;
  onSignOut: () => void;
}

export function useIdleTimeout({ enabled, onSignOut }: Options) {
  const [warning, setWarning] = useState(false);
  const lastActivity = useRef(Date.now());
  const warnTimer = useRef<number | undefined>(undefined);
  const outTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

    const reset = () => {
      lastActivity.current = Date.now();
      setWarning(false);
      if (warnTimer.current) window.clearTimeout(warnTimer.current);
      if (outTimer.current) window.clearTimeout(outTimer.current);
      warnTimer.current = window.setTimeout(() => setWarning(true), WARNING_MS);
      outTimer.current = window.setTimeout(onSignOut, SIGNOUT_MS);
    };

    reset();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, reset));
      if (warnTimer.current) window.clearTimeout(warnTimer.current);
      if (outTimer.current) window.clearTimeout(outTimer.current);
    };
  }, [enabled, onSignOut]);

  return { warning };
}
