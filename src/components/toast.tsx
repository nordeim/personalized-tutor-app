"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

// Lightweight toast system matching the reference's shadcn/Sonner placement
// (mobile: full-width top; sm+: bottom-right, max-w 420px) — INCLUDING the
// mobile-nav fix: the container is pointer-events-none and only the visible
// toasts are interactive, so an empty toaster can never cover the header's
// hamburger button (the live app's actual bug — see globals.css).

export type Toast = {
  id: number;
  title: string;
  description?: string;
};

type ToastContextValue = {
  toast: (t: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 5000);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-label="Notifications"
        role="region"
        aria-live="polite"
        // Sonner-compatible placement; pointer-events-none is THE fix —
        // only toasts themselves are clickable.
        className="pointer-events-none fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto mb-2 w-full rounded-[16px] bg-white px-4 py-3 shadow-xl",
            )}
          >
            <p className="text-sm font-medium text-slate-900">{t.title}</p>
            {t.description ? (
              <p className="mt-0.5 text-xs text-slate-500">{t.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
