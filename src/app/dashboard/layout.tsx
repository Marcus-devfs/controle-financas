"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

// Context para compartilhar userId entre componentes
import { createContext, useContext } from "react";

const UserContext = createContext<{ userId: string } | null>(null);

export function useUserId() {
  const context = useContext(UserContext);
  return context?.userId || "";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  // Se não está carregando e não está autenticado, redirecionar
  if (!isLoading && !isAuthenticated) {
    router.replace('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen grid grid-cols-[240px_1fr]">
        <aside className="border-r border-black/10 dark:border-white/10 p-4">
          <div className="h-8 bg-foreground/10 rounded animate-pulse mb-4"></div>
          <div className="h-4 bg-foreground/10 rounded animate-pulse mb-6"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-foreground/10 rounded animate-pulse"></div>
            ))}
          </div>
        </aside>
        <main className="p-6">
          <div className="h-8 bg-foreground/10 rounded animate-pulse mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-foreground/10 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <UserContext.Provider value={{ userId: user.id }}>
      <div className="min-h-screen grid grid-cols-[240px_1fr]">
        <aside className="border-r border-black/10 dark:border-white/10 p-4 space-y-4">
          <div>
            <div className="text-lg font-semibold">Finanças</div>
            <div className="text-xs text-foreground/60">Olá, {user.name}</div>
          </div>
          <nav className="space-y-1">
            <Link className="block px-3 py-2 rounded hover:bg-foreground/5 transition" href="/dashboard">
              Visão geral
            </Link>
            <Link className="block px-3 py-2 rounded hover:bg-foreground/5 transition" href="/dashboard/transacoes">
              Transações
            </Link>
            <Link className="block px-3 py-2 rounded hover:bg-foreground/5 transition" href="/dashboard/cartoes">
              Cartões
            </Link>
            <Link className="block px-3 py-2 rounded hover:bg-foreground/5 transition" href="/dashboard/investimentos">
              Investimentos
            </Link>
            <Link className="block px-3 py-2 rounded hover:bg-foreground/5 transition" href="/dashboard/relatorios">
              Relatórios
            </Link>
          </nav>
          <button 
            onClick={handleLogout}
            className="px-3 py-2 text-left rounded w-full hover:bg-foreground/5 transition"
          >
            Sair
          </button>
        </aside>
        <main className="p-6">{children}</main>
      </div>
    </UserContext.Provider>
  );
}


