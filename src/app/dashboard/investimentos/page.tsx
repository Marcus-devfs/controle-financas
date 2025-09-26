"use client";

import { useFinanceData } from "@/hooks/useFinanceData";
import { formatCurrency, formatMonth } from "@/lib/data";
import { useState } from "react";
import { Transaction, Category } from "@/lib/types";
import { useUserId } from "../layout";
import { formatCurrencyWhileTyping, parseCurrencyInputNew, formatCurrencyInput } from "@/lib/utils";

export default function InvestimentosPage() {
  const userId = useUserId();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Transaction | null>(null);
  
  const { 
    transactions,
    categories,
    loading, 
    currentMonth,
    setCurrentMonth, 
    getAvailableMonths,
    addTransaction,
    updateTransaction,
    deleteTransaction
  } = useFinanceData(userId);

  if (loading || !transactions) {
    return <div className="space-y-4">Carregando...</div>;
  }

  const availableMonths = getAvailableMonths();
  const allMonths = [...availableMonths];
  if (!allMonths.includes(currentMonth)) {
    allMonths.unshift(currentMonth);
  }

  const investments = transactions.filter(t => t.type === 'investment');
  const investmentCategories = categories.filter(cat => cat.type === 'investment');
  
  const totalInvestments = investments.reduce((sum, t) => sum + t.amount, 0);
  const totalByCategory = investmentCategories.map(category => {
    const total = investments.filter(t => t.categoryId === category.id)
      .reduce((sum, t) => sum + t.amount, 0);
    return { ...category, total };
  }).filter(cat => cat.total > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Investimentos</h1>
        <div className="flex items-center gap-4">
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
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition"
          >
            + Adicionar Investimento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <InvestmentList 
            investments={investments}
            categories={investmentCategories}
            onEdit={setEditingInvestment}
            onDelete={(id) => deleteTransaction(id)}
          />
        </div>
        <div>
          <InvestmentStats 
            total={totalInvestments}
            byCategory={totalByCategory}
            month={currentMonth}
          />
        </div>
      </div>

      {showAddModal && (
        <InvestmentModal
          categories={investmentCategories}
          onSave={(investment) => {
            addTransaction({ ...investment, type: 'investment' });
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingInvestment && (
        <InvestmentModal
          investment={editingInvestment}
          categories={investmentCategories}
          onSave={(investment) => {
            updateTransaction(editingInvestment.id, { ...investment, type: 'investment' });
            setEditingInvestment(null);
          }}
          onClose={() => setEditingInvestment(null)}
        />
      )}
    </div>
  );
}

function InvestmentList({ 
  investments, 
  categories,
  onEdit, 
  onDelete 
}: { 
  investments: Transaction[];
  categories: Category[];
  onEdit: (investment: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  if (investments.length === 0) {
    return (
      <div className="rounded-xl border border-black/10 dark:border-white/10 p-8 text-center">
        <p className="text-foreground/60">Nenhum investimento registrado para este mês</p>
        <p className="text-sm text-foreground/40 mt-2">Adicione seu primeiro investimento clicando no botão acima</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-foreground/5">
            <tr>
              <th className="text-left p-4 text-sm font-medium">Data</th>
              <th className="text-left p-4 text-sm font-medium">Descrição</th>
              <th className="text-left p-4 text-sm font-medium">Categoria</th>
              <th className="text-right p-4 text-sm font-medium">Valor</th>
              <th className="text-center p-4 text-sm font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {investments.map((investment) => (
              <tr key={investment.id} className="border-t border-black/5 dark:border-white/5">
                <td className="p-4 text-sm">
                  {new Date(investment.date).toLocaleDateString('pt-BR')}
                </td>
                <td className="p-4 text-sm font-medium">{investment.description}</td>
                <td className="p-4 text-sm">
                  <span 
                    className="px-2 py-1 rounded-full text-xs"
                    style={{ 
                      backgroundColor: investment.categoryId ? 
                        categories.find((c: Category) => c.id === investment.categoryId)?.color + '20' : 
                        '#f3f4f6',
                      color: investment.categoryId ? 
                        categories.find((c: Category) => c.id === investment.categoryId)?.color : 
                        '#6b7280'
                    }}
                  >
                    {investment.categoryId ? 
                      categories.find((c: Category) => c.id === investment.categoryId)?.name : 
                      'Sem categoria'
                    }
                  </span>
                </td>
                <td className="p-4 text-sm font-medium text-right text-blue-600 dark:text-blue-400">
                  {formatCurrency(investment.amount)}
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(investment)}
                      className="text-xs px-2 py-1 rounded hover:bg-foreground/10 transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(investment.id)}
                      className="text-xs px-2 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 transition"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvestmentStats({ 
  total, 
  byCategory, 
  month 
}: { 
  total: number;
  byCategory: (Category & { total: number })[];
  month: string;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-black/10 dark:border-white/10 p-6">
        <h3 className="text-lg font-semibold mb-4">Resumo do Mês</h3>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {formatCurrency(total)}
          </div>
          <div className="text-sm text-foreground/70">
            Total investido em {formatMonth(month)}
          </div>
        </div>
      </div>

      {byCategory.length > 0 && (
        <div className="rounded-xl border border-black/10 dark:border-white/10 p-6">
          <h3 className="text-lg font-semibold mb-4">Por Categoria</h3>
          <div className="space-y-3">
            {byCategory.map((category) => {
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
        </div>
      )}
    </div>
  );
}

function InvestmentModal({
  investment,
  categories,
  onSave,
  onClose
}: {
  investment?: Transaction;
  categories: Category[];
  onSave: (investment: Omit<Transaction, 'id' | 'month' | 'type'>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    description: investment?.description || '',
    amount: investment?.amount || 0,
    date: investment?.date || new Date().toISOString().split('T')[0],
    categoryId: investment?.categoryId || '',
    isFixed: false // Investimentos não são fixos
  });

  const [amountDisplay, setAmountDisplay] = useState(
    investment?.amount ? formatCurrencyInput(investment.amount) : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      amount: parseCurrencyInputNew(amountDisplay)
    } as Omit<Transaction, 'id' | 'month' | 'type'>);
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatCurrencyWhileTyping(value);
    setAmountDisplay(formatted);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {investment ? 'Editar Investimento' : 'Novo Investimento'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 rounded-lg border border-black/10 dark:border-white/10 bg-background text-foreground"
              placeholder="Ex: Ações da Petrobras"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Valor</label>
            <input
              type="text"
              value={amountDisplay}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full p-3 rounded-lg border border-black/10 dark:border-white/10 bg-background text-foreground"
              placeholder="0,00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Data</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full p-3 rounded-lg border border-black/10 dark:border-white/10 bg-background text-foreground"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full p-3 rounded-lg border border-black/10 dark:border-white/10 bg-background text-foreground"
            >
              <option value="">Selecione uma categoria</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-foreground text-background rounded-lg hover:opacity-90 transition"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 border border-black/10 dark:border-white/10 rounded-lg hover:bg-foreground/5 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


