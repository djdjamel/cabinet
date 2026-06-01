"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Tableau de bord", icon: <GridIcon /> },
  { href: "/metrics",   label: "Métriques",        icon: <ChartIcon /> },
  { href: "/settings",  label: "Paramètres",        icon: <GearIcon /> },
  { href: "/about",     label: "À propos",          icon: <InfoIcon /> },
];

export function AppSidebar() {
  const path = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-[#0F1F3D] shrink-0">

      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <MedicalCrossIcon />
        <div className="min-w-0">
          <p className="text-white font-display font-bold text-[15px] leading-tight tracking-tight">
            MédiQueue
          </p>
          <p className="text-white/35 text-[10px] font-label uppercase tracking-[0.15em] mt-0.5">
            Cabinet Médical
          </p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Navigation principale">
        {NAV.map(({ href, label, icon }) => {
          const active = path === href || (href !== "/" && path.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-3 rounded-md text-sm font-label font-medium transition-colors",
                active
                  ? "bg-white/10 text-white border-l-2 border-status-consultation px-[10px] py-2.5"
                  : "text-white/60 hover:bg-white/[0.07] hover:text-white/90 px-3 py-2.5",
              ].join(" ")}
            >
              <span className="w-5 h-5 shrink-0 flex items-center justify-center opacity-90">
                {icon}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── Version ── */}
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-white/20 text-[10px] font-label">v1.0 · MédiSoft Algérie</p>
      </div>
    </aside>
  );
}

// ── Icons (inline SVG, no CDN) ────────────────────────────────────────────────

function MedicalCrossIcon() {
  return (
    <div className="w-9 h-9 rounded-lg bg-status-consultation flex items-center justify-center shrink-0">
      <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5" aria-hidden="true">
        <path d="M8 2a1 1 0 00-1 1v4H3a1 1 0 00-1 1v4a1 1 0 001 1h4v4a1 1 0 001 1h4a1 1 0 001-1v-4h4a1 1 0 001-1V8a1 1 0 00-1-1h-4V3a1 1 0 00-1-1H8z" />
      </svg>
    </div>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 7a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm7-7a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zm0 7a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" clipRule="evenodd" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  );
}
