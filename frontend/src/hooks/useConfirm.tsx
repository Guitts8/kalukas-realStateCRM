"use client";

import { useCallback, useState } from "react";
import ConfirmModal from "@/components/ConfirmModal";

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({});
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    setOpts(options);
    setOpen(true);
    return new Promise<boolean>((resolve) => setResolver(() => resolve));
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
    resolver?.(false);
    setResolver(null);
  }, [resolver]);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    resolver?.(true);
    setResolver(null);
  }, [resolver]);

  const ConfirmUI = (
    <ConfirmModal
      open={open}
      title={opts.title}
      description={opts.description}
      confirmText={opts.confirmText}
      cancelText={opts.cancelText}
      danger={opts.danger}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
    />
  );

  return { confirm, ConfirmUI };
}
