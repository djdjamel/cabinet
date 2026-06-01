export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-2xl mx-auto px-8 py-8 space-y-8">

        <div>
          <h1 className="text-2xl font-display font-bold text-on-surface mb-1">À propos de MédiQueue</h1>
          <p className="text-sm text-on-surface-variant">Système de gestion de file d'attente médicale</p>
        </div>

        <p className="text-sm text-on-surface-variant leading-relaxed">
          MédiQueue est un système de gestion de file d'attente conçu pour les cabinets médicaux et
          les cliniques. Il optimise l'accueil des patients, réduit les temps d'attente et fournit
          des métriques en temps réel pour le suivi de la performance. La solution fonctionne
          entièrement hors ligne et ne nécessite aucune connexion externe.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <InfoBlock label="Éditeur"    value="MédiSoft Solutions, Algérie" />
          <InfoBlock label="Version"    value="1.0.0" />
          <InfoBlock label="Support"    value="support@medisoft-dz.com" />
          <InfoBlock label="Téléphone"  value="+213 (0) 21 43 56 78" />
          <InfoBlock label="Adresse"    value="5, Rue des Cliniques, Alger-Centre" />
          <InfoBlock label="Site web"   value="www.medisoft-dz.com" />
        </div>

        <div className="border-t border-outline-variant/40 pt-6">
          <p className="text-xs text-on-surface-variant/50">
            © 2026 MédiSoft Algérie — Tous droits réservés.
            Ce logiciel est destiné à un usage interne dans les structures de soins.
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-outline-variant/40 rounded-lg px-4 py-3">
      <p className="text-[10px] font-label font-bold text-on-surface-variant/60 uppercase tracking-[0.12em] mb-1">{label}</p>
      <p className="text-sm font-label text-on-surface">{value}</p>
    </div>
  );
}
