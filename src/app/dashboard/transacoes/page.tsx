"use client";

import { useFinanceData } from "@/hooks/useFinanceData";
import { formatCurrency, formatMonth } from "@/lib/data";
import { useState } from "react";
import { Transaction, Category } from "@/lib/types";
import { useUserId } from "@/hooks/useUserId";
import { formatCurrencyWhileTyping, parseCurrencyInputNew, formatCurrencyInput } from "@/lib/utils";

export default function TransacoesPage() {
  const userId = useUserId();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const { 
    transactions,
    categories,
    loading,
    saving, 
    currentMonth,
    setCurrentMonth, 
    getAvailableMonths,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    deleteCategory
  } = useFinanceData(userId);

  if (loading || !transactions) {
    return <div className="space-y-4">Carregando...</div>;
  }

  const availableMonths = getAvailableMonths();
  const allMonths = [...availableMonths];
  if (!allMonths.includes(currentMonth)) {
    allMonths.unshift(currentMonth);
  }

  console.log('activeTab', activeTab);

        // Filtrar transações baseado na aba ativa e excluir gastos do cartão
        const filteredTransactions = transactions.filter(t => {
          // Filtro por tipo (aba ativa)
          const typeMatch = activeTab === 'income' ? t.type === 'income' : t.type === 'expense' && !t.creditCardId;
          
          // Filtro por categoria
          const categoryId = typeof t.categoryId === 'object' ? (t.categoryId as any)._id : t.categoryId;
          const categoryMatch = !selectedCategory || categoryId === selectedCategory;
          
          // Filtro por descrição (busca)
          const searchMatch = !searchTerm || t.description.toLowerCase().includes(searchTerm.toLowerCase());
          
          return typeMatch && categoryMatch && searchMatch;
        });

        const allTransactions = filteredTransactions.map((t: Transaction) => ({
          ...t,
          displayType: t.isFixed ? 
            (t.type === 'income' ? 'Receita Fixa' : 'Despesa Fixa') :
            (t.type === 'income' ? 'Receita Variável' : 'Despesa Variável'),
          typeCode: t.isFixed ? 
            (t.type === 'income' ? 'fixedIncome' : 'fixedExpenses') :
            (t.type === 'income' ? 'variableIncome' : 'variableExpenses')
        }));
        
        const sortedTransactions = allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transações</h1>
        <div className="flex items-center gap-4">
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
          onClick={() => setActiveTab('expense')}
          className={`px-4 py-2 font-medium text-sm transition ${
            activeTab === 'expense'
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

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">🔍 Buscar por descrição</label>
          <input
            type="text"
            placeholder="Digite para buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-black/10 bg-background text-foreground"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">📂 Filtrar por categoria</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-black/10 bg-background text-foreground"
          >
            <option value="">Todas as categorias</option>
            {categories
              .filter(cat => cat.type === activeTab)
              .map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
            }}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <TransactionList 
            transactions={sortedTransactions}
            categories={categories}
            onEdit={setEditingTransaction}
            onDelete={(id) => deleteTransaction(id)}
          />
        </div>
        <div>
          <CategoryManager 
            categories={categories}
            onAddCategory={addCategory}
            onDeleteCategory={deleteCategory}
            saving={saving}
          />
        </div>
      </div>

             {showAddModal && (
               <TransactionModal
                 categories={categories}
                 defaultType={activeTab === 'income' ? 'income' : 'expense'}
                 saving={saving}
                 onSave={async (transaction) => {
                   await addTransaction(transaction);
                   setShowAddModal(false);
                 }}
                 onClose={() => setShowAddModal(false)}
               />
             )}

      {editingTransaction && (
        <TransactionModal
          transaction={editingTransaction}
          categories={categories}
          saving={saving}
          onSave={async (transaction) => {
            await updateTransaction(editingTransaction.id, transaction);
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
      <div className="rounded-xl border border-black/10 p-8 text-center">
        <p className="text-foreground/60">Nenhuma transação registrada para este mês</p>
        <p className="text-sm text-foreground/40 mt-2">Adicione sua primeira transação clicando no botão acima</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/10 overflow-hidden">
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
                  {(() => {
                    const categoryId = typeof transaction.categoryId === 'object' ? (transaction.categoryId as any)._id : transaction.categoryId;
                    const category = categories.find((c: Category) => c.id === categoryId);
                    return (
                      <span 
                        className="px-2 py-1 rounded-full text-xs"
                        style={{ 
                          backgroundColor: category ? category.color + '20' : '#f3f4f6',
                          color: category ? category.color : '#6b7280'
                        }}
                      >
                        {category ? category.name : 'Sem categoria'}
                      </span>
                    );
                  })()}
                </td>
                <td className="p-4 text-sm text-foreground/70">{transaction.displayType}</td>
                <td className={`p-4 text-sm font-medium text-right ${
                  transaction.displayType.includes('Receita') || transaction.displayType.includes('Investimento')
                    ? 'text-green-600'
                    : 'text-red-600'
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
                      className="text-xs px-2 py-1 rounded hover:bg-red-100 text-red-600 transition"
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
  onAddCategory,
  onDeleteCategory,
  saving = false
}: { 
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onDeleteCategory: (categoryId: string) => void;
  saving?: boolean;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense' | 'investment',
    color: '#3B82F6'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.name.trim()) {
      await onAddCategory(newCategory);
      setNewCategory({ name: '', type: 'expense', color: '#3B82F6' });
      setShowAddForm(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.')) {
      await onDeleteCategory(categoryId);
    }
  };

  return (
    <div className="rounded-xl border border-black/10 p-4">
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
            <span className="text-sm flex-1">{category.name}</span>
            <span className="text-xs text-foreground/60">
              {category.type === 'income' ? 'Receita' : 
               category.type === 'expense' ? 'Despesa' : 'Investimento'}
            </span>
            <button
              onClick={() => handleDeleteCategory(category.id)}
              disabled={saving}
              className="ml-2 text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Excluir categoria"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="mt-4 p-3 border border-black/10 rounded-lg">
          <input
            type="text"
            placeholder="Nome da categoria"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            className="w-full p-2 rounded border border-black/10 bg-background text-foreground mb-2"
            required
          />
          <select
            value={newCategory.type}
            onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value as 'income' | 'expense' | 'investment' })}
            className="w-full p-2 rounded border border-black/10 bg-background text-foreground mb-2"
          >
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
            <option value="investment">Investimento</option>
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-3 py-2 bg-foreground text-background rounded text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Salvando...
                </span>
              ) : (
                'Salvar'
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              disabled={saving}
              className="px-3 py-2 border border-black/10 rounded text-sm hover:bg-foreground/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
  onClose,
  saving = false
}: {
  transaction?: Transaction;
  categories: Category[];
  defaultType?: 'income' | 'expense' | 'investment';
  onSave: (transaction: Omit<Transaction, 'id' | 'month'>) => void;
  onClose: () => void;
  saving?: boolean;
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

  const [amountDisplay, setAmountDisplay] = useState(
    transaction?.amount ? formatCurrencyInput(transaction.amount) : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const transactionData = {
      ...formData,
      amount: parseCurrencyInputNew(amountDisplay),
      recurringRule: formData.isRecurring ? formData.recurringRule : undefined
    };
    
    onSave(transactionData);
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatCurrencyWhileTyping(value);
    setAmountDisplay(formatted);
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
              type="text"
              value={amountDisplay}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="input"
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
              disabled={saving}
              className="btn btn-primary flex-1 px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Salvando...
                </span>
              ) : (
                'Salvar'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn btn-secondary px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


