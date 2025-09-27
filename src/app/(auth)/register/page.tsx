"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError("Todos os campos são obrigatórios");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      await register(name, email, password);
      router.push("/dashboard");
    } catch (error: any) {
      setError(error.message || "Erro ao criar conta");
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
        <h1 className="text-2xl font-semibold mb-2">Criar conta</h1>
        <p className="text-sm text-foreground/70 mb-6">
          Comece a controlar suas finanças em poucos cliques.
        </p>
        
        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-black/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="Seu nome"
            />
          </div>
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
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm">Confirmar senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-md border border-black/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="Digite a senha novamente"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 rounded-md bg-foreground text-background hover:opacity-90 transition disabled:opacity-50"
          >
            {isLoading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>
        <div className="mt-6 text-sm">
          <span className="text-foreground/70">Já tem conta?</span>{" "}
          <Link className="underline" href="/login">
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}


