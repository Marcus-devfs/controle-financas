"use client";

import { useAuth } from "@/hooks/useAuth";

export default function TestPage() {
  const { user, isAuthenticated, isLoading, error } = useAuth();

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Página de Teste</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Loading:</strong> {isLoading ? 'Sim' : 'Não'}
        </div>
        
        <div>
          <strong>Autenticado:</strong> {isAuthenticated ? 'Sim' : 'Não'}
        </div>
        
        <div>
          <strong>Usuário:</strong> {user ? JSON.stringify(user, null, 2) : 'Nenhum'}
        </div>
        
        <div>
          <strong>Erro:</strong> {error || 'Nenhum'}
        </div>
        
        <div>
          <strong>Token:</strong> {typeof window !== 'undefined' ? localStorage.getItem('auth_token') || 'Nenhum' : 'N/A'}
        </div>
        
        <div>
          <strong>User Data:</strong> {typeof window !== 'undefined' ? localStorage.getItem('user_data') || 'Nenhum' : 'N/A'}
        </div>
      </div>
      
      <div className="mt-8">
        <a href="/dashboard" className="bg-blue-500 text-white px-4 py-2 rounded">
          Ir para Dashboard
        </a>
      </div>
    </div>
  );
}
