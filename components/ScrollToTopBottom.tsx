"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

export default function ScrollToTopBottom() {
  const [show, setShow] = useState(false);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const scrollPosition = scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const nearBottom = scrollPosition >= documentHeight - 80;

      setShow(scrollY > 400);
      setAtBottom(nearBottom);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const scrollToTarget = () => {
    if (atBottom) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  if (!show) return null;

  return (
    <button
      type="button"
      onClick={scrollToTarget}
      aria-label={atBottom ? "Scroll to top" : "Scroll to bottom"}
      className="fixed bottom-6 left-6 z-[10000] flex h-12 w-12 items-center justify-center rounded-full bg-pink-600 text-white shadow-xl transition-all duration-300 hover:bg-pink-700 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-black animate-in fade-in slide-in-from-bottom-4"
    >
      <span className="transition-transform duration-300 ease-in-out">
        {atBottom ? (
          <ArrowUp size={22} className="-translate-y-0.5" />
        ) : (
          <ArrowDown size={22} className="translate-y-0.5" />
        )}
      </span>
    </button>
  );
}
