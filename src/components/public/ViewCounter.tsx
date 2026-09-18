"use client";

import { useEffect, useRef } from "react";

export default function ViewCounter({ articleId }: { articleId: string }) {
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    // Record initial view event
    const referrer = typeof document !== "undefined" ? document.referrer : "";
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articleId,
        referrer,
        device: isMobile ? "MOBILE" : "DESKTOP",
      }),
    }).catch(() => {});

    // On unmount / page leave, send reading duration
    const reportDuration = () => {
      const durationSeconds = Math.round((Date.now() - startTime.current) / 1000);
      if (durationSeconds > 5) {
        navigator.sendBeacon(
          "/api/views/duration",
          JSON.stringify({ articleId, durationSeconds })
        );
      }
    };

    window.addEventListener("beforeunload", reportDuration);
    return () => {
      window.removeEventListener("beforeunload", reportDuration);
      reportDuration();
    };
  }, [articleId]);

  return null;
}

