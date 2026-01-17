"use client";

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title = "Confirmar ação",
  description = "Tem certeza?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  const card =
    "rounded-3xl bg-white/[0.06] ring-1 ring-white/12 shadow-[0_30px_90px_rgba(0,0,0,0.65)] backdrop-blur-xl";
  const btnBase =
    "rounded-xl px-4 py-2 text-sm font-extrabold transition active:scale-[0.99] ring-1";
  const btnCancel =
    btnBase + " bg-white/6 text-white/80 ring-white/10 hover:bg-white/10";
  const btnOk = danger
    ? btnBase +
      " bg-rose-500/12 text-rose-100 ring-rose-400/25 hover:bg-rose-500/16 shadow-[0_0_18px_rgba(244,63,94,0.10)]"
    : btnBase +
      " bg-amber-300/12 text-amber-100 ring-amber-300/25 hover:bg-amber-300/16 shadow-[0_0_18px_rgba(251,191,36,0.10)]";

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={onCancel}
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      {/* modal */}
      <div
        className={"relative w-full max-w-[520px] " + card}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-7">
          <div className="text-xl font-extrabold">{title}</div>
          <div className="mt-2 text-sm text-white/60">{description}</div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              className={btnCancel}
              onClick={onCancel}
              disabled={loading}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={btnOk + (loading ? " opacity-60 cursor-not-allowed" : "")}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Aguarde…" : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
