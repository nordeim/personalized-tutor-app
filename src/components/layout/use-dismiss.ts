"use client";

import { useEffect } from "react";

/* ------------------------------------------------------------------ */
/* useDismissOnOutsideClick — the shared outside-click dismissal.       */
/*                                                                      */
/* Extracted from app-header.tsx in session-6 (S6-F4): the effect was   */
/* triplicated across CoursePill/UserMenu/AppHeader-mobile before       */
/* session-5 inlined it there — and hub-app.tsx still hand-rolled its   */
/* own copy covering BOTH its menus. One module, every dropdown         */
/* consumes it.                                                          */
/*                                                                      */
/* Semantics (unchanged from every prior copy): a document-level        */
/* `mousedown` listener that fires onDismiss whenever the click lands   */
/* OUTSIDE the ref's subtree. Callers pass a memoized onDismiss         */
/* (useCallback) so the listener is not re-subscribed per render.       */
/* ------------------------------------------------------------------ */

export function useDismissOnOutsideClick(
  ref: React.RefObject<HTMLDivElement | null>,
  onDismiss: () => void,
) {
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss();
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [ref, onDismiss]);
}
