"use client";

import { useEffect } from "react";

/** Déclenche window.print() automatiquement après le chargement. */
export function AutoPrint() {
  useEffect(() => {
    // Petit délai pour laisser le navigateur rendre le contenu
    const id = setTimeout(() => window.print(), 400);
    return () => clearTimeout(id);
  }, []);

  return null;
}
