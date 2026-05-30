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
        },
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Chargement…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto p-6 space-y-6">

        {/* En-tête */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="cursor-pointer text-sm text-gray-500 hover:text-gray-700"
          >
            ← Tableau de bord
          </button>
          <h1 className="text-lg font-bold text-gray-800">Paramètres</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">

          {/* Nom du cabinet */}
          <Field label="Nom du cabinet">
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>

          {/* Modules */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700">Modules optionnels</p>

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
            className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition"
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
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
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
          checked ? "bg-blue-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}
