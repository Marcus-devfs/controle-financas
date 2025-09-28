import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Configuração da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

// Interface para respostas da API
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Interface para dados de autenticação
export interface AuthData {
  user: {
    id: string;
    name: string;
    email: string;
  };
  token: string;
}

// Interface para dados de usuário
export interface User {
  id: string;
  name: string;
  email: string;
}

// Interface para categoria
export interface Category {
  _id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense' | 'investment';
  color: string;
  createdAt: string;
  updatedAt: string;
}

// Interface para transação
export interface Transaction {
  _id: string;
  userId: string;
  categoryId: string;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense' | 'investment';
  isFixed: boolean;
  isRecurring: boolean;
  recurringRule?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    dayOfMonth?: number;
    dayOfWeek?: number;
    endDate?: string;
    maxOccurrences?: number;
  };
  dayOfMonth?: number;
  creditCardId?: string;
  installmentInfo?: {
    totalInstallments: number;
    currentInstallment: number;
    installmentAmount: number;
  };
  month: string;
  createdAt: string;
  updatedAt: string;
}

// Interface para cartão de crédito
export interface CreditCard {
  _id: string;
  userId: string;
  name: string;
  lastFourDigits: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'elo' | 'other';
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface para estatísticas
export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  totalInvestments: number;
  balance: number;
  fixedIncome: number;
  variableIncome: number;
  fixedExpenses: number;
  variableExpenses: number;
  creditCardDebt: number;
  availableCredit: number;
}

// Interface para análise de IA
export interface AIAnalysis {
  _id: string;
  userId: string;
  month: string;
  analysis: {
    summary: string;
    insights: string[];
    suggestions: {
      type: 'expense_reduction' | 'income_increase' | 'investment_optimization' | 'budget_adjustment' | 'financial_planning' | 'budget_management';
      title: string;
      description: string;
      impact: 'low' | 'medium' | 'high';
      category?: string;
      estimatedSavings?: number;
      priority: number;
      timeline?: string;
    }[];
    budgetAnalysis?: {
      currentNeeds: string;
      currentWants: string;
      idealNeeds: number;
      idealWants: number;
      idealSavings: number;
    };
    riskLevel: 'low' | 'medium' | 'high';
    score: number;
    recommendations?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// Classe para gerenciar a API
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token automaticamente
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para tratar respostas
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado ou inválido
          this.removeToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Métodos para gerenciar token
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Métodos de autenticação
  async register(name: string, email: string, password: string): Promise<AuthData> {
    const response = await this.client.post<ApiResponse<AuthData>>('/api/auth/register', {
      name,
      email,
      password,
    });

    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.token);
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erro ao registrar usuário');
  }

  async login(email: string, password: string): Promise<AuthData> {
    const response = await this.client.post<ApiResponse<AuthData>>('/api/auth/login', {
      email,
      password,
    });

    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.token);
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erro ao fazer login');
  }

  async verifyToken(): Promise<User> {
    const response = await this.client.get<ApiResponse<{ user: User }>>('/api/auth/verify');

    if (response.data.success && response.data.data) {
      return response.data.data.user;
    }
    throw new Error(response.data.message || 'Token inválido');
  }

  logout(): void {
    this.removeToken();
  }

  // Métodos para categorias
  async getCategories(): Promise<Category[]> {
    const response = await this.client.get<ApiResponse<Category[]>>('/api/categories');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erro ao buscar categorias');
  }

  async getCategoriesByType(type: 'income' | 'expense' | 'investment'): Promise<Category[]> {
    const response = await this.client.get<ApiResponse<Category[]>>(`/api/categories/type/${type}`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erro ao buscar categorias');
  }

  async createCategory(name: string, type: 'income' | 'expense' | 'investment', color: string): Promise<Category> {
    const response = await this.client.post<ApiResponse<Category>>('/api/categories', {
      name,
      type,
      color,
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erro ao criar categoria');
  }

  async updateCategory(id: string, name: string, type: 'income' | 'expense' | 'investment', color: string): Promise<Category> {
    const response = await this.client.put<ApiResponse<Category>>(`/api/categories/${id}`, {
      name,
      type,
      color,
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erro ao atualizar categoria');
  }

  async deleteCategory(id: string): Promise<void> {
    const response = await this.client.delete<ApiResponse>(`/api/categories/${id}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Erro ao deletar categoria');
    }
  }

  // Métodos para transações
  async getTransactions(params?: {
    month?: string;
    type?: 'income' | 'expense' | 'investment';
    categoryId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ transactions: Transaction[]; pagination: any }> {
    const response = await this.client.get<ApiResponse<{ transactions: Transaction[]; pagination: any }>>('/api/transactions', {
      params,
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erro ao buscar transações');
  }

  async getTransactionsByMonth(month: string): Promise<Transaction[]> {
    const response = await this.client.get<ApiResponse<Transaction[]>>(`/api/transactions/month/${month}`);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erro ao buscar transações do mês');
  }

  async createTransaction(transaction: Omit<Transaction, '_id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const response = await this.client.post<ApiResponse<Transaction>>('/api/transactions', transaction);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erro ao criar transação');
  }

  async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<Transaction> {
    const response = await this.client.put<ApiResponse<Transaction>>(`/api/transactions/${id}`, transaction);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erro ao atualizar transação');
  }

  async deleteTransaction(id: string): Promise<void> {
    const response = await this.client.delete<ApiResponse>(`/api/transactions/${id}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Erro ao deletar transação');
    }
  }

  async getStats(month: string): Promise<DashboardStats> {
    const response = await this.client.get<ApiResponse<DashboardStats>>(`/api/transactions/stats/${month}`);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erro ao buscar estatísticas');
  }

  // Métodos para cartões de crédito
  async getCreditCards(active?: boolean): Promise<CreditCard[]> {
    const response = await this.client.get<ApiResponse<CreditCard[]>>('/api/credit-cards', {
      params: active !== undefined ? { active } : {},
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erro ao buscar cartões');
  }

  async getCreditCard(id: string): Promise<CreditCard> {
    const response = await this.client.get<ApiResponse<CreditCard>>(`/api/credit-cards/${id}`);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erro ao buscar cartão');
  }

  async createCreditCard(card: Omit<CreditCard, '_id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<CreditCard> {
    const response = await this.client.post<ApiResponse<CreditCard>>('/api/credit-cards', card);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erro ao criar cartão');
  }

  async updateCreditCard(id: string, card: Partial<CreditCard>): Promise<CreditCard> {
    const response = await this.client.put<ApiResponse<CreditCard>>(`/api/credit-cards/${id}`, card);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erro ao atualizar cartão');
  }

  async deleteCreditCard(id: string): Promise<void> {
    const response = await this.client.delete<ApiResponse>(`/api/credit-cards/${id}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Erro ao deletar cartão');
    }
  }

  async toggleCreditCard(id: string): Promise<CreditCard> {
    const response = await this.client.patch<ApiResponse<CreditCard>>(`/api/credit-cards/${id}/toggle`);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erro ao alterar status do cartão');
  }

  // Métodos para análise de IA
  async getAIAnalysis(month: string): Promise<AIAnalysis> {
    const response = await this.client.get<ApiResponse<AIAnalysis>>(`/api/ai-analysis/${month}`);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erro ao buscar análise de IA');
  }

  async saveAIAnalysis(month: string, analysis: AIAnalysis['analysis']): Promise<AIAnalysis> {
    const response = await this.client.post<ApiResponse<AIAnalysis>>('/api/ai-analysis', {
      month,
      analysis
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erro ao salvar análise de IA');
  }

  async deleteAIAnalysis(month: string): Promise<void> {
    const response = await this.client.delete<ApiResponse>(`/api/ai-analysis/${month}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Erro ao deletar análise de IA');
    }
  }

  async getAllAIAnalyses(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ analyses: AIAnalysis[]; pagination: any }> {
    const response = await this.client.get<ApiResponse<{ analyses: AIAnalysis[]; pagination: any }>>('/api/ai-analysis', {
      params
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erro ao buscar análises de IA');
  }
}

// Instância única do cliente
export const apiClient = new ApiClient();

// Tipos já exportados acima, não precisam ser re-exportados
