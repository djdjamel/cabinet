"use client";

import { usePatientState } from "./use-patient-state";
import { Countdown } from "./countdown";

interface PatientViewProps {
  jeton: string;
}

export function PatientView({ jeton }: PatientViewProps) {
  const { state, status, graceSecondes } = usePatientState(jeton);

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <p className="text-on-surface-variant text-sm">Chargement… / جار التحميل…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 gap-4">
      {/* Bandeau hors-ligne */}
      {status !== "connected" && (
        <div className="w-full max-w-sm bg-status-waitlist/10 border border-status-waitlist/30 text-status-waitlist text-sm rounded px-4 py-2 text-center font-label font-bold">
          Reconnexion… / جار إعادة الاتصال…
        </div>
      )}

      {/* Bandeau "C'est à vous" */}
      {state.etat === "appele" && (
        <div className="w-full max-w-sm bg-status-consultation text-on-primary rounded-lg px-6 py-4 text-center shadow-md">
          <p className="text-2xl font-bold">🔔 C'est à vous !</p>
          <p dir="rtl" className="text-2xl font-bold mt-1">حان دورك!</p>
        </div>
      )}

      {/* Bandeau absent + chrono */}
      {state.etat === "absent" && (
        <div className="w-full max-w-sm bg-status-absent text-on-primary rounded-lg px-6 py-4 text-center shadow-md">
          {/* Français LTR */}
          <div dir="ltr">
            <p className="font-semibold">Présentez-vous dans :</p>
            <p className="text-3xl font-mono font-bold mt-1">
              {graceSecondes !== null ? <Countdown secondes={graceSecondes} /> : "–"}
            </p>
            <p className="text-sm mt-1 opacity-90">sinon réenregistrement obligatoire</p>
          </div>
          {/* Arabe RTL */}
          <div dir="rtl" className="mt-3 border-t border-white/30 pt-3">
            <p className="font-semibold">تقدم خلال:</p>
            <p className="text-3xl font-mono font-bold mt-1">
              {graceSecondes !== null ? <Countdown secondes={graceSecondes} /> : "–"}
            </p>
            <p className="text-sm mt-1 opacity-90">وإلا يجب إعادة التسجيل</p>
          </div>
        </div>
      )}

      {/* Bandeau délai expiré */}
      {state.etat === "expire" && (
        <div className="w-full max-w-sm bg-error/10 border border-error/20 rounded-lg px-6 py-4 text-center">
          <p dir="ltr" className="text-error font-medium">Délai expiré — Présentez-vous à l'accueil pour vous réenregistrer.</p>
          <p dir="rtl" className="text-error font-medium mt-2">انتهى وقتك — تقدم للاستقبال لإعادة التسجيل.</p>
        </div>
      )}

      {/* Bandeau terminé / annulé */}
      {["termine", "annule"].includes(state.etat) && (
        <div className="w-full max-w-sm bg-surface-container rounded-lg px-6 py-4 text-center">
          <p dir="ltr" className="text-on-surface-variant font-medium">Consultation terminée</p>
          <p dir="rtl" className="text-on-surface-variant font-medium mt-1">انتهت الاستشارة</p>
        </div>
      )}

      {/* Carte principale */}
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-outline-variant/30 p-6 space-y-5">

        {/* Numéro du patient — bilingue */}
        <div className="text-center">
          <div dir="ltr" className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-[0.1em]">Votre numéro</div>
          <div dir="rtl" className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-[0.1em]">رقمك</div>
          <div className="text-6xl font-display font-bold text-primary tabular-nums mt-1">
            {state.mon_numero}
          </div>
        </div>

        <hr className="border-outline-variant/30" />

        {/* Infos file */}
        <div className="space-y-3">
          {/* Numéro en cours */}
          <Row
            labelFr="En cours"
            labelAr="الجاري"
            value={state.numero_en_cours !== null ? String(state.numero_en_cours) : "–"}
          />

          {/* Personnes devant */}
          <Row
            labelFr="Devant vous"
            labelAr="أمامك"
            value={String(state.personnes_devant)}
          />

          {/* Estimation */}
          {state.etat === "en_attente" && (
            <Row
              labelFr="Attente estimée"
              labelAr="وقت الانتظار"
              value={`≈ ${state.attente_estimee_min[0]}–${state.attente_estimee_min[1]} min`}
            />
          )}
        </div>

        {/* Mise à jour auto */}
        <p className="text-xs text-center text-on-surface-variant/60">
          ● Mise à jour automatique / تحديث تلقائي
        </p>
      </div>
    </div>
  );
}

// ─── Sous-composant ligne bilingue ───────────────────────────────────────────

function Row({
  labelFr,
  labelAr,
  value,
}: {
  labelFr: string;
  labelAr: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span dir="ltr" className="text-sm text-on-surface-variant block">{labelFr}</span>
        <span dir="rtl" className="text-xs text-on-surface-variant/70 block">{labelAr}</span>
      </div>
      <span className="text-xl font-display font-bold text-on-surface tabular-nums">{value}</span>
    </div>
  );
}
