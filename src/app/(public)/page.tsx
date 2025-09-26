"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
          <p className="mt-2 text-sm text-foreground/70">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center p-8">
      <div className="text-center max-w-xl">
        <h1 className="text-3xl font-semibold mb-2">Seu painel financeiro</h1>
        <p className="text-foreground/70 mb-6">
          Organize suas receitas, despesas, cartões e investimentos em um só lugar.
        </p>
        <div className="flex items-center justify-center gap-3">
          {isAuthenticated ? (
            <Link className="px-4 h-10 rounded-md bg-foreground text-background grid place-items-center" href="/dashboard">
              Ir para o dashboard
            </Link>
          ) : (
            <>
              <Link className="px-4 h-10 rounded-md bg-foreground text-background grid place-items-center" href="/login">
                Entrar
              </Link>
              <Link className="px-4 h-10 rounded-md border border-black/10 dark:border-white/10 grid place-items-center" href="/register">
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


