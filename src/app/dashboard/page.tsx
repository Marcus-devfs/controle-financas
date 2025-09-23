/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useFinanceData } from "@/hooks/useFinanceData";
import { formatCurrency, formatMonth } from "@/lib/data";
import { useUserId } from "./layout";
import { CreditCardExpenses, CreditCardSummary } from "./CreditCardComponents";

export default function DashboardHome() {
  const userId = useUserId();
  
  const { 
    currentMonthData, 
    stats, 
    loading, 
    currentMonth,
    setCurrentMonth, 
    getAvailableMonths 
  } = useFinanceData(userId);

  if (loading || !stats || !currentMonthData) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-foreground/10 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-foreground/10 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const availableMonths = getAvailableMonths();
  const allMonths = [...availableMonths];
  if (!allMonths.includes(currentMonth)) {
    allMonths.unshift(currentMonth);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Visão geral</h1>
        <MonthSelector 
          selectedMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          availableMonths={allMonths}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Saldo do Mês" 
          value={stats.balance} 
          type="balance"
          subtitle={formatMonth(currentMonth)}
        />
        <StatCard 
          title="Total Receitas" 
          value={stats.totalIncome} 
          type="income"
          subtitle={`Fixo: ${formatCurrency(stats.fixedIncome)}`}
        />
        <StatCard 
          title="Total Despesas" 
          value={stats.totalExpenses} 
          type="expense"
          subtitle={`Fixo: ${formatCurrency(stats.fixedExpenses)}`}
        />
        <StatCard 
          title="Investimentos" 
          value={stats.totalInvestments} 
          type="investment"
          subtitle="Este mês"
        />
      </div>

      {/* Cartões de crédito */}
      {stats.creditCardDebt > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard 
            title="Dívida Cartão" 
            value={stats.creditCardDebt} 
            type="expense"
            subtitle="Pendente de pagamento"
          />
          <StatCard 
            title="Crédito Disponível" 
            value={stats.availableCredit} 
            type="balance"
            subtitle="Limite disponível"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncomeExpenseBreakdown 
          fixedIncome={stats.fixedIncome}
          variableIncome={stats.variableIncome}
          fixedExpenses={stats.fixedExpenses}
          variableExpenses={stats.variableExpenses}
        />
        <RecentTransactions transactions={currentMonthData} />
      </div>

      {/* Gastos do Cartão */}
      {currentMonthData.creditCards && currentMonthData.creditCards.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CreditCardExpenses 
            currentMonthData={currentMonthData}
            creditCards={currentMonthData.creditCards}
          />
          <CreditCardSummary 
            creditCards={currentMonthData.creditCards}
            currentMonthData={currentMonthData}
          />
        </div>
      )}
    </div>
  );
}

function MonthSelector({ 
  selectedMonth, 
  onMonthChange, 
  availableMonths 
}: { 
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  availableMonths: string[];
}) {
  return (
    <select
      value={selectedMonth}
      onChange={(e) => onMonthChange(e.target.value)}
      className="px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-background text-foreground"
    >
      {availableMonths.map(month => (
        <option key={month} value={month}>
          {formatMonth(month)}
        </option>
      ))}
    </select>
  );
}

function StatCard({ 
  title, 
  value, 
  type, 
  subtitle 
}: { 
  title: string; 
  value: number; 
  type: 'balance' | 'income' | 'expense' | 'investment';
  subtitle: string;
}) {
  const colors = {
    balance: value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
    income: 'text-green-600 dark:text-green-400',
    expense: 'text-red-600 dark:text-red-400',
    investment: 'text-blue-600 dark:text-blue-400'
  };

  const bgColors = {
    balance: value >= 0 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20',
    income: 'bg-green-50 dark:bg-green-950/20',
    expense: 'bg-red-50 dark:bg-red-950/20',
    investment: 'bg-blue-50 dark:bg-blue-950/20'
  };

  return (
    <div className={`card p-6 ${bgColors[type]} animate-fade-in`}>
      <div className="text-sm text-muted-foreground mb-1">{title}</div>
      <div className={`text-2xl font-bold ${colors[type]}`}>
        {formatCurrency(value)}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
    </div>
  );
}

function IncomeExpenseBreakdown({
  fixedIncome,
  variableIncome,
  fixedExpenses,
  variableExpenses
}: {
  fixedIncome: number;
  variableIncome: number;
  fixedExpenses: number;
  variableExpenses: number;
}) {
  return (
    <div className="card p-6 animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">Receitas vs Despesas</h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Receitas Fixas</span>
            <span className="text-green-600 dark:text-green-400">{formatCurrency(fixedIncome)}</span>
          </div>
          <div className="w-full bg-foreground/10 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${Math.min(100, (fixedIncome / (fixedIncome + variableIncome + fixedExpenses + variableExpenses)) * 100)}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Receitas Variáveis</span>
            <span className="text-green-600 dark:text-green-400">{formatCurrency(variableIncome)}</span>
          </div>
          <div className="w-full bg-foreground/10 rounded-full h-2">
            <div 
              className="bg-green-400 h-2 rounded-full" 
              style={{ width: `${Math.min(100, (variableIncome / (fixedIncome + variableIncome + fixedExpenses + variableExpenses)) * 100)}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Despesas Fixas</span>
            <span className="text-red-600 dark:text-red-400">{formatCurrency(fixedExpenses)}</span>
          </div>
          <div className="w-full bg-foreground/10 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full" 
              style={{ width: `${Math.min(100, (fixedExpenses / (fixedIncome + variableIncome + fixedExpenses + variableExpenses)) * 100)}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Despesas Variáveis</span>
            <span className="text-red-600 dark:text-red-400">{formatCurrency(variableExpenses)}</span>
          </div>
          <div className="w-full bg-foreground/10 rounded-full h-2">
            <div 
              className="bg-red-400 h-2 rounded-full" 
              style={{ width: `${Math.min(100, (variableExpenses / (fixedIncome + variableIncome + fixedExpenses + variableExpenses)) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentTransactions({ transactions }: { transactions: any }) {
  const allTransactions = [
    ...transactions.fixedIncome.map((t: any) => ({ ...t, type: 'Receita Fixa' })),
    ...transactions.variableIncome.map((t: any) => ({ ...t, type: 'Receita Variável' })),
    ...transactions.fixedExpenses.map((t: any) => ({ ...t, type: 'Despesa Fixa' })),
    ...transactions.variableExpenses.map((t: any) => ({ ...t, type: 'Despesa Variável' })),
    ...transactions.investments.map((t: any) => ({ ...t, type: 'Investimento' }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="card p-6 animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">Transações Recentes</h3>
      <div className="space-y-3">
        {allTransactions.length === 0 ? (
          <p className="text-foreground/60 text-sm">Nenhuma transação registrada</p>
        ) : (
          allTransactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium">{transaction.description}</div>
                <div className="text-xs text-foreground/60">{transaction.type}</div>
              </div>
              <div className={`text-sm font-medium ${
                transaction.type.includes('Receita') || transaction.type.includes('Investimento')
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(transaction.amount)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


