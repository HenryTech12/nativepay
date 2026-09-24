import { useEffect, useRef, useState } from "react";

/** Animates 0 → target once the returned ref scrolls into view. Purely
 * decorative (stat sourcing/accuracy lives in the displayed label, not
 * here) — this just makes a static number feel alive on first sight. */
export function useCountUp(target: number, durationMs = 1200) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") { setValue(target); return; }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        function tick(now: number) {
          const progress = Math.min(1, (now - start) / durationMs);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(progress >= 1 ? target : Math.round(target * eased * 100) / 100);
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [target, durationMs]);

  return { ref, value };
}
