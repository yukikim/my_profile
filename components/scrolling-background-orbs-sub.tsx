"use client";

import { useEffect, useRef } from "react";

export function ScrollingBackgroundOrbsSub() {
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
        amberOrbRef.current.style.transform = `translate3d(${scrollY * 0.4}px, ${scrollY * 0.5}px, ${scrollY * 0.3}px)`;
        amberOrbRef.current.style.filter = `blur(${scrollY * 0.003}px)`;
      }

      if (emeraldOrbRef.current) {
        emeraldOrbRef.current.style.transform = `translate3d(${scrollY * 0.4}px, ${scrollY * 0.07}px, ${scrollY * 0.3}px)`;
        emeraldOrbRef.current.style.filter = `blur(${scrollY * 0.005}px)`;
      }

      if (tealOrbRef.current) {
        tealOrbRef.current.style.transform = `translate3d(${-scrollY * 0.03}px, ${-scrollY * 0.1}px, ${-scrollY * 2.5}px)`;
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
    <div aria-hidden="true" className="pointer-events-none fixed perspective-midrange -z-9 left-[-4%] top-[-3%]">
      <div
        ref={amberOrbRef}
        className="fixed top-[-20%] lg:top-[-10%] left-[-30%] lg:left-[-4%] -z-10 h-100 w-100 rounded-full bg-amber-400/20 blur-none will-change-transform"
      />
      <div
        ref={emeraldOrbRef}
        className="fixed top-[10%] left-[10%] -z-11 h-160 w-160 rounded-full bg-emerald-500/16 blur-none will-change-transform"
      />
      <div
        ref={tealOrbRef}
        className="fixed top-[10%] left-[-30%] lg:left-[0%] -z-12 h-600 w-600 rounded-full bg-teal-500/10 blur-none will-change-transform"
      />
    </div>
  );
}
