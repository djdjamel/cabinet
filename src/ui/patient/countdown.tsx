"use client";

interface CountdownProps {
  secondes: number;
}

export function Countdown({ secondes }: CountdownProps) {
  const m = Math.floor(secondes / 60).toString().padStart(2, "0");
  const s = (secondes % 60).toString().padStart(2, "0");
  return <span className="font-mono tabular-nums">{m}:{s}</span>;
}
