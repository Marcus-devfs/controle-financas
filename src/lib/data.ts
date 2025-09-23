"use client";

import { UserData, MonthlyData, Transaction, Category, DashboardStats, CreditCard } from './types';

const STORAGE_KEY = 'financas_user_data';

// Cores padrão para categorias
export const DEFAULT_CATEGORY_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // yellow
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
];

// Categorias padrão
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Salário', type: 'income', color: '#10B981' },
  { id: 'bonus', name: 'Bônus', type: 'income', color: '#3B82F6' },
  { id: 'freelance', name: 'Freelance', type: 'income', color: '#8B5CF6' },
  { id: 'rent', name: 'Aluguel', type: 'expense', color: '#EF4444' },
  { id: 'utilities', name: 'Contas', type: 'expense', color: '#F59E0B' },
  { id: 'food', name: 'Alimentação', type: 'expense', color: '#EC4899' },
  { id: 'transport', name: 'Transporte', type: 'expense', color: '#06B6D4' },
  { id: 'stocks', name: 'Ações', type: 'investment', color: '#84CC16' },
  { id: 'funds', name: 'Fundos', type: 'investment', color: '#10B981' },
];

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getUserData(userId: string): UserData {
  if (typeof window === 'undefined') {
    return {
      userId,
      currentMonth: getCurrentMonth(),
      monthlyData: []
    };
  }

  const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
  if (!stored) {
    const initialData: UserData = {
      userId,
      currentMonth: getCurrentMonth(),
      monthlyData: []
    };
    saveUserData(initialData);
    return initialData;
  }

  return JSON.parse(stored);
}

export function saveUserData(data: UserData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${STORAGE_KEY}_${data.userId}`, JSON.stringify(data));
}

export function getMonthlyData(userId: string, month: string): MonthlyData {
  const userData = getUserData(userId);
  let monthlyData = userData.monthlyData.find(m => m.month === month);
  
  if (!monthlyData) {
    monthlyData = {
      month,
      fixedIncome: [],
      variableIncome: [],
      fixedExpenses: [],
      variableExpenses: [],
      investments: [],
      categories: [...DEFAULT_CATEGORIES],
      creditCards: [],
      creditCardBills: []
    };
    
    userData.monthlyData.push(monthlyData);
    saveUserData(userData);
  }
  
  return monthlyData;
}

export function addTransaction(
  userId: string, 
  month: string, 
  transaction: Omit<Transaction, 'id' | 'month'>
): void {
  const userData = getUserData(userId);
  const monthlyData = getMonthlyData(userId, month);
  
  const newTransaction: Transaction = {
    ...transaction,
    id: Date.now().toString(),
    month
  };
  
  if (transaction.type === 'income') {
    if (transaction.isFixed) {
      monthlyData.fixedIncome.push(newTransaction);
    } else {
      monthlyData.variableIncome.push(newTransaction);
    }
  } else if (transaction.type === 'expense') {
    if (transaction.isFixed) {
      monthlyData.fixedExpenses.push(newTransaction);
    } else {
      monthlyData.variableExpenses.push(newTransaction);
    }
  } else if (transaction.type === 'investment') {
    monthlyData.investments.push(newTransaction);
  }
  
  const monthIndex = userData.monthlyData.findIndex(m => m.month === month);
  if (monthIndex >= 0) {
    userData.monthlyData[monthIndex] = monthlyData;
  } else {
    userData.monthlyData.push(monthlyData);
  }
  
  saveUserData(userData);
}

export function updateTransaction(
  userId: string,
  month: string,
  transactionId: string,
  updates: Partial<Transaction>
): void {
  const userData = getUserData(userId);
  const monthlyData = getMonthlyData(userId, month);
  
  // Remove da lista atual
  monthlyData.fixedIncome = monthlyData.fixedIncome.filter(t => t.id !== transactionId);
  monthlyData.variableIncome = monthlyData.variableIncome.filter(t => t.id !== transactionId);
  monthlyData.fixedExpenses = monthlyData.fixedExpenses.filter(t => t.id !== transactionId);
  monthlyData.variableExpenses = monthlyData.variableExpenses.filter(t => t.id !== transactionId);
  monthlyData.investments = monthlyData.investments.filter(t => t.id !== transactionId);
  
  // Adiciona com as atualizações
  const updatedTransaction = { ...updates, id: transactionId, month } as Transaction;
  
  if (updatedTransaction.type === 'income') {
    if (updatedTransaction.isFixed) {
      monthlyData.fixedIncome.push(updatedTransaction);
    } else {
      monthlyData.variableIncome.push(updatedTransaction);
    }
  } else if (updatedTransaction.type === 'expense') {
    if (updatedTransaction.isFixed) {
      monthlyData.fixedExpenses.push(updatedTransaction);
    } else {
      monthlyData.variableExpenses.push(updatedTransaction);
    }
  } else if (updatedTransaction.type === 'investment') {
    monthlyData.investments.push(updatedTransaction);
  }
  
  const monthIndex = userData.monthlyData.findIndex(m => m.month === month);
  if (monthIndex >= 0) {
    userData.monthlyData[monthIndex] = monthlyData;
  }
  
  saveUserData(userData);
}

export function deleteTransaction(
  userId: string,
  month: string,
  transactionId: string
): void {
  const userData = getUserData(userId);
  const monthlyData = getMonthlyData(userId, month);
  
  monthlyData.fixedIncome = monthlyData.fixedIncome.filter(t => t.id !== transactionId);
  monthlyData.variableIncome = monthlyData.variableIncome.filter(t => t.id !== transactionId);
  monthlyData.fixedExpenses = monthlyData.fixedExpenses.filter(t => t.id !== transactionId);
  monthlyData.variableExpenses = monthlyData.variableExpenses.filter(t => t.id !== transactionId);
  monthlyData.investments = monthlyData.investments.filter(t => t.id !== transactionId);
  
  const monthIndex = userData.monthlyData.findIndex(m => m.month === month);
  if (monthIndex >= 0) {
    userData.monthlyData[monthIndex] = monthlyData;
  }
  
  saveUserData(userData);
}

export function addCategory(
  userId: string,
  month: string,
  category: Omit<Category, 'id'>
): void {
  const userData = getUserData(userId);
  const monthlyData = getMonthlyData(userId, month);
  
  const newCategory: Category = {
    ...category,
    id: Date.now().toString()
  };
  
  monthlyData.categories.push(newCategory);
  
  const monthIndex = userData.monthlyData.findIndex(m => m.month === month);
  if (monthIndex >= 0) {
    userData.monthlyData[monthIndex] = monthlyData;
  }
  
  saveUserData(userData);
}

export function calculateStats(monthlyData: MonthlyData): DashboardStats {
  const fixedIncome = monthlyData.fixedIncome.reduce((sum, t) => sum + t.amount, 0);
  const variableIncome = monthlyData.variableIncome.reduce((sum, t) => sum + t.amount, 0);
  const fixedExpenses = monthlyData.fixedExpenses.reduce((sum, t) => sum + t.amount, 0);
  const variableExpenses = monthlyData.variableExpenses.reduce((sum, t) => sum + t.amount, 0);
  const totalInvestments = monthlyData.investments.reduce((sum, t) => sum + t.amount, 0);
  
  const totalIncome = fixedIncome + variableIncome;
  const totalExpenses = fixedExpenses + variableExpenses;
  const balance = totalIncome - totalExpenses;
  
  return {
    totalIncome,
    totalExpenses,
    totalInvestments,
    balance,
    fixedIncome,
    variableIncome,
    fixedExpenses,
    variableExpenses,
    creditCardDebt: 0,
    availableCredit: 0
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatMonth(month: string): string {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return date.toLocaleDateString('pt-BR', { 
    year: 'numeric', 
    month: 'long' 
  });
}

// Funções para cartões de crédito
export function addCreditCard(
  userId: string,
  month: string,
  card: Omit<CreditCard, 'id'>
): void {
  const userData = getUserData(userId);
  const monthlyData = getMonthlyData(userId, month);
  
  const newCard: CreditCard = {
    ...card,
    id: Date.now().toString()
  };
  
  // Garantir que creditCards existe
  if (!monthlyData.creditCards) {
    monthlyData.creditCards = [];
  }
  
  monthlyData.creditCards.push(newCard);
  
  const monthIndex = userData.monthlyData.findIndex(m => m.month === month);
  if (monthIndex >= 0) {
    userData.monthlyData[monthIndex] = monthlyData;
  }
  
  saveUserData(userData);
}

export function updateCreditCard(
  userId: string,
  month: string,
  cardId: string,
  updates: Partial<CreditCard>
): void {
  const userData = getUserData(userId);
  const monthlyData = getMonthlyData(userId, month);
  
  // Garantir que creditCards existe
  if (!monthlyData.creditCards) {
    monthlyData.creditCards = [];
  }
  
  const cardIndex = monthlyData.creditCards.findIndex(c => c.id === cardId);
  if (cardIndex >= 0) {
    monthlyData.creditCards[cardIndex] = {
      ...monthlyData.creditCards[cardIndex],
      ...updates
    };
  }
  
  const monthIndex = userData.monthlyData.findIndex(m => m.month === month);
  if (monthIndex >= 0) {
    userData.monthlyData[monthIndex] = monthlyData;
  }
  
  saveUserData(userData);
}

export function deleteCreditCard(
  userId: string,
  month: string,
  cardId: string
): void {
  const userData = getUserData(userId);
  const monthlyData = getMonthlyData(userId, month);
  
  // Garantir que creditCards existe
  if (!monthlyData.creditCards) {
    monthlyData.creditCards = [];
  }
  
  monthlyData.creditCards = monthlyData.creditCards.filter(c => c.id !== cardId);
  
  const monthIndex = userData.monthlyData.findIndex(m => m.month === month);
  if (monthIndex >= 0) {
    userData.monthlyData[monthIndex] = monthlyData;
  }
  
  saveUserData(userData);
}

// Funções para recorrência
export function generateRecurringTransactions(
  userId: string,
  transaction: Omit<Transaction, 'id' | 'month'>,
  startMonth: string,
  endMonth?: string
): void {
  if (!transaction.isRecurring || !transaction.recurringRule) return;
  
  const startDate = new Date(startMonth + '-01');
  const endDate = endMonth ? new Date(endMonth + '-01') : new Date();
  endDate.setMonth(endDate.getMonth() + 12); // 12 meses no futuro por padrão
  
  const currentDate = new Date(startDate);
  let occurrenceCount = 0;
  
  while (currentDate <= endDate && 
         (!transaction.recurringRule.maxOccurrences || 
          occurrenceCount < transaction.recurringRule.maxOccurrences)) {
    
    const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Se for despesa fixa mensal, usar o dia do mês
    if (transaction.isFixed && transaction.dayOfMonth) {
      const transactionDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), transaction.dayOfMonth);
      if (transactionDate.getMonth() === currentDate.getMonth()) {
        addTransaction(userId, monthStr, {
          ...transaction,
          date: transactionDate.toISOString().split('T')[0]
        });
        occurrenceCount++;
      }
    } else {
      // Para outras recorrências, usar a data atual
      addTransaction(userId, monthStr, {
        ...transaction,
        date: currentDate.toISOString().split('T')[0]
      });
      occurrenceCount++;
    }
    
    // Avançar para a próxima ocorrência
    switch (transaction.recurringRule.type) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + transaction.recurringRule.interval);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + (7 * transaction.recurringRule.interval));
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + transaction.recurringRule.interval);
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + transaction.recurringRule.interval);
        break;
    }
  }
}

// Função para calcular estatísticas incluindo cartões
export function calculateStatsWithCards(monthlyData: MonthlyData): DashboardStats {
  const fixedIncome = monthlyData.fixedIncome.reduce((sum, t) => sum + t.amount, 0);
  const variableIncome = monthlyData.variableIncome.reduce((sum, t) => sum + t.amount, 0);
  const fixedExpenses = monthlyData.fixedExpenses.reduce((sum, t) => sum + t.amount, 0);
  const variableExpenses = monthlyData.variableExpenses.reduce((sum, t) => sum + t.amount, 0);
  const totalInvestments = monthlyData.investments.reduce((sum, t) => sum + t.amount, 0);
  
  const totalIncome = fixedIncome + variableIncome;
  const totalExpenses = fixedExpenses + variableExpenses;
  const balance = totalIncome - totalExpenses;
  
  // Calcular dívida de cartão de crédito
  const creditCardDebt = (monthlyData.creditCardBills || [])
    .filter(bill => bill.status === 'pending' || bill.status === 'overdue')
    .reduce((sum, bill) => sum + (bill.totalAmount - bill.paidAmount), 0);
  
  // Calcular crédito disponível
  const totalLimit = (monthlyData.creditCards || [])
    .filter(card => card.isActive)
    .reduce((sum, card) => sum + card.limit, 0);
  
  const usedCredit = (monthlyData.creditCardBills || [])
    .filter(bill => bill.status === 'pending' || bill.status === 'overdue')
    .reduce((sum, bill) => sum + bill.totalAmount, 0);
  
  const availableCredit = totalLimit - usedCredit;
  
  return {
    totalIncome,
    totalExpenses,
    totalInvestments,
    balance,
    fixedIncome,
    variableIncome,
    fixedExpenses,
    variableExpenses,
    creditCardDebt,
    availableCredit
  };
}
