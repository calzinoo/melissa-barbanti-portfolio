"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { ActionResult } from "@/app/admin/content-actions";

type Props = { action: () => Promise<ActionResult>; confirmMessage: string };

export default function DeleteButton({ action, confirmMessage }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onClick() {
    if (!window.confirm(confirmMessage)) return;
    start(async () => {
      const res = await action();
      if (!res.ok) window.alert(Object.values(res.errors)[0] ?? "Eliminazione non riuscita");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex h-11 items-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 size={16} />
      {pending ? "Elimino…" : "Elimina"}
    </button>
  );
}
