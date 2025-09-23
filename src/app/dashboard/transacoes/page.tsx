"use client";

import { useFinanceData } from "@/hooks/useFinanceData";
import { formatCurrency, formatMonth } from "@/lib/data";
import { useState } from "react";
import { Transaction, Category } from "@/lib/types";
import { useUserId } from "../layout";

export default function TransacoesPage() {
  const userId = useUserId();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState<'income' | 'expenses'>('expenses');
  
  const { 
    currentMonthData, 
    loading, 
    currentMonth,
    setCurrentMonth, 
    getAvailableMonths,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory
  } = useFinanceData(userId);

  if (loading || !currentMonthData) {
    return <div className="space-y-4">Carregando...</div>;
  }

  const availableMonths = getAvailableMonths();
  const allMonths = [...availableMonths];
  if (!allMonths.includes(currentMonth)) {
    allMonths.unshift(currentMonth);
  }

        // Filtrar transações baseado na aba ativa e excluir gastos do cartão
        const allTransactions = activeTab === 'income' 
          ? [
              ...currentMonthData.fixedIncome.map((t: Transaction) => ({ ...t, displayType: 'Receita Fixa', typeCode: 'fixedIncome' })),
              ...currentMonthData.variableIncome.map((t: Transaction) => ({ ...t, displayType: 'Receita Variável', typeCode: 'variableIncome' }))
            ]
          : [
              ...currentMonthData.fixedExpenses.filter((t: Transaction) => !t.creditCardId).map((t: Transaction) => ({ ...t, displayType: 'Despesa Fixa', typeCode: 'fixedExpenses' })),
              ...currentMonthData.variableExpenses.filter((t: Transaction) => !t.creditCardId).map((t: Transaction) => ({ ...t, displayType: 'Despesa Variável', typeCode: 'variableExpenses' }))
            ];
        
        const sortedTransactions = allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transações</h1>
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
                 <div className="flex gap-2">
                   <button
                     onClick={() => setShowAddModal(true)}
                     className="btn btn-primary px-4 py-2"
                   >
                     + Adicionar Transação
                   </button>
                   <button
                     onClick={() => window.location.href = '/dashboard/cartoes'}
                     className="btn btn-secondary px-4 py-2"
                   >
                     💳 Gastos no Cartão
                   </button>
                 </div>
        </div>
      </div>

      {/* Abas */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 font-medium text-sm transition ${
            activeTab === 'expenses'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          💸 Despesas
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`px-4 py-2 font-medium text-sm transition ${
            activeTab === 'income'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          💰 Receitas
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <TransactionList 
            transactions={sortedTransactions}
            categories={currentMonthData.categories}
            onEdit={setEditingTransaction}
            onDelete={(id) => deleteTransaction(id)}
          />
        </div>
        <div>
          <CategoryManager 
            categories={currentMonthData.categories}
            onAddCategory={addCategory}
          />
        </div>
      </div>

             {showAddModal && (
               <TransactionModal
                 categories={currentMonthData.categories}
                 defaultType={activeTab === 'income' ? 'income' : 'expense'}
                 onSave={(transaction) => {
                   addTransaction(transaction);
                   setShowAddModal(false);
                 }}
                 onClose={() => setShowAddModal(false)}
               />
             )}

      {editingTransaction && (
        <TransactionModal
          transaction={editingTransaction}
          categories={currentMonthData.categories}
          onSave={(transaction) => {
            updateTransaction(editingTransaction.id, transaction);
            setEditingTransaction(null);
          }}
          onClose={() => setEditingTransaction(null)}
        />
      )}
    </div>
  );
}

function TransactionList({ 
  transactions, 
  categories,
  onEdit, 
  onDelete 
}: { 
  transactions: (Transaction & { displayType: string; typeCode: string })[];
  categories: Category[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-black/10 dark:border-white/10 p-8 text-center">
        <p className="text-foreground/60">Nenhuma transação registrada para este mês</p>
        <p className="text-sm text-foreground/40 mt-2">Adicione sua primeira transação clicando no botão acima</p>
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
              <th className="text-left p-4 text-sm font-medium">Tipo</th>
              <th className="text-right p-4 text-sm font-medium">Valor</th>
              <th className="text-center p-4 text-sm font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="border-t border-black/5 dark:border-white/5">
                <td className="p-4 text-sm">
                  {new Date(transaction.date).toLocaleDateString('pt-BR')}
                </td>
                <td className="p-4 text-sm font-medium">{transaction.description}</td>
                <td className="p-4 text-sm">
                  <span 
                    className="px-2 py-1 rounded-full text-xs"
                    style={{ 
                      backgroundColor: transaction.categoryId ? 
                        categories.find((c: Category) => c.id === transaction.categoryId)?.color + '20' : 
                        '#f3f4f6',
                      color: transaction.categoryId ? 
                        categories.find((c: Category) => c.id === transaction.categoryId)?.color : 
                        '#6b7280'
                    }}
                  >
                    {transaction.categoryId ? 
                      categories.find((c: Category) => c.id === transaction.categoryId)?.name : 
                      'Sem categoria'
                    }
                  </span>
                </td>
                <td className="p-4 text-sm text-foreground/70">{transaction.displayType}</td>
                <td className={`p-4 text-sm font-medium text-right ${
                  transaction.displayType.includes('Receita') || transaction.displayType.includes('Investimento')
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(transaction)}
                      className="text-xs px-2 py-1 rounded hover:bg-foreground/10 transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(transaction.id)}
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

function CategoryManager({ 
  categories, 
  onAddCategory 
}: { 
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense' | 'investment',
    color: '#3B82F6'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.name.trim()) {
      onAddCategory(newCategory);
      setNewCategory({ name: '', type: 'expense', color: '#3B82F6' });
      setShowAddForm(false);
    }
  };

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Categorias</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="text-sm px-3 py-1 rounded bg-foreground text-background hover:opacity-90 transition"
        >
          + Nova
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center gap-2 p-2 rounded hover:bg-foreground/5">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category.color }}
            ></div>
            <span className="text-sm">{category.name}</span>
            <span className="text-xs text-foreground/60 ml-auto">
              {category.type === 'income' ? 'Receita' : 
               category.type === 'expense' ? 'Despesa' : 'Investimento'}
            </span>
          </div>
        ))}
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="mt-4 p-3 border border-black/10 dark:border-white/10 rounded-lg">
          <input
            type="text"
            placeholder="Nome da categoria"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            className="w-full p-2 rounded border border-black/10 dark:border-white/10 bg-background text-foreground mb-2"
            required
          />
          <select
            value={newCategory.type}
            onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value as 'income' | 'expense' | 'investment' })}
            className="w-full p-2 rounded border border-black/10 dark:border-white/10 bg-background text-foreground mb-2"
          >
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
            <option value="investment">Investimento</option>
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-3 py-2 bg-foreground text-background rounded text-sm hover:opacity-90 transition"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-2 border border-black/10 dark:border-white/10 rounded text-sm hover:bg-foreground/5 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function TransactionModal({
  transaction,
  categories,
  defaultType = 'expense',
  onSave,
  onClose
}: {
  transaction?: Transaction;
  categories: Category[];
  defaultType?: 'income' | 'expense' | 'investment';
  onSave: (transaction: Omit<Transaction, 'id' | 'month'>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    description: transaction?.description || '',
    amount: transaction?.amount || 0,
    date: transaction?.date || new Date().toISOString().split('T')[0],
    type: transaction?.type || defaultType,
    isFixed: transaction?.isFixed || false,
    isRecurring: transaction?.isRecurring || false,
    dayOfMonth: transaction?.dayOfMonth || 1,
    categoryId: transaction?.categoryId || '',
    recurringRule: transaction?.recurringRule || {
      id: '',
      type: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
      interval: 1,
      endDate: '',
      maxOccurrences: undefined
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const transactionData = {
      ...formData,
      recurringRule: formData.isRecurring ? formData.recurringRule : undefined
    };
    
    onSave(transactionData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in my-4">
        <h2 className="text-xl font-semibold mb-4">
          {transaction ? 'Editar Transação' : 'Nova Transação'}
        </h2>
        
        <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p><strong>💡 Dica:</strong> Para <strong>gastos com cartão</strong>, use a página de Cartões. Aqui você lança apenas <strong>receitas e despesas normais</strong> (dinheiro, PIX, etc.).</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Valor</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="input"
              required
            />
          </div>


          <div>
            <label className="block text-sm font-medium mb-1">Data</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' | 'investment' })}
              className="input"
            >
              <option value="income">Receita</option>
              <option value="expense">Despesa</option>
              <option value="investment">Investimento</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="input"
            >
              <option value="">Selecione uma categoria</option>
              {categories
                .filter(cat => cat.type === formData.type)
                .map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Opções de tipo de transação */}
          {formData.type !== 'investment' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFixed"
                  checked={formData.isFixed}
                  onChange={(e) => setFormData({ ...formData, isFixed: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isFixed" className="text-sm">
                  {formData.type === 'income' ? 'Receita fixa' : 'Despesa fixa'}
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isRecurring" className="text-sm">
                  Transação recorrente
                </label>
              </div>
            </div>
          )}

          {/* Configuração de recorrência - separada e clara */}
          {formData.isRecurring && (
            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-sm text-blue-800 dark:text-blue-200">
                🔄 Configuração de Recorrência
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Para transações que se repetem automaticamente (ex: aluguel, salário, assinaturas)
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo</label>
                  <select
                    value={formData.recurringRule.type}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      recurringRule: { 
                        ...formData.recurringRule, 
                        type: e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly' 
                      } 
                    })}
                    className="input"
                  >
                    <option value="daily">Diária</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    A cada {formData.recurringRule.type === 'daily' ? 'dias' : 
                            formData.recurringRule.type === 'weekly' ? 'semanas' : 
                            formData.recurringRule.type === 'monthly' ? 'meses' : 'anos'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.recurringRule.interval}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      recurringRule: { 
                        ...formData.recurringRule, 
                        interval: parseInt(e.target.value) || 1 
                      } 
                    })}
                    className="input"
                  />
                </div>
              </div>

              {formData.recurringRule.type === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Dia do mês para lançamento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dayOfMonth}
                    onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) || 1 })}
                    className="input"
                    placeholder="Ex: 5 (dia 5 de cada mês)"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Data final (opcional)</label>
                <input
                  type="date"
                  value={formData.recurringRule.endDate}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    recurringRule: { 
                      ...formData.recurringRule, 
                      endDate: e.target.value 
                    } 
                  })}
                  className="input"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Deixe em branco para recorrência indefinida
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="btn btn-primary flex-1 px-4 py-3"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary px-4 py-3"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


