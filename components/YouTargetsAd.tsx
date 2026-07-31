"use client";
import React, { useEffect } from "react";

const YouTargetsAd: React.FC = () => {
  useEffect(() => {
    const loadAd = () => {
      const script = document.createElement("script");
      script.innerHTML = `!function(w,d,s,o,f,js,fjs){w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};w[o].q=w[o].q||[];js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];js.async=1;js.src=f;fjs.parentNode.insertBefore(js,fjs)}(window,document,'script','ytrgt','https://static.servestatic.net/js/ytrgt.js');ytrgt('hb:load', '#ytrgt-227fd62cc6a049e09bb3b4bddf0cd1ab', {"endpoint": "https://collect.rtb.events/hb", "publisherId": "227fd62cc6a049e09bb3b4bddf0cd1ab", "sizes": [[300, 250]], "video": {"mimes": ["video/mp4"], "protocols": [2, 3, 5, 6]}, "videoOptions": {"muted": "auto", "skipDelay": 5}, "tmax": 1000, "showAdMark": true});`;
      const container = document.getElementById(
        "ytrgt-227fd62cc6a049e09bb3b4bddf0cd1ab",
      );
      if (container) {
        container.appendChild(script);
      }
    };

    const cleanup = () => {
      const container = document.getElementById(
        "ytrgt-227fd62cc6a049e09bb3b4bddf0cd1ab",
      );
      if (container) {
        container.innerHTML = "";
      }
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(loadAd);
      return () => {
        window.cancelIdleCallback(idleId);
        cleanup();
      };
    } else {
      const timeoutId = setTimeout(loadAd, 2000);
      return () => {
        clearTimeout(timeoutId);
        cleanup();
      };
    }
  }, []);

  return (
    <div
      id="ytrgt-227fd62cc6a049e09bb3b4bddf0cd1ab"
      className="w-full flex justify-center py-6"
    />
  );
};

export default YouTargetsAd;
