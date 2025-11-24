"use client";

import { useBudgetGoals } from "@/hooks/useBudgetGoals";
import { formatCurrency } from "@/lib/data";
import { useState, useEffect } from "react";
import { CategoryGoal, BudgetGoalsAnalysis } from "@/lib/aiService";

export default function ConsultorIAPage() {
  const {
    goals,
    loading,
    error,
    hasExistingGoals,
    generateGoals,
    checkExistingGoals,
    loadExistingGoals,
    deleteGoals
  } = useBudgetGoals();

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    checkExistingGoals();
  }, [checkExistingGoals]);

  const handleGenerateGoals = async () => {
    setIsGenerating(true);
    try {
      await generateGoals();
    } catch (err) {
      console.error('Erro ao gerar metas:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadExisting = async () => {
    setIsGenerating(true);
    try {
      await loadExistingGoals();
    } catch (err) {
      console.error('Erro ao carregar metas:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteGoals = async () => {
    if (confirm('Tem certeza que deseja deletar as metas? Você precisará gerar novas metas.')) {
      try {
        await deleteGoals();
      } catch (err) {
        console.error('Erro ao deletar metas:', err);
      }
    }
  };

  if (loading || isGenerating) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7C7C] mb-4"></div>
            <p className="text-gray-600">Gerando suas metas personalizadas...</p>
            <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Consultor IA de Orçamento
            </h1>
            <p className="text-gray-600">
              Metas personalizadas baseadas nos seus últimos 3 meses de gastos
            </p>
          </div>
          <div className="flex gap-3">
            {hasExistingGoals && goals ? (
              <>
                <button
                  onClick={handleLoadExisting}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Recarregar
                </button>
                <button
                  onClick={handleDeleteGoals}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Deletar Metas
                </button>
              </>
            ) : null}
            <button
              onClick={handleGenerateGoals}
              disabled={isGenerating}
              className="px-6 py-2 bg-[#FF7C7C] text-white rounded-lg hover:bg-[#ff6b6b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {hasExistingGoals ? 'Regenerar Metas' : 'Gerar Metas'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {!goals && !hasExistingGoals && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="w-16 h-16 bg-[#FF7C7C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🤖</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhuma meta encontrada
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Clique em "Gerar Metas" para que nossa IA analise seus últimos 3 meses e crie metas personalizadas por categoria.
          </p>
          <button
            onClick={handleGenerateGoals}
            className="px-6 py-3 bg-[#FF7C7C] text-white rounded-lg hover:bg-[#ff6b6b] transition-colors font-medium"
          >
            Gerar Metas Agora
          </button>
        </div>
      )}

      {goals && (
        <div className="space-y-6">
          {/* Resumo */}
          <SummaryCard goals={goals} />

          {/* Breakdown Ideal */}
          <BudgetBreakdownCard goals={goals} />

          {/* Tabela de Metas */}
          <GoalsTable goals={goals} />

          {/* Metas por Categoria */}
          <CategoryGoalsList goals={goals} />

          {/* Resumo Final - Economia */}
          <SavingsSummaryCard goals={goals} />

          {/* Recomendações Gerais */}
          {goals.overallRecommendations && goals.overallRecommendations.length > 0 && (
            <RecommendationsCard recommendations={goals.overallRecommendations} />
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ goals }: { goals: BudgetGoalsAnalysis }) {
  return (
    <div className="bg-gradient-to-r from-[#FF7C7C] to-[#ff6b6b] rounded-xl p-6 text-white shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Resumo Financeiro</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm opacity-90 mb-1">Receita Média Mensal</p>
          <p className="text-2xl font-bold">{formatCurrency(goals.averageMonthlyIncome)}</p>
        </div>
        <div>
          <p className="text-sm opacity-90 mb-1">Despesa Média Mensal</p>
          <p className="text-2xl font-bold">{formatCurrency(goals.averageMonthlyExpenses)}</p>
        </div>
        <div>
          <p className="text-sm opacity-90 mb-1">Saldo Médio</p>
          <p className="text-2xl font-bold">
            {formatCurrency(goals.averageMonthlyIncome - goals.averageMonthlyExpenses)}
          </p>
        </div>
      </div>
      {goals.summary && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-sm opacity-95">{goals.summary}</p>
        </div>
      )}
    </div>
  );
}

function BudgetBreakdownCard({ goals }: { goals: BudgetGoalsAnalysis }) {
  const { needs, wants, savings } = goals.idealBudgetBreakdown;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Distribuição Ideal do Orçamento</h2>
      <div className="space-y-4">
        <BudgetBar
          label="Necessidades"
          value={needs}
          color="bg-blue-500"
          description="Moradia, alimentação, transporte, saúde"
        />
        <BudgetBar
          label="Desejos"
          value={wants}
          color="bg-purple-500"
          description="Lazer, entretenimento, compras"
        />
        <BudgetBar
          label="Poupança/Investimentos"
          value={savings}
          color="bg-green-500"
          description="Reserva de emergência e investimentos"
        />
      </div>
    </div>
  );
}

function BudgetBar({
  label,
  value,
  color,
  description
}: {
  label: string;
  value: number;
  color: string;
  description: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <p className="text-lg font-semibold text-gray-900">{value}%</p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`${color} h-full rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function CategoryGoalsList({ goals }: { goals: BudgetGoalsAnalysis }) {
  const expenseGoals = goals.categoryGoals.filter(g => g.categoryType === 'expense');
  const incomeGoals = goals.categoryGoals.filter(g => g.categoryType === 'income');

  return (
    <div className="space-y-6">
      {/* Metas de Despesas */}
      {expenseGoals.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Metas de Despesas por Categoria</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expenseGoals.map((goal, index) => (
              <CategoryGoalCard key={goal.categoryId || index} goal={goal} />
            ))}
          </div>
        </div>
      )}

      {/* Metas de Receitas */}
      {incomeGoals.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Metas de Receitas por Categoria</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incomeGoals.map((goal, index) => (
              <CategoryGoalCard key={goal.categoryId || index} goal={goal} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryGoalCard({ goal }: { goal: CategoryGoal }) {
  const isExpense = goal.categoryType === 'expense';
  const isPositive = goal.difference >= 0;
  const progress = goal.currentAverage > 0
    ? Math.min((goal.recommendedGoal / goal.currentAverage) * 100, 100)
    : 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{goal.categoryName}</h3>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(goal.priority)}`}>
            {goal.priority === 'high' ? 'Alta Prioridade' : goal.priority === 'medium' ? 'Média Prioridade' : 'Baixa Prioridade'}
          </span>
        </div>
        {goal.paymentMethod && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {goal.paymentMethod === 'card' ? '💳 Cartão' : goal.paymentMethod === 'cash' ? '💵 Dinheiro' : 'Ambos'}
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Média Atual</span>
            <span className="font-medium text-gray-900">{formatCurrency(goal.currentAverage)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Meta Recomendada</span>
            <span className={`font-semibold ${isExpense ? (isPositive ? 'text-green-600' : 'text-red-600') : 'text-blue-600'}`}>
              {formatCurrency(goal.recommendedGoal)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${isExpense ? (isPositive ? 'bg-green-500' : 'bg-red-500') : 'bg-blue-500'}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-600">% da Receita</span>
            <div className="flex items-center gap-2">
              <span className={`font-medium ${goal.percentageOfIncome > goal.idealPercentage ? 'text-red-600' : 'text-green-600'}`}>
                {goal.percentageOfIncome.toFixed(1)}%
              </span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">{goal.idealPercentage.toFixed(1)}%</span>
            </div>
          </div>
          {goal.difference !== 0 && (
            <div className={`text-xs font-medium ${isExpense ? (isPositive ? 'text-green-600' : 'text-red-600') : 'text-blue-600'}`}>
              {isExpense
                ? isPositive
                  ? `Economia possível: ${formatCurrency(Math.abs(goal.difference))}`
                  : `Redução necessária: ${formatCurrency(Math.abs(goal.difference))}`
                : `Aumento sugerido: ${formatCurrency(Math.abs(goal.difference))}`}
            </div>
          )}
        </div>

        {goal.reasoning && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-600 leading-relaxed">{goal.reasoning}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GoalsTable({ goals }: { goals: BudgetGoalsAnalysis }) {
  const expenseGoals = goals.categoryGoals.filter(g => g.categoryType === 'expense');
  
  // Calcular totais
  const totalCurrent = expenseGoals.reduce((sum, g) => sum + g.currentAverage, 0);
  const totalGoal = expenseGoals.reduce((sum, g) => sum + g.recommendedGoal, 0);
  const totalDifference = totalGoal - totalCurrent;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm overflow-hidden">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumo de Metas - Tabela Detalhada</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Categoria</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Gasto Médio</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Meta Recomendada</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Diferença</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">% Receita</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Prioridade</th>
            </tr>
          </thead>
          <tbody>
            {expenseGoals.map((goal, index) => {
              const isPositive = goal.difference >= 0;
              const getPriorityBadge = (priority: string) => {
                switch (priority) {
                  case 'high':
                    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Alta</span>;
                  case 'medium':
                    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Média</span>;
                  case 'low':
                    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Baixa</span>;
                  default:
                    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">-</span>;
                }
              };

              return (
                <tr key={goal.categoryId || index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{goal.categoryName}</div>
                    {goal.paymentMethod && (
                      <div className="text-xs text-gray-500 mt-1">
                        {goal.paymentMethod === 'card' ? '💳 Cartão' : goal.paymentMethod === 'cash' ? '💵 Dinheiro' : '💳💵 Ambos'}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900 font-medium">
                    {formatCurrency(goal.currentAverage)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(goal.recommendedGoal)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}{formatCurrency(goal.difference)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-gray-600">
                    <div className="flex items-center justify-end gap-1">
                      <span className={goal.percentageOfIncome > goal.idealPercentage ? 'text-red-600 font-medium' : 'text-gray-600'}>
                        {goal.percentageOfIncome.toFixed(1)}%
                      </span>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-600">{goal.idealPercentage.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {getPriorityBadge(goal.priority)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-semibold">
              <td className="py-4 px-4 text-gray-900">TOTAL</td>
              <td className="py-4 px-4 text-right text-gray-900">{formatCurrency(totalCurrent)}</td>
              <td className="py-4 px-4 text-right">
                <span className={totalDifference >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(totalGoal)}
                </span>
              </td>
              <td className="py-4 px-4 text-right">
                <span className={`font-semibold ${totalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalDifference >= 0 ? '+' : ''}{formatCurrency(totalDifference)}
                </span>
              </td>
              <td className="py-4 px-4 text-right text-gray-600">
                {((totalCurrent / goals.averageMonthlyIncome) * 100).toFixed(1)}% / {((totalGoal / goals.averageMonthlyIncome) * 100).toFixed(1)}%
              </td>
              <td className="py-4 px-4"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function SavingsSummaryCard({ goals }: { goals: BudgetGoalsAnalysis }) {
  const expenseGoals = goals.categoryGoals.filter(g => g.categoryType === 'expense');
  
  // Calcular totais
  const totalCurrentExpenses = expenseGoals.reduce((sum, g) => sum + g.currentAverage, 0);
  const totalGoalExpenses = expenseGoals.reduce((sum, g) => sum + g.recommendedGoal, 0);
  const totalSavings = totalCurrentExpenses - totalGoalExpenses; // Economia = atual - meta
  
  // Calcular novo saldo
  const currentBalance = goals.averageMonthlyIncome - totalCurrentExpenses;
  const projectedBalance = goals.averageMonthlyIncome - totalGoalExpenses;
  const balanceImprovement = projectedBalance - currentBalance;
  
  // Calcular economia anual
  const annualSavings = totalSavings * 12;
  
  // Calcular porcentagem de economia
  const savingsPercentage = goals.averageMonthlyIncome > 0 
    ? (totalSavings / goals.averageMonthlyIncome) * 100 
    : 0;

  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">Resumo de Economia Projetada</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <p className="text-sm opacity-90 mb-1">Gasto Mensal Atual</p>
          <p className="text-2xl font-bold">{formatCurrency(totalCurrentExpenses)}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <p className="text-sm opacity-90 mb-1">Gasto Mensal com Metas</p>
          <p className="text-2xl font-bold">{formatCurrency(totalGoalExpenses)}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <p className="text-sm opacity-90 mb-1">Economia Mensal</p>
          <p className="text-2xl font-bold">{formatCurrency(totalSavings)}</p>
          <p className="text-xs opacity-75 mt-1">{savingsPercentage.toFixed(1)}% da receita</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <p className="text-sm opacity-90 mb-1">Economia Anual</p>
          <p className="text-2xl font-bold">{formatCurrency(annualSavings)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/20">
        <div>
          <p className="text-sm opacity-90 mb-2">Saldo Mensal Atual</p>
          <p className={`text-3xl font-bold ${currentBalance >= 0 ? 'text-green-100' : 'text-red-200'}`}>
            {formatCurrency(currentBalance)}
          </p>
        </div>
        <div>
          <p className="text-sm opacity-90 mb-2">Saldo Mensal Projetado (com metas)</p>
          <p className={`text-3xl font-bold ${projectedBalance >= 0 ? 'text-green-100' : 'text-red-200'}`}>
            {formatCurrency(projectedBalance)}
          </p>
          <p className="text-sm opacity-75 mt-2">
            {balanceImprovement >= 0 ? '↗' : '↘'} {formatCurrency(Math.abs(balanceImprovement))} de melhoria
          </p>
        </div>
      </div>

      {totalSavings > 0 && (
        <div className="mt-6 pt-4 border-t border-white/20">
          <p className="text-sm opacity-90 mb-2">💡 Com essas metas, você poderia:</p>
          <ul className="text-sm opacity-90 space-y-1">
            <li>• Criar uma reserva de emergência de {formatCurrency(annualSavings)} em 1 ano</li>
            <li>• Investir {formatCurrency(totalSavings)} por mês para o futuro</li>
            <li>• Reduzir dívidas em {formatCurrency(annualSavings)} por ano</li>
          </ul>
        </div>
      )}
    </div>
  );
}

function RecommendationsCard({ recommendations }: { recommendations: string[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Recomendações Gerais</h2>
      <ul className="space-y-3">
        {recommendations.map((rec, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="text-[#FF7C7C] mt-1">•</span>
            <p className="text-gray-700 flex-1">{rec}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
