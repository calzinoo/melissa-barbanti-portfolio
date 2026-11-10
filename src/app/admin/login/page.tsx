import { Suspense } from "react";
import LoginForm from "@/components/admin/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-fg font-serif text-2xl font-semibold text-accent">
          m.
        </div>
        <h1 className="font-serif text-3xl font-semibold leading-tight">
          Accesso Area Pittrice
        </h1>
        <p className="mt-1 text-sm text-muted">Melissa Barbanti</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
