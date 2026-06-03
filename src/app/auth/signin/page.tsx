"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";
import { AuthShell, Field } from "@/app/auth/signup/page";

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(params.get("callbackUrl") ?? "/explore");
    router.refresh();
  }

  return (
    <AuthShell title={t.signIn}>
      <form onSubmit={onSubmit} className="space-y-3">
        <Field label="Email" type="email" value={email} onChange={setEmail} required />
        <Field label="Password" type="password" value={password} onChange={setPassword} required />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-rose-600 py-2.5 font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
        >
          {loading ? "…" : t.signIn}
        </button>
      </form>
      <p className="mt-3 rounded-lg bg-neutral-50 p-2 text-center text-xs text-neutral-500 dark:bg-neutral-800">
        Demo: <code>alex@orientroam.com</code> / <code>password123</code>
      </p>
      <p className="mt-4 text-center text-sm text-neutral-500">
        {t.signUp}?{" "}
        <Link href="/auth/signup" className="font-medium text-rose-600 hover:underline">
          {t.signUp}
        </Link>
      </p>
    </AuthShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
