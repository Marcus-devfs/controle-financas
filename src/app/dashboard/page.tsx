/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useFinanceData } from "@/hooks/useFinanceData";
import { formatCurrency, formatMonth } from "@/lib/data";
import { useUserId } from "@/hooks/useUserId";
import { CreditCardExpenses, CreditCardSummary } from "./CreditCardComponents";
import { Transaction } from "@/lib/types";
import { useAIAnalysis } from "@/hooks/useAIAnalysis";
import { AIQuickSuggestions } from "@/components/AIQuickSuggestions";
import { useEffect, useState } from "react";

export default function DashboardHome() {
  const userId = useUserId();
  
  const { 
    transactions,
    categories,
    creditCards,
    stats, 
    loading, 
    currentMonth,
    setCurrentMonth, 
    getAvailableMonths 
  } = useFinanceData(userId);

  const { getQuickSuggestions } = useAIAnalysis();
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Carregar sugestões da IA quando os dados mudarem
  useEffect(() => {
    if (transactions && categories && stats && currentMonth) {
      setAiLoading(true);
      getQuickSuggestions(transactions, categories, stats, currentMonth)
        .then(setAiSuggestions)
        .catch(console.error)
        .finally(() => setAiLoading(false));
    }
  }, [transactions, categories, stats, currentMonth, getQuickSuggestions]);

  if (loading || !stats || !transactions) {
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
        <RecentTransactions transactions={transactions} />
      </div>

      {/* Gastos do Cartão */}
      {creditCards && creditCards.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CreditCardExpenses 
            currentMonthData={{ transactions, categories, creditCards }}
            creditCards={creditCards}
          />
          <CreditCardSummary 
            creditCards={creditCards}
            currentMonthData={{ transactions, categories, creditCards }}
          />
        </div>
      )}

      {/* Sugestões da IA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AIQuickSuggestions 
            suggestions={aiSuggestions}
            loading={aiLoading}
            onSuggestionClick={(suggestion) => {
              console.log('Sugestão clicada:', suggestion);
              // Aqui você pode implementar ações específicas para cada sugestão
            }}
          />
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📊</span>
              </div>
              <h3 className="font-semibold text-gray-800">Análise Financeira</h3>
            </div>
            <div className="text-sm text-gray-600">
              <p className="mb-2">
                <strong>Receita vs Despesa:</strong> {formatCurrency(stats.totalIncome)} vs {formatCurrency(stats.totalExpenses)}
              </p>
              <p className="mb-2">
                <strong>Margem:</strong> {formatCurrency(stats.balance)} ({((stats.balance / stats.totalIncome) * 100).toFixed(1)}%)
              </p>
              <p>
                <strong>Status:</strong> {stats.balance > 0 ? '✅ Positivo' : '⚠️ Negativo'}
              </p>
            </div>
          </div>
        </div>
      </div>
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
      className="px-3 py-2 rounded-lg border border-black/10 bg-background text-foreground"
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
    balance: value >= 0 ? 'text-green-600' : 'text-red-600',
    income: 'text-green-600',
    expense: 'text-red-600',
    investment: 'text-blue-600'
  };

  const bgColors = {
    balance: value >= 0 ? 'bg-green-50' : 'bg-red-50',
    income: 'bg-green-50',
    expense: 'bg-red-50',
    investment: 'bg-blue-50'
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
            <span className="text-green-600">{formatCurrency(fixedIncome)}</span>
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
            <span className="text-green-600">{formatCurrency(variableIncome)}</span>
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
            <span className="text-red-600">{formatCurrency(fixedExpenses)}</span>
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
            <span className="text-red-600">{formatCurrency(variableExpenses)}</span>
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

function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  const allTransactions = transactions
    .map((t: Transaction) => ({
      ...t,
      displayType: t.isFixed ? 
        (t.type === 'income' ? 'Receita Fixa' : t.type === 'expense' ? 'Despesa Fixa' : 'Investimento') :
        (t.type === 'income' ? 'Receita Variável' : t.type === 'expense' ? 'Despesa Variável' : 'Investimento')
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

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
                  ? 'text-green-600'
                  : 'text-red-600'
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


