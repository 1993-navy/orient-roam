"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";

export default function SignUpPage() {
  const router = useRouter();
  const { t } = useLang();
  const [form, setForm] = useState({ name: "", email: "", password: "", homeCountry: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    // Auto sign in after signup.
    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Account created — please sign in.");
      router.push("/auth/signin");
      return;
    }
    router.push("/explore");
    router.refresh();
  }

  return (
    <AuthShell title={t.signUp}>
      <form onSubmit={onSubmit} className="space-y-3">
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        <Field label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
        <Field label="Home country (optional)" value={form.homeCountry} onChange={(v) => setForm({ ...form, homeCountry: v })} />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-rose-600 py-2.5 font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
        >
          {loading ? "…" : t.signUp}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-neutral-500">
        {t.signIn}?{" "}
        <Link href="/auth/signin" className="font-medium text-rose-600 hover:underline">
          {t.signIn}
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
        <div className="mb-5 text-center">
          <div className="text-3xl">🧭</div>
          <h1 className="mt-2 text-xl font-bold">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-600 dark:text-neutral-300">
        {label}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        autoCapitalize={type === "email" || type === "password" ? "none" : undefined}
        autoCorrect={type === "email" || type === "password" ? "off" : undefined}
        spellCheck={type === "email" || type === "password" ? false : undefined}
        inputMode={type === "email" ? "email" : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 dark:border-white/15 dark:bg-neutral-950"
      />
    </label>
  );
}
