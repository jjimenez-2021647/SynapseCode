import { useEffect, useState, useRef } from "react";

export function useCountUp(target, duration = 1200, shouldStart = true) {
  const [value, setValue] = useState(0);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!shouldStart || hasStartedRef.current) return;

    hasStartedRef.current = true;
    let frameId;
    const start = performance.now();
    const tick = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration, shouldStart]);

  return value;
}
