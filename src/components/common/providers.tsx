"use client";

import { useEffect } from "react";
import { SWRConfig } from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Fetch error");
  const json = await res.json() as any;
  return json.data ?? json;
};

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("Service Worker registration failed:", err));
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(register, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }

    const id = window.setTimeout(register, 2500);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        dedupingInterval: 10000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
