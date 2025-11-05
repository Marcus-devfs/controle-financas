"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Transaction, 
  Category, 
  DashboardStats,
  CreditCard
} from '@/lib/types';
import { 
  apiClient,
  ApiTransactionResponse,
  ApiTransactionRequest,
  Category as ApiCategory,
  CreditCard as ApiCreditCard
} from '@/lib/api';
import { getCurrentMonth } from '@/lib/data';

// Funções de conversão entre tipos da API e tipos do frontend
function convertApiTransaction(apiTransaction: ApiTransactionResponse): Transaction {
  return {
    id: apiTransaction._id,
    categoryId: typeof apiTransaction.categoryId === 'object' 
      ? apiTransaction.categoryId._id 
      : apiTransaction.categoryId,
    description: apiTransaction.description,
    amount: apiTransaction.amount,
    date: apiTransaction.date,
    type: apiTransaction.type,
    isPaid: apiTransaction.isPaid ?? false,
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

function convertApiCategory(apiCategory: ApiCategory): Category {
  return {
    id: apiCategory._id,
    name: apiCategory.name,
    type: apiCategory.type,
    color: apiCategory.color
  };
}

function convertApiCreditCard(apiCard: ApiCreditCard): CreditCard {
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

export function useFinanceData(userId: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonthState] = useState<string>(getCurrentMonth());
  const [error, setError] = useState<string | null>(null);
  
  // Ref para evitar loops infinitos
  const isInitialized = useRef(false);

  // Carregar dados globais (categorias e cartões) apenas uma vez
  const loadGlobalData = useCallback(async () => {
    if (typeof window === 'undefined' || !userId) return;
    
    try {
      const [categoriesData, creditCardsData] = await Promise.all([
        apiClient.getCategories(),
        apiClient.getCreditCards(true)
      ]);
      
      setCategories(categoriesData.map(convertApiCategory));
      setCreditCards(creditCardsData.map(convertApiCreditCard));
    } catch (error: any) {
      console.error('Erro ao carregar dados globais:', error);
    }
  }, [userId]);

  // Carregar dados específicos do mês (transações e stats)
  const loadMonthData = useCallback(async (month: string) => {
    if (typeof window === 'undefined' || !userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [transactionsData, statsData] = await Promise.all([
        apiClient.getTransactionsByMonth(month),
        apiClient.getStats(month)
      ]);
      
      setTransactions(transactionsData.map(convertApiTransaction));
      setStats(statsData);
      setCurrentMonthState(month);
    } catch (error: any) {
      setError(error.message || 'Erro ao carregar dados do mês');
      console.error('Erro ao carregar dados do mês:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, currentMonth]);

  // Função principal que carrega tudo
  const loadData = useCallback(async (month?: string) => {
    const targetMonth = month || currentMonth;
    
    // Carregar dados globais apenas se ainda não foram carregados
    if (categories.length === 0 || creditCards.length === 0) {
      await loadGlobalData();
    }
    
    // Carregar dados do mês
    await loadMonthData(targetMonth);
  }, [userId, currentMonth, categories.length, creditCards.length, loadGlobalData, loadMonthData]);

  // Carregar dados iniciais apenas uma vez
  useEffect(() => {
    if (userId && !isInitialized.current) {
      isInitialized.current = true;
      
      // Carregar dados diretamente sem usar loadData para evitar loop
      const initializeData = async () => {
        try {
          // Carregar dados globais
          const [categoriesData, creditCardsData] = await Promise.all([
            apiClient.getCategories(),
            apiClient.getCreditCards(true)
          ]);
          
          setCategories(categoriesData.map(convertApiCategory));
          setCreditCards(creditCardsData.map(convertApiCreditCard));
          
          // Carregar dados do mês atual
          const [transactionsData, statsData] = await Promise.all([
            apiClient.getTransactionsByMonth(currentMonth),
            apiClient.getStats(currentMonth)
          ]);
          
          setTransactions(transactionsData.map(convertApiTransaction));
          setStats(statsData);
          setLoading(false);
        } catch (error: any) {
          console.error('Erro ao inicializar dados:', error);
          setError(error.message || 'Erro ao carregar dados');
          setLoading(false);
        }
      };
      
      initializeData();
    }
  }, [userId]); // Apenas userId como dependência

  // Carregar dados quando o mês mudar
  useEffect(() => {
    if (userId && currentMonth && isInitialized.current) {
      loadMonthData(currentMonth);
    }
  }, [currentMonth, userId, loadMonthData]);

  const setCurrentMonth = useCallback((month: string) => {
    if (month === currentMonth) return;
    setCurrentMonthState(month);
  }, [currentMonth]);

  const addNewTransaction = useCallback(async (
    transaction: Omit<Transaction, 'id' | 'month'>
  ) => {
    try {
      setError(null);
      setSaving(true);
      
      // Converter para formato da API
      const apiTransaction: ApiTransactionRequest = {
        categoryId: transaction.categoryId,
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.date,
        type: transaction.type,
        isPaid: transaction.isPaid ?? false,
        isFixed: transaction.isFixed,
        isRecurring: transaction.isRecurring,
        recurringRule: transaction.recurringRule,
        dayOfMonth: transaction.dayOfMonth,
        creditCardId: transaction.creditCardId,
        installmentInfo: transaction.installmentInfo,
        month: currentMonth
      };
      
      await apiClient.createTransaction(apiTransaction);
      
      // Recarregar dados
      await loadMonthData(currentMonth);
    } catch (error: any) {
      setError(error.message || 'Erro ao criar transação');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [userId, currentMonth, loadMonthData]);

  const updateExistingTransaction = useCallback(async (
    transactionId: string,
    updates: Partial<Transaction>
  ) => {
    setError(null);
    
    // Otimismo: aplicar no estado local imediatamente
    setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, ...updates } : t));
    
    try {
      await apiClient.updateTransaction(transactionId, updates);
      // Opcional: poderíamos refrescar silenciosamente em background se necessário
    } catch (error: any) {
      // Reverter em caso de erro
      setError(error.message || 'Erro ao atualizar transação');
      await loadMonthData(currentMonth);
      throw error;
    }
  }, [userId, currentMonth, loadMonthData]);

  const removeTransaction = useCallback(async (transactionId: string) => {
    try {
      setError(null);
      
      await apiClient.deleteTransaction(transactionId);
      
      // Recarregar dados
      await loadMonthData(currentMonth);
    } catch (error: any) {
      setError(error.message || 'Erro ao deletar transação');
      throw error;
    }
  }, [userId, currentMonth, loadData]);

  const addNewCategory = useCallback(async (category: Omit<Category, 'id'>) => {
    try {
      setError(null);
      setSaving(true);
      
      await apiClient.createCategory(category.name, category.type, category.color);
      
      // Recarregar dados globais (categorias) e dados do mês
      await Promise.all([
        loadGlobalData(),
        loadMonthData(currentMonth)
      ]);
    } catch (error: any) {
      setError(error.message || 'Erro ao criar categoria');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [userId, currentMonth, loadGlobalData, loadMonthData]);

  const deleteCategory = useCallback(async (categoryId: string) => {
    try {
      setError(null);
      setSaving(true);
      
      await apiClient.deleteCategory(categoryId);
      
      // Recarregar dados globais (categorias) e dados do mês
      await Promise.all([
        loadGlobalData(),
        loadMonthData(currentMonth)
      ]);
    } catch (error: any) {
      setError(error.message || 'Erro ao deletar categoria');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [userId, currentMonth, loadGlobalData, loadMonthData]);

  const getAvailableMonths = useCallback(() => {
    const months = new Set<string>();
    const currentDate = new Date();
    
    // Adicionar últimos 12 meses (histórico)
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.add(date.toISOString().slice(0, 7));
    }
    
    // Adicionar meses futuros baseados em transações recorrentes
    const recurringTransactions = transactions.filter(t => t.recurringRule);
    
    recurringTransactions.forEach(transaction => {
      if (transaction.recurringRule) {
        const startDate = new Date(transaction.date);
        const endDate = transaction.recurringRule.endDate ? new Date(transaction.recurringRule.endDate) : null;
        const frequency = transaction.recurringRule.type;
        
        // Adicionar até 12 meses no futuro ou até a data de fim
        for (let i = 1; i <= 12; i++) {
          let nextDate: Date;
          
          switch (frequency) {
            case 'monthly':
              nextDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, startDate.getDate());
              break;
            case 'weekly':
              nextDate = new Date(startDate.getTime() + (i * 7 * 24 * 60 * 60 * 1000));
              break;
            case 'yearly':
              nextDate = new Date(startDate.getFullYear() + i, startDate.getMonth(), startDate.getDate());
              break;
            default:
              nextDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, startDate.getDate());
          }
          
          // Se há data de fim e já passou, parar
          if (endDate && nextDate > endDate) {
            break;
          }
          
          // Se a data futura não passou do limite de 12 meses, adicionar
          const monthsDiff = (nextDate.getFullYear() - currentDate.getFullYear()) * 12 + 
                           (nextDate.getMonth() - currentDate.getMonth());
          if (monthsDiff <= 12) {
            months.add(nextDate.toISOString().slice(0, 7));
          }
        }
      }
    });
    
    // Converter para array e ordenar
    return Array.from(months).sort();
  }, [transactions]);

  const getMonthData = useCallback(async (month: string) => {
    try {
      const transactions = await apiClient.getTransactionsByMonth(month);
      return { transactions: transactions.map(convertApiTransaction) };
    } catch (error: any) {
      setError(error.message || 'Erro ao buscar dados do mês');
      return { transactions: [] };
    }
  }, [userId]);

  const duplicatePreviousTransactions = useCallback(async (targetMonth: string) => {
    try {
      setError(null);
      setSaving(true);
      
      // Calcular mês anterior
      const targetDate = new Date(targetMonth + '-01');
      const previousDate = new Date(targetDate);
      previousDate.setMonth(previousDate.getMonth() - 1);
      const sourceMonth = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}`;
      
      await apiClient.duplicateTransactions(sourceMonth, targetMonth);
      
      // Recarregar dados do mês atual
      await loadMonthData(targetMonth);
    } catch (error: any) {
      setError(error.message || 'Erro ao duplicar transações do mês anterior');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [userId, loadMonthData]);

  const duplicatePreviousCards = useCallback(async (targetMonth: string) => {
    try {
      setError(null);
      setSaving(true);
      
      // Calcular mês anterior
      const targetDate = new Date(targetMonth + '-01');
      const previousDate = new Date(targetDate);
      previousDate.setMonth(previousDate.getMonth() - 1);
      const sourceMonth = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}`;
      
      await apiClient.duplicateCards(sourceMonth, targetMonth);
      
      // Recarregar dados do mês atual
      await loadMonthData(targetMonth);
    } catch (error: any) {
      setError(error.message || 'Erro ao duplicar gastos de cartão do mês anterior');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [userId, loadMonthData]);

  // Funções para cartões de crédito
  const addNewCreditCard = useCallback(async (
    card: Omit<CreditCard, 'id'>
  ) => {
    try {
      setError(null);
      
      // Converter para formato da API
      const apiCard: Omit<ApiCreditCard, '_id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        name: card.name,
        lastFourDigits: card.lastFourDigits,
        brand: card.brand,
        limit: card.limit,
        closingDay: card.closingDay,
        dueDay: card.dueDay,
        color: card.color,
        isActive: card.isActive
      };
      
      await apiClient.createCreditCard(apiCard);
      
      // Recarregar dados
      await loadMonthData(currentMonth);
    } catch (error: any) {
      setError(error.message || 'Erro ao criar cartão');
      throw error;
    }
  }, [userId, currentMonth, loadData]);

  const updateExistingCreditCard = useCallback(async (
    cardId: string,
    updates: Partial<CreditCard>
  ) => {
    try {
      setError(null);
      
      await apiClient.updateCreditCard(cardId, updates);
      
      // Recarregar dados
      await loadMonthData(currentMonth);
    } catch (error: any) {
      setError(error.message || 'Erro ao atualizar cartão');
      throw error;
    }
  }, [userId, currentMonth, loadData]);

  const removeCreditCard = useCallback(async (cardId: string) => {
    try {
      setError(null);
      
      await apiClient.deleteCreditCard(cardId);
      
      // Recarregar dados
      await loadMonthData(currentMonth);
    } catch (error: any) {
      setError(error.message || 'Erro ao deletar cartão');
      throw error;
    }
  }, [userId, currentMonth, loadData]);

  return {
    transactions,
    categories,
    creditCards,
    stats,
    loading,
    saving,
    error,
    currentMonth,
    setCurrentMonth,
    addTransaction: addNewTransaction,
    updateTransaction: updateExistingTransaction,
    deleteTransaction: removeTransaction,
    addCategory: addNewCategory,
    deleteCategory,
    addCreditCard: addNewCreditCard,
    updateCreditCard: updateExistingCreditCard,
    deleteCreditCard: removeCreditCard,
    getAvailableMonths,
    getMonthData,
    duplicatePreviousTransactions,
    duplicatePreviousCards,
    refreshData: () => loadMonthData(currentMonth)
  };
}
