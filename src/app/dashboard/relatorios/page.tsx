"use client";

import { useReportsData } from "@/hooks/useReportsData";
import { formatCurrency, formatMonth } from "@/lib/data";
import { Category, Transaction } from "@/lib/types";
import { useUserId } from "@/hooks/useUserId";
import { useState, useEffect } from "react";
import { PieChart } from "@/components/PieChart";
import { BarChart } from "@/components/BarChart";
import { useAIAnalysis } from "@/hooks/useAIAnalysis";
import { AIAnalysisCard } from "@/components/AIAnalysisCard";
import { AIAnalysisModal } from "@/components/AIAnalysisModal";

export default function RelatoriosPage() {
  const userId = useUserId();
  
  const { 
    transactions,
    categories,
    loading, 
    currentMonth,
    setCurrentMonth, 
    getAvailableMonths,
    getMonthData,
    loadMonthlyTrendData
  } = useReportsData(userId);

  const { 
    analyzeFinancialData, 
    analysis, 
    loading: aiLoading, 
    error: aiError, 
    hasExistingAnalysis,
    checkExistingAnalysis,
    deleteAnalysis
  } = useAIAnalysis();
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  const handleAIAnalysis = async () => {
    if (transactions && categories) {
      setShowAIModal(true);
      try {
        // Criar stats básicos para a análise
        const monthlyIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const monthlyExpenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const stats = {
          totalIncome: monthlyIncome,
          totalExpenses: monthlyExpenses,
          balance: monthlyIncome - monthlyExpenses,
          fixedIncome: 0,
          variableIncome: 0,
          fixedExpenses: 0,
          variableExpenses: 0,
          totalInvestments: 0,
          creditCardDebt: 0,
          availableCredit: 0
        };

        await analyzeFinancialData(transactions, categories, stats, currentMonth);
      } catch (error) {
        console.error('Erro na análise de IA:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowAIModal(false);
  };

  // Verificar se existe análise quando o mês mudar
  useEffect(() => {
    if (currentMonth) {
      checkExistingAnalysis(currentMonth);
    }
  }, [currentMonth, checkExistingAnalysis]);

  const handleViewExistingAnalysis = async () => {
    if (transactions && categories) {
      setShowAIModal(true);
      try {
        // Criar stats básicos para a análise
        const monthlyIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const monthlyExpenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const stats = {
          totalIncome: monthlyIncome,
          totalExpenses: monthlyExpenses,
          balance: monthlyIncome - monthlyExpenses,
          fixedIncome: 0,
          variableIncome: 0,
          fixedExpenses: 0,
          variableExpenses: 0,
          totalInvestments: 0,
          creditCardDebt: 0,
          availableCredit: 0
        };

        // Isso vai buscar a análise existente do banco
        await analyzeFinancialData(transactions, categories, stats, currentMonth);
      } catch (error) {
        console.error('Erro ao carregar análise existente:', error);
      }
    }
  };

  const handleRegenerateAnalysis = async () => {
    if (transactions && categories) {
      try {
        // Deletar análise existente
        await deleteAnalysis(currentMonth);
        
        // Gerar nova análise
        await handleAIAnalysis();
      } catch (error) {
        console.error('Erro ao regenerar análise:', error);
      }
    }
  };

  if (loading || !transactions || !categories) {
    return <div className="space-y-4">Carregando...</div>;
  }

  const availableMonths = getAvailableMonths();
  const allMonths = [...availableMonths];
  if (!allMonths.includes(currentMonth)) {
    allMonths.unshift(currentMonth);
  }

  // Verificar se as transações estão no mês correto
  const currentMonthTransactions = transactions.filter(t => t.month === currentMonth);

  // Calcular dados para gráficos usando apenas transações do mês atual
  const categoryExpenses = categories
    .filter(cat => cat.type === 'expense')
    .map(category => {
      const categoryTransactions = currentMonthTransactions.filter(t => {
        const categoryId = typeof t.categoryId === 'object' ? (t.categoryId as any)._id : t.categoryId;
        return t.type === 'expense' && categoryId === category.id;
      });
      const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      return { ...category, total };
    })
    .filter(cat => cat.total > 0)
    .sort((a, b) => b.total - a.total);

  const categoryIncome = categories
    .filter(cat => cat.type === 'income')
    .map(category => {
      const categoryTransactions = currentMonthTransactions.filter(t => {
        const categoryId = typeof t.categoryId === 'object' ? (t.categoryId as any)._id : t.categoryId;
        return t.type === 'income' && categoryId === category.id;
      });
      const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      return { ...category, total };
    })
    .filter(cat => cat.total > 0)
    .sort((a, b) => b.total - a.total);

  const totalExpenses = categoryExpenses.reduce((sum, cat) => sum + cat.total, 0);
  const totalIncome = categoryIncome.reduce((sum, cat) => sum + cat.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Relatórios</h1>
        <div className="flex items-center gap-4">
          {hasExistingAnalysis ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleViewExistingAnalysis}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold flex items-center gap-2"
              >
                <span>👁️</span>
                Ver Análise do Consultor IA
              </button>
              <button
                onClick={handleRegenerateAnalysis}
                disabled={aiLoading}
                className="px-3 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2 text-sm"
              >
                {aiLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Regenerando...
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    Regenerar
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleAIAnalysis}
              disabled={aiLoading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
            >
              {aiLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Analisando...
                </>
              ) : (
                <>
                  <span>🤖</span>
                  Análise com IA
                </>
              )}
            </button>
          )}
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="px-3 py-2 rounded-lg border border-black/10 bg-background text-foreground"
          >
            {allMonths.map(month => (
              <option key={month} value={month}>
                {formatMonth(month)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseChart 
          categories={categoryExpenses} 
          total={totalExpenses}
          title="Despesas por Categoria"
        />
        <IncomeChart 
          categories={categoryIncome} 
          total={totalIncome}
          title="Receitas por Categoria"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MonthlyTrend 
          months={allMonths.slice(0, 6)} 
          loadMonthlyTrendData={loadMonthlyTrendData}
        />
        <CategoryBreakdown 
          categories={categories}
          transactions={currentMonthTransactions}
        />
        <QuickStats 
          transactions={currentMonthTransactions}
        />
      </div>

      {/* NOVOS GRÁFICOS - Adicionados abaixo de tudo */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-6 text-center">📊 Novos Gráficos Visuais</h2>
        
        {/* Gráficos de Pizza */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PieChart 
            data={categoryExpenses.map(cat => ({
              name: cat.name,
              value: cat.total,
              color: cat.color
            }))}
            total={totalExpenses}
            title="🥧 Despesas por Categoria (Pizza)"
          />
          <PieChart 
            data={categoryIncome.map(cat => ({
              name: cat.name,
              value: cat.total,
              color: cat.color
            }))}
            total={totalIncome}
            title="🥧 Receitas por Categoria (Pizza)"
          />
        </div>

        {/* Gráfico Fixas vs Variáveis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <FixedVsVariableChart 
            transactions={currentMonthTransactions}
          />
          <RecurringVsOneTimeChart 
            transactions={currentMonthTransactions}
          />
        </div>

        {/* Gráfico de Barras para Tendência */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <MonthlyTrendBarChart 
            months={allMonths.slice(0, 6)} 
            loadMonthlyTrendData={loadMonthlyTrendData}
          />
        </div>

        {/* Gráfico de Comparação por Tipo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <IncomeVsExpenseChart 
            transactions={currentMonthTransactions}
          />
          <CreditCardExpensesChart 
            transactions={currentMonthTransactions}
          />
          <MonthlyComparisonChart 
            transactions={currentMonthTransactions}
            currentMonth={currentMonth}
          />
        </div>
      </div>

      {/* Modal de Análise de IA */}
      <AIAnalysisModal
        analysis={analysis}
        isOpen={showAIModal}
        onClose={handleCloseModal}
        loading={aiLoading}
      />
    </div>
  );
}

function ExpenseChart({ categories, total, title }: { 
  categories: (Category & { total: number })[];
  total: number;
  title: string;
}) {
  return (
    <div className="rounded-xl border border-black/10 p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {categories.length === 0 ? (
        <p className="text-foreground/60 text-center py-8">Nenhuma despesa registrada</p>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => {
            const percentage = total > 0 ? (category.total / total) * 100 : 0;
            return (
              <div key={category.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    {category.name}
                  </span>
                  <span className="font-medium">{formatCurrency(category.total)}</span>
                </div>
                <div className="w-full bg-foreground/10 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: category.color
                    }}
                  ></div>
                </div>
                <div className="text-xs text-foreground/60">
                  {percentage.toFixed(1)}% do total
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IncomeChart({ categories, total, title }: { 
  categories: (Category & { total: number })[];
  total: number;
  title: string;
}) {
  return (
    <div className="rounded-xl border border-black/10 p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {categories.length === 0 ? (
        <p className="text-foreground/60 text-center py-8">Nenhuma receita registrada</p>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => {
            const percentage = total > 0 ? (category.total / total) * 100 : 0;
            return (
              <div key={category.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    {category.name}
                  </span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(category.total)}
                  </span>
                </div>
                <div className="w-full bg-foreground/10 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: category.color
                    }}
                  ></div>
                </div>
                <div className="text-xs text-foreground/60">
                  {percentage.toFixed(1)}% do total
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MonthlyTrend({ 
  months, 
  loadMonthlyTrendData 
}: { 
  months: string[];
  loadMonthlyTrendData: (months: string[]) => Promise<Record<string, any[]>>;
}) {
  const [monthlyData, setMonthlyData] = useState<Array<{month: string, income: number, expenses: number, balance: number}>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (months.length === 0) return;
      
      setLoading(true);
      try {
        // Carregar dados de todos os meses de uma vez
        const trendData = await loadMonthlyTrendData(months);
        
        // Processar dados
        const processedData = months.map(month => {
          const transactions = trendData[month] || [];
          const income = transactions
            .filter((t: any) => t.type === 'income')
            .reduce((sum: number, t: any) => sum + t.amount, 0);
          const expenses = transactions
            .filter((t: any) => t.type === 'expense')
            .reduce((sum: number, t: any) => sum + t.amount, 0);
          return { month, income, expenses, balance: income - expenses };
        });
        
        setMonthlyData(processedData);
      } catch (error) {
        console.error('Erro ao carregar dados de tendência:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [months, loadMonthlyTrendData]);

  const maxValue = Math.max(...monthlyData.map(d => Math.max(d.income, d.expenses)));

  return (
    <div className="rounded-xl border border-black/10 p-6">
      <h3 className="text-lg font-semibold mb-4">Tendência Mensal</h3>
      <div className="space-y-4">
        {monthlyData.map((data) => (
          <div key={data.month} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{formatMonth(data.month)}</span>
              <span className={`font-medium ${data.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.balance)}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-foreground/70">
                <span>Receitas: {formatCurrency(data.income)}</span>
                <span>Despesas: {formatCurrency(data.expenses)}</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500"
                  style={{ width: `${maxValue > 0 ? (data.income / maxValue) * 100 : 0}%` }}
                ></div>
                <div 
                  className="bg-red-500"
                  style={{ width: `${maxValue > 0 ? (data.expenses / maxValue) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryBreakdown({ 
  categories, 
  transactions 
}: { 
  categories: Category[];
  transactions: Transaction[];
}) {

  const categoryStats = categories?.map(category => {
    const categoryTransactions = transactions.filter((t: Transaction) => {
      const categoryId = typeof t.categoryId === 'object' ? (t.categoryId as any)._id : t.categoryId;
      return categoryId === category.id;
    });

    const total = categoryTransactions.reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    const count = categoryTransactions.length;


    return { ...category, total, count };
  }).filter(cat => cat.total > 0).sort((a, b) => b.total - a.total);

  console.log('categoryStats', categoryStats);
  console.log('categories', categories);
  console.log('transactions', transactions);


  return (
    <div className="rounded-xl border border-black/10 p-6">
      <h3 className="text-lg font-semibold mb-4">Resumo por Categoria</h3>
      <div className="space-y-3">
        {categoryStats.map((category) => (
          <div key={category.id} className="flex items-center justify-between p-3 rounded-lg bg-foreground/5">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: category.color }}
              ></div>
              <div>
                <div className="font-medium">{category.name}</div>
                <div className="text-xs text-foreground/60">
                  {category.count} transação{category.count !== 1 ? 'ões' : ''}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">{formatCurrency(category.total)}</div>
              <div className="text-xs text-foreground/60">
                {category.type === 'income' ? 'Receita' : 
                 category.type === 'expense' ? 'Despesa' : 'Investimento'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickStats({ transactions }: { transactions: Transaction[] }) {
  const totalIncome = transactions
    .filter((t: Transaction) => t.type === 'income')
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter((t: Transaction) => t.type === 'expense')
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
  const totalInvestments = transactions
    .filter((t: Transaction) => t.type === 'investment')
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  const savingsRate = totalIncome > 0 ? ((balance - totalInvestments) / totalIncome) * 100 : 0;

  return (
    <div className="rounded-xl border border-black/10 p-6">
      <h3 className="text-lg font-semibold mb-4">Estatísticas Rápidas</h3>
      <div className="space-y-4">
        <div className="text-center p-4 rounded-lg bg-foreground/5">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalIncome)}
          </div>
          <div className="text-sm text-foreground/70">Total de Receitas</div>
        </div>
        
        <div className="text-center p-4 rounded-lg bg-foreground/5">
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="text-sm text-foreground/70">Total de Despesas</div>
        </div>
        
        <div className="text-center p-4 rounded-lg bg-foreground/5">
          <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(balance)}
          </div>
          <div className="text-sm text-foreground/70">Saldo do Mês</div>
        </div>
        
        <div className="text-center p-4 rounded-lg bg-foreground/5">
          <div className="text-2xl font-bold text-blue-600">
            {savingsRate.toFixed(1)}%
          </div>
          <div className="text-sm text-foreground/70">Taxa de Poupança</div>
        </div>
      </div>
    </div>
  );
}

// NOVOS COMPONENTES DE GRÁFICOS

function FixedVsVariableChart({ transactions }: { transactions: Transaction[] }) {
  const fixedExpenses = transactions
    .filter(t => t.type === 'expense' && t.isFixed)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const variableExpenses = transactions
    .filter(t => t.type === 'expense' && !t.isFixed)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = fixedExpenses + variableExpenses;

  const data = [
    {
      name: 'Despesas Fixas',
      value: fixedExpenses,
      color: '#ef4444'
    },
    {
      name: 'Despesas Variáveis',
      value: variableExpenses,
      color: '#f97316'
    }
  ].filter(item => item.value > 0);

  return (
    <PieChart 
      data={data}
      total={totalExpenses}
      title="💰 Despesas Fixas vs Variáveis"
    />
  );
}

function RecurringVsOneTimeChart({ transactions }: { transactions: Transaction[] }) {
  const recurringExpenses = transactions
    .filter(t => t.type === 'expense' && t.isRecurring)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const oneTimeExpenses = transactions
    .filter(t => t.type === 'expense' && !t.isRecurring)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = recurringExpenses + oneTimeExpenses;

  const data = [
    {
      name: 'Despesas Recorrentes',
      value: recurringExpenses,
      color: '#8b5cf6'
    },
    {
      name: 'Despesas Únicas',
      value: oneTimeExpenses,
      color: '#06b6d4'
    }
  ].filter(item => item.value > 0);

  return (
    <PieChart 
      data={data}
      total={totalExpenses}
      title="🔄 Despesas Recorrentes vs Únicas"
    />
  );
}

function MonthlyTrendBarChart({ 
  months, 
  loadMonthlyTrendData 
}: { 
  months: string[];
  loadMonthlyTrendData: (months: string[]) => Promise<Record<string, any[]>>;
}) {
  const [monthlyData, setMonthlyData] = useState<Array<{month: string, income: number, expenses: number, balance: number}>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (months.length === 0) return;
      
      setLoading(true);
      try {
        const trendData = await loadMonthlyTrendData(months);
        
        const processedData = months.map(month => {
          const transactions = trendData[month] || [];
          const income = transactions
            .filter((t: any) => t.type === 'income')
            .reduce((sum: number, t: any) => sum + t.amount, 0);
          const expenses = transactions
            .filter((t: any) => t.type === 'expense')
            .reduce((sum: number, t: any) => sum + t.amount, 0);
          return { month, income, expenses, balance: income - expenses };
        });
        
        setMonthlyData(processedData);
      } catch (error) {
        console.error('Erro ao carregar dados de tendência:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [months, loadMonthlyTrendData]);

  if (loading) {
    return (
      <div className="rounded-xl border border-black/10 p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Tendência Mensal (Barras)</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-foreground/60">Carregando...</p>
        </div>
      </div>
    );
  }

  return <BarChart data={monthlyData} title="📊 Tendência Mensal (Barras)" />;
}

function IncomeVsExpenseChart({ transactions }: { transactions: Transaction[] }) {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const total = totalIncome + totalExpenses;

  const data = [
    {
      name: 'Receitas',
      value: totalIncome,
      color: '#10b981'
    },
    {
      name: 'Despesas',
      value: totalExpenses,
      color: '#ef4444'
    }
  ].filter(item => item.value > 0);

  return (
    <PieChart 
      data={data}
      total={total}
      title="💵 Receitas vs Despesas"
    />
  );
}

function CreditCardExpensesChart({ transactions }: { transactions: Transaction[] }) {
  const creditCardExpenses = transactions
    .filter(t => t.type === 'expense' && t.creditCardId)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const cashExpenses = transactions
    .filter(t => t.type === 'expense' && !t.creditCardId)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = creditCardExpenses + cashExpenses;

  const data = [
    {
      name: 'Cartão de Crédito',
      value: creditCardExpenses,
      color: '#3b82f6'
    },
    {
      name: 'Dinheiro/Débito',
      value: cashExpenses,
      color: '#84cc16'
    }
  ].filter(item => item.value > 0);

  return (
    <PieChart 
      data={data}
      total={totalExpenses}
      title="💳 Pagamento: Cartão vs Dinheiro"
    />
  );
}

function MonthlyComparisonChart({ 
  transactions, 
  currentMonth 
}: { 
  transactions: Transaction[];
  currentMonth: string;
}) {
  const currentMonthExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const currentMonthIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = currentMonthIncome - currentMonthExpenses;

  const data = [
    {
      name: 'Saldo Positivo',
      value: Math.max(0, balance),
      color: '#10b981'
    },
    {
      name: 'Saldo Negativo',
      value: Math.max(0, -balance),
      color: '#ef4444'
    }
  ].filter(item => item.value > 0);

  return (
    <PieChart 
      data={data}
      total={Math.abs(balance)}
      title="⚖️ Saldo do Mês"
    />
  );
}