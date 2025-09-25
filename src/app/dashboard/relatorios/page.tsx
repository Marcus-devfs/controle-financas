"use client";

import { useFinanceData } from "@/hooks/useFinanceData";
import { formatCurrency, formatMonth } from "@/lib/data";
import { Category } from "@/lib/types";
import { useUserId } from "../layout";

export default function RelatoriosPage() {
  const userId = useUserId();
  
  const { 
    currentMonthData, 
    loading, 
    currentMonth,
    setCurrentMonth, 
    getAvailableMonths,
    getMonthData
  } = useFinanceData(userId);

  if (loading || !currentMonthData) {
    return <div className="space-y-4">Carregando...</div>;
  }

  const availableMonths = getAvailableMonths();
  const allMonths = [...availableMonths];
  if (!allMonths.includes(currentMonth)) {
    allMonths.unshift(currentMonth);
  }

  // Calcular dados para gráficos
  const categoryExpenses = currentMonthData.categories
    .filter(cat => cat.type === 'expense')
    .map(category => {
      const total = [
        ...currentMonthData.fixedExpenses,
        ...currentMonthData.variableExpenses
      ]
      .filter(t => t.categoryId === category.id)
      .reduce((sum, t) => sum + t.amount, 0);
      
      return { ...category, total };
    })
    .filter(cat => cat.total > 0)
    .sort((a, b) => b.total - a.total);

  const categoryIncome = currentMonthData.categories
    .filter(cat => cat.type === 'income')
    .map(category => {
      const total = [
        ...currentMonthData.fixedIncome,
        ...currentMonthData.variableIncome
      ]
      .filter(t => t.categoryId === category.id)
      .reduce((sum, t) => sum + t.amount, 0);
      
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
        <select
          value={currentMonth}
          onChange={(e) => setCurrentMonth(e.target.value)}
          className="px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-background text-foreground"
        >
          {allMonths.map(month => (
            <option key={month} value={month}>
              {formatMonth(month)}
            </option>
          ))}
        </select>
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
          getMonthData={getMonthData}
        />
        <CategoryBreakdown 
          categories={currentMonthData.categories}
          monthData={currentMonthData}
        />
        <QuickStats 
          monthData={currentMonthData}
        />
      </div>
    </div>
  );
}

function ExpenseChart({ categories, total, title }: { 
  categories: (Category & { total: number })[];
  total: number;
  title: string;
}) {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-6">
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
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-6">
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
                  <span className="font-medium text-green-600 dark:text-green-400">
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
  getMonthData 
}: { 
  months: string[];
  getMonthData: (month: string) => any;
}) {
  const monthlyData = months.map(month => {
    const data = getMonthData(month);
    const income = data.fixedIncome.reduce((sum: number, t: any) => sum + t.amount, 0) +
                  data.variableIncome.reduce((sum: number, t: any) => sum + t.amount, 0);
    const expenses = data.fixedExpenses.reduce((sum: number, t: any) => sum + t.amount, 0) +
                    data.variableExpenses.reduce((sum: number, t: any) => sum + t.amount, 0);
    return { month, income, expenses, balance: income - expenses };
  });

  const maxValue = Math.max(...monthlyData.map(d => Math.max(d.income, d.expenses)));

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-6">
      <h3 className="text-lg font-semibold mb-4">Tendência Mensal</h3>
      <div className="space-y-4">
        {monthlyData.map((data) => (
          <div key={data.month} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{formatMonth(data.month)}</span>
              <span className={`font-medium ${data.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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
  monthData 
}: { 
  categories: Category[];
  monthData: any;
}) {
  const categoryStats = categories.map(category => {
    const transactions = [
      ...monthData.fixedIncome,
      ...monthData.variableIncome,
      ...monthData.fixedExpenses,
      ...monthData.variableExpenses,
      ...monthData.investments
    ].filter((t: any) => t.categoryId === category.id);

    const total = transactions.reduce((sum: number, t: any) => sum + t.amount, 0);
    const count = transactions.length;

    return { ...category, total, count };
  }).filter(cat => cat.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-6">
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

function QuickStats({ monthData }: { monthData: any }) {
  const totalIncome = monthData.fixedIncome.reduce((sum: number, t: any) => sum + t.amount, 0) +
                     monthData.variableIncome.reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalExpenses = monthData.fixedExpenses.reduce((sum: number, t: any) => sum + t.amount, 0) +
                       monthData.variableExpenses.reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalInvestments = monthData.investments.reduce((sum: number, t: any) => sum + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  const savingsRate = totalIncome > 0 ? ((balance - totalInvestments) / totalIncome) * 100 : 0;

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-6">
      <h3 className="text-lg font-semibold mb-4">Estatísticas Rápidas</h3>
      <div className="space-y-4">
        <div className="text-center p-4 rounded-lg bg-foreground/5">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totalIncome)}
          </div>
          <div className="text-sm text-foreground/70">Total de Receitas</div>
        </div>
        
        <div className="text-center p-4 rounded-lg bg-foreground/5">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="text-sm text-foreground/70">Total de Despesas</div>
        </div>
        
        <div className="text-center p-4 rounded-lg bg-foreground/5">
          <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(balance)}
          </div>
          <div className="text-sm text-foreground/70">Saldo do Mês</div>
        </div>
        
        <div className="text-center p-4 rounded-lg bg-foreground/5">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {savingsRate.toFixed(1)}%
          </div>
          <div className="text-sm text-foreground/70">Taxa de Poupança</div>
        </div>
      </div>
    </div>
  );
}