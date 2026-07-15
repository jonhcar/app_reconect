import { useEffect, useRef } from "react";

// Fileira horizontal que desliza sozinha (vai e volta) e pausa quando a usuária interage
export default function AutoScrollRow({ children, speed = 0.5 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf;
    let paused = false;
    let resumeTimer;
    let dir = 1;
    let pos = el.scrollLeft;

    const step = () => {
      const max = el.scrollWidth - el.clientWidth;
      if (!paused && max > 0) {
        pos += speed * dir;
        if (pos >= max) { pos = max; dir = -1; }
        else if (pos <= 0) { pos = 0; dir = 1; }
        el.scrollLeft = pos;
      } else {
        pos = el.scrollLeft; // acompanha o scroll manual
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    const pause = () => {
      paused = true;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { paused = false; }, 4000);
    };
    el.addEventListener("pointerdown", pause);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("wheel", pause, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resumeTimer);
      el.removeEventListener("pointerdown", pause);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("wheel", pause);
    };
  }, [speed]);

  return (
    <div ref={ref} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
      {children}
    </div>
  );
}
