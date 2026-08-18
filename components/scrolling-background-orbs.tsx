"use client";

import { useEffect, useRef } from "react";

export function ScrollingBackgroundOrbs() {
  const amberOrbRef = useRef<HTMLDivElement>(null);
  const emeraldOrbRef = useRef<HTMLDivElement>(null);
  const tealOrbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    if (reducedMotionQuery.matches) {
      return;
    }

    let animationFrameId: number | null = null;

    const updateOrbPositions = () => {
      const scrollY = window.scrollY;

      if (amberOrbRef.current) {
        amberOrbRef.current.style.transform = `translate3d(${scrollY * 0.05}px, ${scrollY * 0.26}px, 0)`;
      }

      if (emeraldOrbRef.current) {
        emeraldOrbRef.current.style.transform = `translate3d(${scrollY * 0.1}px, ${scrollY * 0.07}px, 0)`;
      }

      if (tealOrbRef.current) {
        tealOrbRef.current.style.transform = `translate3d(${-scrollY * 0.03}px, ${-scrollY * 0.1}px, 0)`;
      }

      animationFrameId = null;
    };

    const handleScroll = () => {
      if (animationFrameId === null) {
        animationFrameId = window.requestAnimationFrame(updateOrbPositions);
      }
    };

    updateOrbPositions();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none">
      <div
        ref={amberOrbRef}
        className="fixed top-[-20%] lg:top-[-10%] left-[-30%] lg:left-[-4%] -z-10 h-100 w-100 rounded-full bg-amber-400/55 blur-none will-change-transform"
      />
      <div
        ref={emeraldOrbRef}
        className="fixed top-[10%] left-[10%] -z-11 h-160 w-160 rounded-full bg-emerald-500/40 blur-none will-change-transform"
      />
      <div
        ref={tealOrbRef}
        className="fixed top-[10%] left-[-30%] lg:left-[0%] -z-12 h-600 w-600 rounded-full bg-teal-500/60 blur-none will-change-transform"
      />
    </div>
  );
}
