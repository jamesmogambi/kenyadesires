"use client";

import { useState, useEffect } from "react";
import { MessageSquare, X } from "lucide-react";

export default function ThunderboltChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  useEffect(() => {
    if (isOpen && !isLoaded) {
      const script = document.createElement("script");
      script.src = "https://www.thunderbolt.com/gateway/api/v1/thunderbolt-ui/embed.js";
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      script.onerror = () => setScriptError(true);
      document.body.appendChild(script);

      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, [isOpen, isLoaded]);

  const openChat = () => {
    setIsOpen(true);
    setTimeout(() => {
      const launcher = document.querySelector('[data-thunderbolt-launcher]') as HTMLElement;
      if (launcher) launcher.click();
    }, 500);
  };

  const closeChat = () => {
    const chatWindow = document.querySelector('.thunderbolt-chat-window, .thunderbolt-popup, [class*="thunderbolt"][style*="fixed"]') as HTMLElement;
    if (chatWindow) {
      const closeBtn = chatWindow.querySelector('[aria-label="Close"], [aria-label="close"], button[class*="close"]') as HTMLElement;
      if (closeBtn) closeBtn.click();
    }
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={isOpen ? closeChat : openChat}
        disabled={isLoaded && isOpen}
        className="fixed bottom-24 right-4 z-[9999] p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h12M8 12l-4 4m4-4l4 4m0-8v8" />
        </svg>
      </button>

      {scriptError && (
        <div className="fixed bottom-16 right-4 z-[9999] bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          Failed to load chat. Please try again later.
        </div>
      )}
    </>
  );
}