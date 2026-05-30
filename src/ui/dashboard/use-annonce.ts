"use client";

import { useCallback } from "react";

/**
 * Joue l'annonce vocale d'un numéro : arabe d'abord, puis français.
 * Les fichiers doivent avoir été générés via `npm run gen:audio`.
 */
export function useAnnonce() {
  const jouerAnnonce = useCallback((numero: number) => {
    const ar = new Audio(`/audio/ar/${numero}.mp3`);
    ar.play().catch(() => {/* pas de fichier ou muted → silencieux */});
    ar.onended = () => {
      new Audio(`/audio/fr/${numero}.mp3`).play().catch(() => {});
    };
  }, []);

  return { jouerAnnonce };
}
