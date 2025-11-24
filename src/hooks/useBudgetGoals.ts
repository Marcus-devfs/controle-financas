import { useState, useCallback } from 'react';
import { aiService, BudgetGoalsAnalysis, MultiMonthFinancialData } from '@/lib/aiService';
import { Transaction, Category, DashboardStats } from '@/lib/types';
import { apiClient, ApiTransactionResponse } from '@/lib/api';
import { useUserId } from './useUserId';

// Função de conversão de transação da API para formato interno
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

export function useBudgetGoals() {
  const [goals, setGoals] = useState<BudgetGoalsAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasExistingGoals, setHasExistingGoals] = useState<boolean>(false);
  const userId = useUserId();

  // Buscar dados dos últimos 3 meses
  const getLast3MonthsData = useCallback(async (): Promise<MultiMonthFinancialData | null> => {
    if (!userId) return null;

    try {
      const currentDate = new Date();
      const months: { month: string; transactions: Transaction[]; stats: DashboardStats }[] = [];

      // Buscar dados dos últimos 3 meses
      for (let i = 0; i < 3; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        try {
          const [transactionsData, statsData] = await Promise.all([
            apiClient.getTransactionsByMonth(month),
            apiClient.getStats(month)
          ]);

          // Converter transações da API para o formato interno
          const transactions = transactionsData.map(convertApiTransaction);

          months.push({
            month,
            transactions,
            stats: statsData
          });
        } catch (err) {
          console.warn(`Erro ao buscar dados do mês ${month}:`, err);
          // Continuar mesmo se um mês falhar
          months.push({
            month,
            transactions: [],
            stats: {
              totalIncome: 0,
              totalExpenses: 0,
              totalInvestments: 0,
              balance: 0,
              fixedIncome: 0,
              variableIncome: 0,
              fixedExpenses: 0,
              variableExpenses: 0,
              creditCardDebt: 0,
              availableCredit: 0
            }
          });
        }
      }

      // Buscar categorias
      const categoriesData = await apiClient.getCategories();
      const categories = categoriesData.map(cat => ({
        id: cat._id,
        name: cat.name,
        type: cat.type,
        color: cat.color
      }));

      // Calcular médias
      const totalIncome = months.reduce((sum, m) => sum + m.stats.totalIncome, 0);
      const totalExpenses = months.reduce((sum, m) => sum + m.stats.totalExpenses, 0);
      const averageIncome = months.length > 0 ? totalIncome / months.length : 0;
      const averageExpenses = months.length > 0 ? totalExpenses / months.length : 0;

      return {
        months,
        categories,
        averageIncome,
        averageExpenses
      };
    } catch (err: any) {
      console.error('Erro ao buscar dados dos últimos 3 meses:', err);
      setError(err.message || 'Erro ao buscar dados');
      return null;
    }
  }, [userId]);

  // Gerar metas
  const generateGoals = useCallback(async (preferences?: { targetSavings?: number; fixedCategories?: string[] }) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getLast3MonthsData();
      if (!data) {
        throw new Error('Não foi possível carregar dados dos últimos 3 meses');
      }

      const result = await aiService.generateBudgetGoals(data, preferences);
      setGoals(result);
      setHasExistingGoals(true);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao gerar metas de orçamento';
      setError(errorMessage);
      console.error('Erro ao gerar metas:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getLast3MonthsData]);

  // Verificar se existem metas salvas
  const checkExistingGoals = useCallback(async () => {
    try {
      const savedGoals = await apiClient.getBudgetGoals();
      setGoals(savedGoals.goals);
      setHasExistingGoals(true);
    } catch {
      setHasExistingGoals(false);
    }
  }, []);

  // Carregar metas existentes
  const loadExistingGoals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const savedGoals = await apiClient.getBudgetGoals();
      setGoals(savedGoals.goals);
      setHasExistingGoals(true);
      return savedGoals.goals;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar metas';
      setError(errorMessage);
      console.error('Erro ao carregar metas:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Deletar metas
  const deleteGoals = useCallback(async () => {
    try {
      await apiClient.deleteBudgetGoals();
      setGoals(null);
      setHasExistingGoals(false);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao deletar metas';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    goals,
    loading,
    error,
    hasExistingGoals,
    generateGoals,
    checkExistingGoals,
    loadExistingGoals,
    deleteGoals,
    getLast3MonthsData
  };
}

