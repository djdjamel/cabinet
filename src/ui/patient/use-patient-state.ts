"use client";

import { useState, useEffect, useCallback } from "react";

export interface PatientState {
  mon_numero: number;
  numero_en_cours: number | null;
  personnes_devant: number;
  etat: string;
  attente_estimee_min: [number, number];
  grace_restante_sec: number | null;
  nom: string | null;
}

export type ConnectionStatus = "connected" | "reconnecting" | "error";

export function usePatientState(jeton: string, pollInterval = 5000) {
  const [state, setState] = useState<PatientState | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connected");
  const [graceSecondes, setGraceSecondes] = useState<number | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/file/${jeton}`, { cache: "no-store" });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const data: PatientState = await res.json();
      setState(data);
      setStatus("connected");
      // Initialise le compte à rebours depuis la valeur serveur
      if (data.grace_restante_sec !== null) {
        setGraceSecondes(data.grace_restante_sec);
      }
    } catch {
      setStatus("reconnecting");
    }
  }, [jeton]);

  // Polling principal
  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, pollInterval);
    return () => clearInterval(id);
  }, [fetchState, pollInterval]);

  // Décompte local du chrono de grâce entre les polls
  useEffect(() => {
    if (graceSecondes === null || graceSecondes <= 0) return;
    const id = setInterval(() => {
      setGraceSecondes((s) => (s !== null && s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [graceSecondes]);

  return { state, status, graceSecondes };
}
