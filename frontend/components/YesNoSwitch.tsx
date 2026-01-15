"use client";

import React from "react";

type Props = {
  value: boolean;
  onChange: (v: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
  disabled?: boolean;
  className?: string;
};

export default function YesNoSwitch({
  value,
  onChange,
  yesLabel = "Sim",
  noLabel = "Não",
  disabled,
  className = "",
}: Props) {
  const base =
    "inline-flex items-center rounded-2xl border border-white/10 bg-white/5 p-1 " +
    "shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_10px_30px_rgba(0,0,0,0.35)]";

  const btn =
    "min-w-[64px] rounded-xl px-3 py-2 text-xs font-extrabold transition-all active:scale-[0.99]";

  const yesActive =
    "bg-emerald-500/12 text-emerald-100 ring-1 ring-emerald-400/30 " +
    "shadow-[0_0_18px_rgba(16,185,129,0.12)]";

  const noActive =
    "bg-rose-500/12 text-rose-100 ring-1 ring-rose-400/30 " +
    "shadow-[0_0_18px_rgba(244,63,94,0.10)]";

  const inactive =
    "text-white/70 hover:text-white/90 hover:bg-white/5 ring-1 ring-transparent";

  return (
    <div className={[base, disabled ? "opacity-60 pointer-events-none" : "", className].join(" ")}>
      <button
        type="button"
        className={[btn, value ? yesActive : inactive].join(" ")}
        onClick={() => onChange(true)}
        disabled={disabled}
        aria-pressed={value}
      >
        {yesLabel}
      </button>

      <button
        type="button"
        className={[btn, !value ? noActive : inactive].join(" ")}
        onClick={() => onChange(false)}
        disabled={disabled}
        aria-pressed={!value}
      >
        {noLabel}
      </button>
    </div>
  );
}
