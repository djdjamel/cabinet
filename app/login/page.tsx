"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const identifiant = (form.elements.namedItem("identifiant") as HTMLInputElement).value;
    const mot_de_passe = (form.elements.namedItem("mot_de_passe") as HTMLInputElement).value;

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiant, mot_de_passe }),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      const data = await res.json();
      setError(data.error ?? "Erreur de connexion");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex">
      {/* ── Panneau gauche — identité ──────────────────────────────── */}
      <div className="hidden md:flex w-5/12 bg-[#0F1F3D] flex-col justify-between p-12 shrink-0">
        <div>
          <div className="w-8 h-1 bg-status-consultation mb-8" />
          <h1 className="text-4xl font-display font-bold text-white leading-snug">
            File d'attente<br />patients
          </h1>
          <p className="mt-4 text-white/40 text-sm leading-relaxed">
            Système de gestion<br />de la file d'attente médicale
          </p>
        </div>
        <p className="text-white/20 text-xs">
          Accès réservé au personnel autorisé
        </p>
      </div>

      {/* ── Panneau droit — formulaire ─────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-surface p-8">
        <div className="w-full max-w-xs">
          {/* Mobile-only title */}
          <h2 className="md:hidden text-2xl font-display font-bold text-primary mb-8 tracking-tight">
            Connexion
          </h2>

          <p className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-[0.15em] mb-8 hidden md:block">
            Connexion au système
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="identifiant"
                className="block text-xs font-label font-bold text-on-surface-variant uppercase tracking-[0.12em] mb-2"
              >
                Identifiant
              </label>
              <input
                id="identifiant"
                name="identifiant"
                type="text"
                required
                autoFocus
                className="w-full border-0 border-b-2 border-outline-variant bg-transparent px-0 py-2 text-on-surface text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="mot_de_passe"
                className="block text-xs font-label font-bold text-on-surface-variant uppercase tracking-[0.12em] mb-2"
              >
                Mot de passe
              </label>
              <input
                id="mot_de_passe"
                name="mot_de_passe"
                type="password"
                required
                className="w-full border-0 border-b-2 border-outline-variant bg-transparent px-0 py-2 text-on-surface text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-status-absent bg-status-absent/5 border border-status-absent/20 rounded px-3 py-2">
                {error}
              </p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-on-primary font-label font-bold text-xs uppercase tracking-[0.15em] py-3 rounded-sm shadow transition-all"
              >
                {loading ? "Connexion…" : "Se connecter"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
