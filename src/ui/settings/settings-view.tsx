"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface CabinetData {
  nom: string;
  params: Record<string, unknown>;
}

export function SettingsView() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [nom, setNom] = useState("");
  const [duree, setDuree] = useState(15);
  const [annonce, setAnnonce] = useState(false);
  const [ecran, setEcran] = useState(false);
  const [metriques, setMetriques] = useState(false);
  const [afficherNom, setAfficherNom] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/cabinet")
      .then((r) => r.json())
      .then((data: CabinetData) => {
        setNom(data.nom);
        const p = data.params ?? {};
        setDuree((p.duree_moyenne_min as number) ?? 15);
        setAnnonce((p.annonce_vocale as boolean) ?? false);
        setEcran((p.ecran_salle as boolean) ?? false);
        setMetriques((p.metriques as boolean) ?? false);
        setAfficherNom((p.afficher_nom as boolean) ?? false);
        setLoaded(true);
      });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/cabinet", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom,
        params: {
          duree_moyenne_min: duree,
          annonce_vocale: annonce,
          ecran_salle: ecran,
          metriques,
          afficher_nom: afficherNom,
        },
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-on-surface-variant bg-surface">
        Chargement…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-lg mx-auto px-6 py-8 space-y-6">

        {/* En-tête */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="cursor-pointer text-sm text-on-surface-variant hover:text-primary font-label font-semibold transition-colors"
          >
            ← Tableau de bord
          </button>
          <h1 className="text-2xl font-display font-bold text-on-surface tracking-tight">Paramètres</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-outline-variant/40 rounded-lg shadow-sm p-6 space-y-6">

          {/* Nom du cabinet */}
          <Field label="Nom du cabinet">
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              className="w-full border border-outline-variant rounded px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
          </Field>

          {/* Durée consultation */}
          <Field label="Durée moyenne de consultation (min)">
            <input
              type="number"
              min={1}
              max={120}
              value={duree}
              onChange={(e) => setDuree(Math.max(1, Number(e.target.value)))}
              className="w-28 border border-outline-variant rounded px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
          </Field>

          {/* Modules */}
          <div className="space-y-4">
            <p className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-[0.1em]">Modules optionnels</p>

            <Toggle
              label="Afficher les noms des patients"
              description="Affiche le nom à droite de la durée dans la file d'attente"
              checked={afficherNom}
              onChange={setAfficherNom}
            />
            <Toggle
              label="Annonces vocales"
              description="Lecture audio AR→FR à chaque appel (fichiers requis : npm run gen:audio)"
              checked={annonce}
              onChange={setAnnonce}
            />
            <Toggle
              label="Écran de salle"
              description="Affiche le numéro en cours sur /salle/[id] (TV de salle d'attente)"
              checked={ecran}
              onChange={setEcran}
            />
            <Toggle
              label="Métriques du jour"
              description="Statistiques en haut du tableau de bord"
              checked={metriques}
              onChange={setMetriques}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-on-primary font-label font-bold text-xs uppercase tracking-widest py-2.5 rounded shadow-sm transition-all"
          >
            {saved ? "✓ Enregistré" : saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-label font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={`cursor-pointer relative shrink-0 w-10 h-6 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-surface-container-high"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
      <div>
        <p className="text-sm font-medium text-on-surface">{label}</p>
        <p className="text-xs text-on-surface-variant">{description}</p>
      </div>
    </div>
  );
}
