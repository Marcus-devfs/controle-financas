"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { apiClient, User, AuthData } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean; 
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  // Verificar se o usuário está autenticado ao carregar a aplicação
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        if (token) {
          // Sempre tentar verificar o token com a API
          try {
            const userData = await apiClient.verifyToken();
            setUser(userData);
            localStorage.setItem('user_data', JSON.stringify(userData));
          } catch (error) {
            console.error('Token inválido ou API indisponível:', error);
            // Se a API não está disponível, usar dados do localStorage como fallback
            const cachedUserData = localStorage.getItem('user_data');
            if (cachedUserData) {
              console.log('Usando dados em cache do localStorage');
              setUser(JSON.parse(cachedUserData));
            } else {
              localStorage.removeItem('auth_token');
              setUser(null);
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const authData: AuthData = await apiClient.login(email, password);
      setUser(authData.user);
      localStorage.setItem('user_data', JSON.stringify(authData.user));
    } catch (error: any) {
      setError(error.message || 'Erro ao fazer login');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const authData: AuthData = await apiClient.register(name, email, password);
      setUser(authData.user);
      localStorage.setItem('user_data', JSON.stringify(authData.user));
    } catch (error: any) {
      setError(error.message || 'Erro ao registrar usuário');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiClient.logout();
    localStorage.removeItem('user_data');
    setUser(null);
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
