import { useState, useCallback } from 'react';
import { aiService, AIAnalysis, AISuggestion, FinancialData } from '@/lib/aiService';
import { Transaction, Category, DashboardStats } from '@/lib/types';

export function useAIAnalysis() {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeFinancialData = useCallback(async (
    transactions: Transaction[],
    categories: Category[],
    stats: DashboardStats,
    currentMonth: string,
    previousMonth?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const financialData: FinancialData = {
        transactions,
        categories,
        stats,
        currentMonth,
        previousMonth
      };

      const result = await aiService.analyzeFinancialData(financialData);
      setAnalysis(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao analisar dados financeiros';
      setError(errorMessage);
      console.error('Erro na análise de IA:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getQuickSuggestions = useCallback(async (
    transactions: Transaction[],
    categories: Category[],
    stats: DashboardStats,
    currentMonth: string
  ): Promise<AISuggestion[]> => {
    try {
      const financialData: FinancialData = {
        transactions,
        categories,
        stats,
        currentMonth
      };

      return await aiService.getQuickSuggestions(financialData);
    } catch (err) {
      console.error('Erro ao obter sugestões rápidas:', err);
      return [];
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return {
    analysis,
    loading,
    error,
    analyzeFinancialData,
    getQuickSuggestions,
    clearAnalysis
  };
}
