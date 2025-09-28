import { useState, useCallback, useEffect } from 'react';
import { aiService, AIAnalysis, AISuggestion, FinancialData } from '@/lib/aiService';
import { Transaction, Category, DashboardStats } from '@/lib/types';

export function useAIAnalysis() {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasExistingAnalysis, setHasExistingAnalysis] = useState<boolean>(false);

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
    setHasExistingAnalysis(false);
  }, []);

  // Função para verificar se existe análise para um mês
  const checkExistingAnalysis = useCallback(async (month: string) => {
    try {
      const hasAnalysis = await aiService.hasAnalysisForMonth(month);
      setHasExistingAnalysis(hasAnalysis);
      return hasAnalysis;
    } catch (error) {
      console.error('Erro ao verificar análise existente:', error);
      setHasExistingAnalysis(false);
      return false;
    }
  }, []);

  // Função para deletar análise de um mês
  const deleteAnalysis = useCallback(async (month: string) => {
    try {
      await aiService.deleteAnalysisForMonth(month);
      setHasExistingAnalysis(false);
      setAnalysis(null);
    } catch (error) {
      console.error('Erro ao deletar análise:', error);
      throw error;
    }
  }, []);

  return {
    analysis,
    loading,
    error,
    hasExistingAnalysis,
    analyzeFinancialData,
    getQuickSuggestions,
    clearAnalysis,
    checkExistingAnalysis,
    deleteAnalysis
  };
}
