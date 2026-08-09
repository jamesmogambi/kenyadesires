"use client";

import { useEffect, useRef } from "react";

const FLOWERS = ["🌸", "🌺", "🌷", "🌻", "💐", "✨"];

export default function FloatingFlowers() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const flowers: HTMLDivElement[] = [];

    for (let i = 0; i < 40; i++) {
      const el = document.createElement("div");
      el.textContent = FLOWERS[Math.floor(Math.random() * FLOWERS.length)];
      el.style.position = "absolute";
      el.style.left = `${Math.random() * 100}%`;
      el.style.top = `${60 + Math.random() * 40}%`;
      el.style.fontSize = `${1 + Math.random() * 2}rem`;
      el.style.opacity = "0";
      el.style.transition = `all ${2 + Math.random() * 2}s ease-out`;
      el.style.transitionDelay = `${Math.random() * 1.5}s`;
      el.style.transform = `translateY(0) rotate(${Math.random() * 360}deg)`;
      el.style.pointerEvents = "none";
      el.style.zIndex = "0";

      container.appendChild(el);
      flowers.push(el);

      requestAnimationFrame(() => {
        el.style.opacity = "1";
        el.style.transform = `translateY(-${100 + Math.random() * 200}px) rotate(${Math.random() * 720}deg)`;
      });
    }

    return () => {
      flowers.forEach((el) => el.remove());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
    />
  );
}
