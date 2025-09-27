"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setIsLoading(true);
      await login(email, password);
      router.push("/dashboard");
    } catch (error) {
      console.error("Erro no login:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
          <p className="mt-2 text-sm text-foreground/70">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-black/10 p-6 bg-background">
        <h1 className="text-2xl font-semibold mb-2">Entrar</h1>
        <p className="text-sm text-foreground/70 mb-6">
          Acesse sua conta para gerenciar suas finanças.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-black/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="voce@exemplo.com"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-black/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="Sua senha"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 rounded-md bg-foreground text-background hover:opacity-90 transition disabled:opacity-50"
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <div className="mt-6 text-sm">
          <span className="text-foreground/70">Novo por aqui?</span>{" "}
          <Link className="underline" href="/register">
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}


