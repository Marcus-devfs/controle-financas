"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { Transaction, Category, CreditCard } from '@/lib/types';

// Funções de conversão
function convertApiTransaction(apiTransaction: any): Transaction {
  return {
    id: apiTransaction._id,
    categoryId: apiTransaction.categoryId,
    description: apiTransaction.description,
    amount: apiTransaction.amount,
    date: apiTransaction.date,
    type: apiTransaction.type,
    isFixed: apiTransaction.isFixed,
    isRecurring: apiTransaction.isRecurring,
    recurringRule: apiTransaction.recurringRule ? {
      id: `${apiTransaction._id}-recurring`,
      ...apiTransaction.recurringRule
    } : undefined,
    dayOfMonth: apiTransaction.dayOfMonth,
    creditCardId: apiTransaction.creditCardId,
    installmentInfo: apiTransaction.installmentInfo,
    month: apiTransaction.month
  };
}

function convertApiCategory(apiCategory: any): Category {
  return {
    id: apiCategory._id,
    name: apiCategory.name,
    type: apiCategory.type,
    color: apiCategory.color
  };
}

function convertApiCreditCard(apiCard: any): CreditCard {
  return {
    id: apiCard._id,
    name: apiCard.name,
    lastFourDigits: apiCard.lastFourDigits,
    brand: apiCard.brand,
    limit: apiCard.limit,
    closingDay: apiCard.closingDay,
    dueDay: apiCard.dueDay,
    color: apiCard.color,
    isActive: apiCard.isActive
  };
}

export function useReportsData(userId: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Carregar dados globais (categorias e cartões) apenas uma vez
  const loadGlobalData = useCallback(async () => {
    if (!userId) return;
    
    try {
      console.log('Relatórios - Carregando dados globais');
      
      const [categoriesData, creditCardsData] = await Promise.all([
        apiClient.getCategories(),
        apiClient.getCreditCards(true)
      ]);
      
      setCategories(categoriesData.map(convertApiCategory));
      setCreditCards(creditCardsData.map(convertApiCreditCard));
      
      console.log('Relatórios - Dados globais carregados:', {
        categories: categoriesData.length,
        creditCards: creditCardsData.length
      });
    } catch (error: any) {
      console.error('Relatórios - Erro ao carregar dados globais:', error);
      setError(error.message || 'Erro ao carregar dados globais');
    }
  }, [userId]);

  // Carregar transações do mês atual
  const loadCurrentMonthData = useCallback(async (month: string) => {
    if (!userId) return;
    
    try {
      console.log('Relatórios - Carregando dados do mês:', month);
      
      const transactionsData = await apiClient.getTransactionsByMonth(month);
      setTransactions(transactionsData.map(convertApiTransaction));
      
      console.log('Relatórios - Dados do mês carregados:', {
        transactions: transactionsData.length
      });
    } catch (error: any) {
      console.error('Relatórios - Erro ao carregar dados do mês:', error);
      setError(error.message || 'Erro ao carregar dados do mês');
    }
  }, [userId]);

  // Carregar dados de múltiplos meses para tendência (com debounce)
  const loadMonthlyTrendData = useCallback(async (months: string[]) => {
    if (!userId || months.length === 0) return {};
    
    try {
      console.log('Relatórios - Carregando dados de tendência para meses:', months);
      
      // Carregar dados de todos os meses em paralelo
      const monthlyData = await Promise.all(
        months.map(async (month) => {
          try {
            const transactionsData = await apiClient.getTransactionsByMonth(month);
            return {
              month,
              transactions: transactionsData.map(convertApiTransaction)
            };
          } catch (error) {
            console.warn(`Erro ao carregar dados do mês ${month}:`, error);
            return {
              month,
              transactions: []
            };
          }
        })
      );
      
      // Converter para objeto para fácil acesso
      const trendData: Record<string, Transaction[]> = {};
      monthlyData.forEach(({ month, transactions }) => {
        trendData[month] = transactions;
      });
      
      console.log('Relatórios - Dados de tendência carregados:', {
        months: Object.keys(trendData).length
      });
      
      return trendData;
    } catch (error: any) {
      console.error('Relatórios - Erro ao carregar dados de tendência:', error);
      return {};
    }
  }, [userId]);

  // Inicializar dados apenas uma vez
  useEffect(() => {
    if (!userId) return;
    
    const initializeData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Carregar dados globais
        await loadGlobalData();
        
        // Carregar dados do mês atual
        await loadCurrentMonthData(currentMonth);
      } catch (error: any) {
        console.error('Relatórios - Erro ao inicializar:', error);
        setError(error.message || 'Erro ao inicializar dados');
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, [userId, currentMonth, loadGlobalData, loadCurrentMonthData]);

  // Carregar dados quando o mês mudar
  useEffect(() => {
    if (userId && currentMonth) {
      loadCurrentMonthData(currentMonth);
    }
  }, [currentMonth, userId, loadCurrentMonthData]);

  // Função para mudar mês
  const setMonth = useCallback((month: string) => {
    if (month === currentMonth) return;
    setCurrentMonth(month);
  }, [currentMonth]);

  // Função para obter meses disponíveis (últimos 12 meses)
  const getAvailableMonths = useCallback(() => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push(date.toISOString().slice(0, 7));
    }
    return months;
  }, []);

  // Função para obter dados de um mês específico
  const getMonthData = useCallback(async (month: string) => {
    try {
      const transactionsData = await apiClient.getTransactionsByMonth(month);
      return {
        transactions: transactionsData.map(convertApiTransaction),
        categories: categories,
        creditCards: creditCards
      };
    } catch (error: any) {
      console.error(`Erro ao buscar dados do mês ${month}:`, error);
      return {
        transactions: [],
        categories: categories,
        creditCards: creditCards
      };
    }
  }, [categories, creditCards]);

  return {
    transactions,
    categories,
    creditCards,
    loading,
    error,
    currentMonth,
    setCurrentMonth: setMonth,
    getAvailableMonths,
    getMonthData,
    loadMonthlyTrendData
  };
}
