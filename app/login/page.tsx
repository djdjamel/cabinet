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
    <main className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-outline-variant/40 p-8">
        <h1 className="text-2xl font-display font-bold text-center mb-6 text-primary tracking-tight">
          Connexion
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="identifiant" className="block text-xs font-label font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-1.5">
              Identifiant
            </label>
            <input
              id="identifiant"
              name="identifiant"
              type="text"
              required
              autoFocus
              className="w-full border border-outline-variant rounded px-3 py-2.5 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="mot_de_passe" className="block text-xs font-label font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-1.5">
              Mot de passe
            </label>
            <input
              id="mot_de_passe"
              name="mot_de_passe"
              type="password"
              required
              className="w-full border border-outline-variant rounded px-3 py-2.5 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
          </div>

          {error && (
            <p className="text-sm text-error bg-error/5 border border-error/20 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-on-primary font-label font-bold text-xs uppercase tracking-widest py-2.5 rounded shadow-sm transition-all"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}
