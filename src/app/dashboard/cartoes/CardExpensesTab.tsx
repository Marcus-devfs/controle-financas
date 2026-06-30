"use client";

import { CreditCard, Transaction, Category } from "@/lib/types";
import { formatCurrency } from "@/lib/data";
import { useState } from "react";

interface CardExpensesTabProps {
  currentMonthData: {
    transactions: Transaction[];
    categories: Category[];
    creditCards: CreditCard[];
  };
  creditCards: CreditCard[];
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export function CardExpensesTab({
  currentMonthData,
  creditCards,
  onEditTransaction,
  onDeleteTransaction
}: CardExpensesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [filterFixed, setFilterFixed] = useState<'all' | 'fixed' | 'variable'>('all');

  // Filtrar apenas transações que foram pagas com cartão
  const cardExpenses = currentMonthData.transactions
    .filter((t: Transaction) => {
      // Filtro básico: apenas gastos com cartão
      if (!t.creditCardId || t.type !== 'expense') return false;
      
      // Filtro por categoria
      const categoryId = typeof t.categoryId === 'object' ? (t.categoryId as any)._id : t.categoryId;
      const categoryMatch = !selectedCategory || categoryId === selectedCategory;
      
      // Filtro por cartão
      const cardMatch = !selectedCard || t.creditCardId === selectedCard;
      
      // Filtro por descrição (busca)
      const searchMatch = !searchTerm || t.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por fixa/variável
      const fixedMatch =
        filterFixed === 'all' ? true :
        filterFixed === 'fixed' ? t.isFixed === true :
        t.isFixed !== true;
      
      return categoryMatch && cardMatch && searchMatch && fixedMatch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getCardName = (cardId: string | undefined) => {
    if (!cardId) return 'Sem cartão';
    
    // Extrair ID se for objeto (como nos relatórios)
    const actualCardId = typeof cardId === 'object' ? (cardId as any)._id : cardId;
    
    const card = creditCards.find(c => c.id === actualCardId);
    return card ? `${card.name} - ****${card.lastFourDigits}` : 'Cartão não encontrado';
  };

  const getCategoryName = (categoryId: string | object) => {
    const actualCategoryId = typeof categoryId === 'object' ? (categoryId as any)._id : categoryId;
    const category = currentMonthData.categories.find((c: Category) => c.id === actualCategoryId);
    return category?.name || 'Sem categoria';
  };

  const totalCardExpenses = cardExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/30 rounded-lg">
        <div className="flex-1">
          <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
            <span className="sm:hidden">🔍</span>
            <span className="hidden sm:inline">🔍 Buscar por descrição</span>
          </label>
          <input
            type="text"
            placeholder="Digite para buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-black/10 bg-background text-foreground text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
            <span className="sm:hidden">📂</span>
            <span className="hidden sm:inline">📂 Filtrar por categoria</span>
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-black/10 bg-background text-foreground text-sm"
          >
            <option value="">Todas as categorias</option>
            {currentMonthData.categories
              .filter(cat => cat.type === 'expense')
              .map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
            <span className="sm:hidden">💳</span>
            <span className="hidden sm:inline">💳 Filtrar por cartão</span>
          </label>
          <select
            value={selectedCard}
            onChange={(e) => setSelectedCard(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-black/10 bg-background text-foreground text-sm"
          >
            <option value="">Todos os cartões</option>
            {creditCards.map(card => (
              <option key={card.id} value={card.id}>
                {card.name} - ****{card.lastFourDigits}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
            <span className="sm:hidden">📅</span>
            <span className="hidden sm:inline">📅 Filtrar por fixa/variável</span>
          </label>
          <select
            value={filterFixed}
            onChange={(e) => setFilterFixed(e.target.value as 'all' | 'fixed' | 'variable')}
            className="w-full px-3 py-2 rounded-lg border border-black/10 bg-background text-foreground text-sm"
          >
            <option value="all">Todas</option>
            <option value="fixed">Fixas</option>
            <option value="variable">Variáveis</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
              setSelectedCard('');
              setFilterFixed('all');
            }}
            className="px-3 py-2 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors w-full sm:w-auto"
          >
            <span className="sm:hidden">🗑️</span>
            <span className="hidden sm:inline">Limpar Filtros</span>
          </button>
        </div>
      </div>

      {/* Resumo dos gastos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-6">
          <div className="text-sm text-muted-foreground">Total Gasto no Cartão</div>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(totalCardExpenses)}
          </div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-muted-foreground">Número de Transações</div>
          <div className="text-2xl font-bold text-blue-600">
            {cardExpenses.length}
          </div>
        </div>
      </div>

      {/* Lista de gastos */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Gastos do Cartão</h3>
        
        {cardExpenses.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-muted-foreground">Nenhum gasto registrado no cartão</p>
          </div>
        ) : (
          <>
            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-3">
              {cardExpenses.map((expense) => (
                <div key={expense.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">{expense.description}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(expense.date).toLocaleDateString('pt-BR')}
                      </p>
                      {expense.installmentInfo && (
                        <p className="text-xs text-gray-500">
                          Parcela {expense.installmentInfo.currentInstallment} de {expense.installmentInfo.totalInstallments}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-red-600">{formatCurrency(expense.amount)}</p>
                      {expense.installmentInfo && expense.installmentInfo.totalInstallments > 1 && (
                        <p className="text-xs text-gray-500">
                          Total: {formatCurrency(expense.amount * expense.installmentInfo.totalInstallments)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{getCardName(expense.creditCardId)}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{getCategoryName(expense.categoryId)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditTransaction(expense)}
                        className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(expense.id)}
                        className="text-xs px-2 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                  
                  {/* Tags especiais */}
                  <div className="flex gap-2 mt-2">
                    {expense.isRecurring && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                        🔄 Recorrente
                      </span>
                    )}
                    {expense.isFixed && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                        📅 Fixa
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">Descrição</th>
                      <th className="text-left p-4 font-medium">Cartão</th>
                      <th className="text-left p-4 font-medium">Categoria</th>
                      <th className="text-left p-4 font-medium">Data</th>
                      <th className="text-right p-4 font-medium">Valor</th>
                      <th className="text-center p-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cardExpenses.map((expense) => (
                      <tr key={expense.id} className="border-t border-border hover:bg-muted/30 transition">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{expense.description}</div>
                            {expense.installmentInfo && (
                              <div className="text-xs text-muted-foreground">
                                Parcela {expense.installmentInfo.currentInstallment} de {expense.installmentInfo.totalInstallments}
                              </div>
                            )}
                            {expense.isRecurring && (
                              <div className="text-xs text-blue-600">
                                🔄 Recorrente
                              </div>
                            )}
                            {expense.isFixed && (
                              <div className="text-xs text-orange-600">
                                📅 Fixa
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-medium">
                            {getCardName(expense.creditCardId)}
                          </span>
                        </td>
                        <td className="p-4">{getCategoryName(expense.categoryId)}</td>
                        <td className="p-4">{new Date(expense.date).toLocaleDateString('pt-BR')}</td>
                        <td className="p-4 text-right font-medium">
                          <div>
                            {formatCurrency(expense.amount)}
                            {expense.installmentInfo && expense.installmentInfo.totalInstallments > 1 && (
                              <div className="text-xs text-muted-foreground">
                                Total: {formatCurrency(expense.amount * expense.installmentInfo.totalInstallments)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => onEditTransaction(expense)}
                              className="p-1 rounded hover:bg-accent transition"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => onDeleteTransaction(expense.id)}
                              className="p-1 rounded hover:bg-destructive/10 text-destructive transition"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
