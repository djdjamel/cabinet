"use client";

import { useState, useEffect, useCallback } from "react";
import type { TicketVue, FileVue } from "@application/tickets/obtenir-file";
import type { CabinetParams } from "@infrastructure/prisma/cabinet-repository";

export type { TicketVue };

export interface DashboardState extends FileVue {
  params: CabinetParams;
  nom: string;
}

export type ConnectionStatus = "connected" | "reconnecting";

export function useDashboard(pollInterval = 4000) {
  const [state, setState] = useState<DashboardState | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connected");

  const fetchFile = useCallback(async () => {
    try {
      const res = await fetch("/api/tickets", { cache: "no-store" });
      if (res.ok) {
        setState(await res.json());
        setStatus("connected");
      }
    } catch {
      setStatus("reconnecting");
    }
  }, []);

  useEffect(() => {
    fetchFile();
    const id = setInterval(fetchFile, pollInterval);
    return () => clearInterval(id);
  }, [fetchFile, pollInterval]);

  async function action(
    id: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await fetchFile();
  }

  async function creerTicket(type: string, nom?: string) {
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, nom }),
    });
    const data = await res.json();
    await fetchFile();
    return data as { numero: number; jetonUrl: string; qr: string };
  }

  async function cloturerJournee(date: string) {
    await fetch("/api/queue/close-day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    await fetchFile();
  }

  async function moveTickets(id1: string, ordre1: number, id2: string, ordre2: number) {
    await Promise.all([
      fetch(`/api/tickets/${id1}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ordre: ordre1 }) }),
      fetch(`/api/tickets/${id2}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ordre: ordre2 }) }),
    ]);
    await fetchFile();
  }

  async function suivant() {
    await fetch("/api/flow/next", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    await fetchFile();
  }

  return { state, status, action, creerTicket, cloturerJournee, moveTickets, suivant };
}
