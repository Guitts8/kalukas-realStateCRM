"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Option = {
  value: string;
  label: string;
  disabled?: boolean;
};

type Props = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;

  /** ✅ Se true, mostra input de busca */
  searchable?: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function GlassSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Selecione…",
  disabled,
  className,
  searchable = false,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [openUp, setOpenUp] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = !searchable || !q
      ? options
      : options.filter((o) => o.label.toLowerCase().includes(q));
    return list;
  }, [options, query, searchable]);

  function close() {
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
  }

  function openMenu() {
    if (disabled) return;
    setOpen(true);
  }

  // ✅ Detecta se abre para cima quando perto do rodapé
  useEffect(() => {
    if (!open) return;

    const calc = () => {
      const btn = btnRef.current;
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const viewportH = window.innerHeight || 0;

      // espaço disponível
      const spaceBelow = viewportH - rect.bottom;
      const spaceAbove = rect.top;

      // estimativa de altura do menu
      const estimatedMenuH =
        (searchable ? 52 : 0) + clamp(filtered.length, 1, 7) * 44 + 8;

      const shouldOpenUp =
        spaceBelow < estimatedMenuH && spaceAbove > spaceBelow;

      setOpenUp(shouldOpenUp);
    };

    calc();
    window.addEventListener("resize", calc);
    window.addEventListener("scroll", calc, true);
    return () => {
      window.removeEventListener("resize", calc);
      window.removeEventListener("scroll", calc, true);
    };
  }, [open, filtered.length, searchable]);

  // ✅ Foco no search quando abrir (se searchable)
  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => {
      if (searchable) searchRef.current?.focus();
    }, 0);

    // define activeIndex inicial
    const idx = filtered.findIndex((o) => o.value === value && !o.disabled);
    setActiveIndex(idx >= 0 ? idx : filtered.findIndex((o) => !o.disabled));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ✅ Fecha ao clicar fora
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (!open) return;

      if (e.key === "Escape") {
        e.preventDefault();
        close();
        btnRef.current?.focus();
        return;
      }

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();

        if (!filtered.length) return;

        const step = e.key === "ArrowDown" ? 1 : -1;

        let next = activeIndex;
        for (let tries = 0; tries < filtered.length; tries++) {
          next = next === -1 ? 0 : next + step;
          if (next < 0) next = filtered.length - 1;
          if (next >= filtered.length) next = 0;

          if (!filtered[next]?.disabled) {
            setActiveIndex(next);

            // scroll item into view
            const menu = menuRef.current;
            if (menu) {
              const el = menu.querySelector(`[data-idx="${next}"]`) as HTMLElement | null;
              el?.scrollIntoView({ block: "nearest" });
            }
            break;
          }
        }
        return;
      }

      if (e.key === "Enter") {
        // se estiver digitando no input, Enter deve escolher
        if (!filtered.length) return;

        const opt = filtered[activeIndex];
        if (!opt || opt.disabled) return;

        e.preventDefault();
        onChange(opt.value);
        close();
        btnRef.current?.focus();
        return;
      }
    }

    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, filtered, activeIndex, onChange]);

  function choose(v: string) {
    onChange(v);
    close();
    btnRef.current?.focus();
  }

  const base =
    "w-full rounded-xl bg-white/5 ring-1 ring-white/10 px-4 py-3 text-sm text-white/90 " +
    "outline-none transition focus:ring-white/20 focus:bg-white/[0.07]";

  const menuBase =
    "absolute left-0 right-0 z-50 overflow-hidden rounded-2xl " +
    "bg-zinc-950/75 backdrop-blur-xl ring-1 ring-white/12 " +
    "shadow-[0_18px_70px_rgba(0,0,0,0.65)]";

  const itemBase =
    "w-full text-left px-4 py-3 text-sm font-semibold transition flex items-center justify-between gap-3";

  return (
    <div ref={wrapRef} className={["relative", className].join(" ")}>
      {label ? (
        <div className="mb-2 text-[11px] font-black tracking-widest text-white/50">
          {label}
        </div>
      ) : null}

      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
        className={[
          base,
          "flex items-center justify-between gap-3",
          disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-white/6",
        ].join(" ")}
      >
        <span className={selected ? "text-white/90" : "text-white/40"}>
          {selected ? selected.label : placeholder}
        </span>

        <span
          className={[
            "inline-flex h-8 w-8 items-center justify-center rounded-lg",
            "bg-white/6 ring-1 ring-white/10",
          ].join(" ")}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            className={[
              "h-4 w-4 transition",
              open ? (openUp ? "rotate-0" : "rotate-180") : "rotate-0",
              open ? "text-amber-200" : "text-white/70",
            ].join(" ")}
            fill="none"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open ? (
        <div
          className={[
            menuBase,
            openUp ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]",
          ].join(" ")}
        >
          {searchable ? (
            <div className="p-3 border-b border-white/10">
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar…"
                className={[
                  "w-full rounded-xl bg-white/6 ring-1 ring-white/10 px-4 py-2 text-sm text-white/90",
                  "placeholder:text-white/30 outline-none focus:ring-white/20",
                ].join(" ")}
              />
              <div className="mt-2 text-[11px] text-white/35">
                ↑ ↓ navega • Enter seleciona • Esc fecha
              </div>
            </div>
          ) : (
            <div className="px-4 py-3 text-[11px] text-white/35 border-b border-white/10">
              ↑ ↓ navega • Enter seleciona • Esc fecha
            </div>
          )}

          <div
            ref={menuRef}
            className="max-h-[280px] overflow-auto"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {filtered.length === 0 ? (
              <div className="px-4 py-4 text-sm text-white/50">
                Nenhum resultado.
              </div>
            ) : (
              filtered.map((o, idx) => {
                const isActive = idx === activeIndex;
                const isSelected = o.value === value;

                return (
                  <button
                    key={o.value + idx}
                    type="button"
                    data-idx={idx}
                    disabled={o.disabled}
                    onMouseEnter={() => !o.disabled && setActiveIndex(idx)}
                    onClick={() => !o.disabled && choose(o.value)}
                    className={[
                      itemBase,
                      o.disabled ? "opacity-40 cursor-not-allowed" : "",
                      isActive ? "bg-white/8" : "bg-transparent",
                      isSelected
                        ? "text-amber-100 ring-1 ring-amber-300/15"
                        : "text-white/80",
                      "hover:bg-white/8",
                    ].join(" ")}
                  >
                    <span className="truncate">{o.label}</span>

                    {isSelected ? (
                      <span className="text-amber-200 text-xs font-black">✓</span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
