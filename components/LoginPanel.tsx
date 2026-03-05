"use client";

import { type FormEvent, useMemo, useState } from "react";
import { Flower2, Heart, LockKeyhole, Sparkles, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function isSafeRedirectPath(path: string | null | undefined): path is string {
  if (!path) {
    return false;
  }
  return path.startsWith("/") && !path.startsWith("//");
}

type LoginPanelProps = {
  nextParam?: string;
};

export function LoginPanel({ nextParam }: LoginPanelProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nextPath = useMemo(() => (isSafeRedirectPath(nextParam) ? nextParam : "/"), [nextParam]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Não foi possível entrar agora.");
      return;
    }

    window.location.assign(nextPath);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#ffdff0] via-[#ffd3e8] to-[#ffc3de] px-4 py-8">
      <div className="pointer-events-none absolute -left-12 top-8 h-36 w-36 rounded-full bg-white/65 blur-2xl" />
      <div className="pointer-events-none absolute right-0 top-32 h-32 w-32 rounded-full bg-[#ff8fbe]/35 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-white/45 blur-2xl" />

      <section className="relative w-full max-w-sm overflow-hidden rounded-[34px] border border-[#f1aeca] bg-[#fff8fc]/92 p-5 shadow-[0_24px_50px_-30px_rgba(230,75,141,0.92)] backdrop-blur md:p-6">
        <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-[#ff97c2]/20" />
        <div className="absolute -left-10 -bottom-10 h-24 w-24 rounded-full bg-[#ffbdd9]/30" />

        <header className="relative text-center">
          <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffe4f1] text-botao shadow-inner">
            <Heart className="h-7 w-7" />
          </span>
          <h1 className="mt-3 text-[1.85rem] font-black tracking-tight text-[#3a1a2b]">Dieta da Jhullya</h1>
          <p className="mt-1 text-sm text-[#7d4b64]">Seu painel pessoal de calorias</p>
          <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#f4c5db] bg-white px-3 py-1 text-xs font-semibold text-botao">
            <Sparkles className="h-3.5 w-3.5" />
            Login delicado e seguro
          </p>
        </header>

        <form className="relative mt-5 space-y-3.5" onSubmit={onSubmit}>
          <label className="block space-y-1.5 text-sm font-semibold text-[#3a1a2b]" htmlFor="username">
            Usuário
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9d6d84]" />
              <Input
                id="username"
                autoComplete="username"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="h-11 rounded-xl border-[#f2b8d2] bg-white pl-9 text-[#3a1a2b] placeholder:text-[#b1869c] focus-visible:ring-botao"
                placeholder="Digite seu usuário"
              />
            </div>
          </label>

          <label className="block space-y-1.5 text-sm font-semibold text-[#3a1a2b]" htmlFor="password">
            Senha
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9d6d84]" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 rounded-xl border-[#f2b8d2] bg-white pl-9 text-[#3a1a2b] placeholder:text-[#b1869c] focus-visible:ring-botao"
                placeholder="Digite sua senha"
              />
            </div>
          </label>

          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p> : null}

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-2xl bg-gradient-to-r from-[#ef5a9f] to-[#dd3f87] text-base font-semibold text-white shadow-[0_10px_20px_-12px_rgba(221,63,135,0.95)] hover:from-[#ec4f98] hover:to-[#ce3479]"
          >
            {loading ? "Entrando..." : "Entrar no painel"}
          </Button>
        </form>

        <footer className="mt-4 space-y-1 text-center">
          <p className="flex items-center justify-center gap-1 text-[11px] font-semibold text-[#9d6d84]">
            <Flower2 className="h-3.5 w-3.5" />
            app pessoal da Jhullya
          </p>
          <p className="animate-love-glow inline-flex items-center justify-center gap-1 text-xs font-semibold text-botao">
            <Heart className="h-3.5 w-3.5 fill-current" />
            feito para o amor da minha vida
          </p>
        </footer>
      </section>
    </main>
  );
}
