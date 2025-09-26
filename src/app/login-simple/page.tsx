"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function LoginSimplePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setIsLoading(true);
      await login(email, password);
      // Redirecionar para dashboard após login bem-sucedido
      window.location.href = '/dashboard';
    } catch (error) {
      console.error("Erro no login:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMockLogin = () => {
    // Login mock para testar sem API
    const mockUser = {
      id: "test-user",
      name: "Usuário Teste",
      email: "teste@exemplo.com"
    };
    
    localStorage.setItem('auth_token', 'mock-token');
    localStorage.setItem('user_data', JSON.stringify(mockUser));
    
    // Recarregar a página para atualizar o estado
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-black/10 dark:border-white/10 p-6 bg-background">
        <h1 className="text-2xl font-semibold mb-2">Login</h1>
        <p className="text-sm text-foreground/70 mb-6">
          Faça login para acessar o dashboard.
        </p>
        
        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-foreground/20"
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
              className="w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-foreground/20"
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
        
        <div className="mt-6">
          <button
            onClick={handleMockLogin}
            className="w-full h-10 rounded-md bg-blue-500 text-white hover:opacity-90 transition"
          >
            Login Mock (Sem API)
          </button>
        </div>
        
        <div className="mt-6 text-sm">
          <a href="/test" className="underline">
            Ir para página de teste
          </a>
        </div>
      </div>
    </div>
  );
}
