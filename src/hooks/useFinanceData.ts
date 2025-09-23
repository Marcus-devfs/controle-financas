"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  UserData, 
  MonthlyData, 
  Transaction, 
  Category, 
  DashboardStats,
  CreditCard
} from '@/lib/types';
import { 
  getUserData, 
  saveUserData, 
  getMonthlyData, 
  addTransaction, 
  updateTransaction, 
  deleteTransaction, 
  addCategory,
  calculateStatsWithCards,
  getCurrentMonth,
  addCreditCard,
  updateCreditCard,
  deleteCreditCard,
  generateRecurringTransactions
} from '@/lib/data';

export function useFinanceData(userId: string) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentMonthData, setCurrentMonthData] = useState<MonthlyData | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonthState] = useState<string>(getCurrentMonth());
  
  // Ref para evitar loops infinitos
  const isInitialized = useRef(false);

  const loadData = useCallback((month?: string) => {
    if (typeof window === 'undefined' || !userId) return;
    
    setLoading(true);
    const data = getUserData(userId);
    setUserData(data);
    
    const targetMonth = month || data.currentMonth || getCurrentMonth();
    const monthData = getMonthlyData(userId, targetMonth);
    setCurrentMonthData(monthData);
    
    const calculatedStats = calculateStatsWithCards(monthData);
    setStats(calculatedStats);
    setCurrentMonthState(targetMonth);
    setLoading(false);
  }, [userId]);

  // Carregar dados iniciais apenas uma vez
  useEffect(() => {
    if (!isInitialized.current && userId) {
      isInitialized.current = true;
      loadData();
    }
  }, [userId, loadData]);

  const setCurrentMonth = useCallback((month: string) => {
    if (!userData || month === currentMonth) return;
    
    // Atualizar o mês atual no userData
    const updatedData = { ...userData, currentMonth: month };
    saveUserData(updatedData);
    setUserData(updatedData);
    
    // Carregar dados do novo mês
    loadData(month);
  }, [userData, currentMonth, loadData]);

  const addNewTransaction = useCallback((
    transaction: Omit<Transaction, 'id' | 'month'>
  ) => {
    if (!userData) return;
    
    addTransaction(userId, currentMonth, transaction);
    
    // Se for recorrente, gerar transações futuras
    if (transaction.isRecurring) {
      generateRecurringTransactions(userId, transaction, currentMonth);
    }
    
    loadData(currentMonth); // Recarrega os dados do mês atual
  }, [userData, userId, currentMonth, loadData]);

  const updateExistingTransaction = useCallback((
    transactionId: string,
    updates: Partial<Transaction>
  ) => {
    if (!userData) return;
    
    updateTransaction(userId, currentMonth, transactionId, updates);
    loadData(currentMonth); // Recarrega os dados do mês atual
  }, [userData, userId, currentMonth, loadData]);

  const removeTransaction = useCallback((transactionId: string) => {
    if (!userData) return;
    
    deleteTransaction(userId, currentMonth, transactionId);
    loadData(currentMonth); // Recarrega os dados do mês atual
  }, [userData, userId, currentMonth, loadData]);

  const addNewCategory = useCallback((category: Omit<Category, 'id'>) => {
    if (!userData) return;
    
    addCategory(userId, currentMonth, category);
    loadData(currentMonth); // Recarrega os dados do mês atual
  }, [userData, userId, currentMonth, loadData]);

  const getAvailableMonths = useCallback(() => {
    if (!userData) return [];
    return userData.monthlyData.map(m => m.month).sort().reverse();
  }, [userData]);

  const getMonthData = useCallback((month: string) => {
    return getMonthlyData(userId, month);
  }, [userId]);

  // Funções para cartões de crédito
  const addNewCreditCard = useCallback((
    card: Omit<CreditCard, 'id'>
  ) => {
    if (!userData) return;
    
    addCreditCard(userId, currentMonth, card);
    loadData(currentMonth);
  }, [userData, userId, currentMonth, loadData]);

  const updateExistingCreditCard = useCallback((
    cardId: string,
    updates: Partial<CreditCard>
  ) => {
    if (!userData) return;
    
    updateCreditCard(userId, currentMonth, cardId, updates);
    loadData(currentMonth);
  }, [userData, userId, currentMonth, loadData]);

  const removeCreditCard = useCallback((cardId: string) => {
    if (!userData) return;
    
    deleteCreditCard(userId, currentMonth, cardId);
    loadData(currentMonth);
  }, [userData, userId, currentMonth, loadData]);

  return {
    userData,
    currentMonthData,
    stats,
    loading,
    currentMonth,
    setCurrentMonth,
    addTransaction: addNewTransaction,
    updateTransaction: updateExistingTransaction,
    deleteTransaction: removeTransaction,
    addCategory: addNewCategory,
    addCreditCard: addNewCreditCard,
    updateCreditCard: updateExistingCreditCard,
    deleteCreditCard: removeCreditCard,
    getAvailableMonths,
    getMonthData,
    refreshData: () => loadData(currentMonth)
  };
}
