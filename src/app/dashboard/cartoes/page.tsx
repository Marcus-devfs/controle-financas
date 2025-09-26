"use client";

import { useFinanceData } from "@/hooks/useFinanceData";
import { formatCurrency, formatMonth } from "@/lib/data";
import { useState } from "react";
import { CreditCard, Category, Transaction } from "@/lib/types";
import { useUserId } from "../layout";
import { CardExpensesTab } from "./CardExpensesTab";
import { formatCurrencyWhileTyping, parseCurrencyInputNew, formatCurrencyInput } from "@/lib/utils";

export default function CartoesPage() {
  const userId = useUserId();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'cards' | 'expenses'>('cards');
  
  const { 
    transactions,
    categories,
    creditCards,
    loading, 
    currentMonth,
    setCurrentMonth, 
    getAvailableMonths,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    addTransaction,
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

  const totalLimit = creditCards?.length > 0 ? creditCards.reduce((sum, card) => sum + card.limit, 0) : 0;
  
  // Calcular crédito usado baseado nos gastos reais do cartão
  const usedCredit = transactions
    .filter((t: Transaction) => t.creditCardId)
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const availableCredit = totalLimit - usedCredit;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cartões de Crédito</h1>
        <div className="flex items-center gap-4">
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
          >
            {allMonths.map(month => (
              <option key={month} value={month}>
                {formatMonth(month)}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            {activeTab === 'expenses' && (
              <button
                onClick={() => setShowExpenseModal(true)}
                className="btn btn-secondary px-4 py-2"
              >
                💳 Lançar Gasto
              </button>
            )}
            {activeTab === 'cards' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary px-4 py-2"
              >
                + Adicionar Cartão
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('cards')}
          className={`px-4 py-2 font-medium text-sm transition ${
            activeTab === 'cards'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          💳 Meus Cartões
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 font-medium text-sm transition ${
            activeTab === 'expenses'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          📊 Gastos do Cartão
        </button>
      </div>

      {/* Conteúdo baseado na aba ativa */}
      {activeTab === 'cards' ? (
        <>
          {/* Resumo dos cartões */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-6">
              <div className="text-sm text-muted-foreground">Limite Total</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(totalLimit)}
              </div>
            </div>
            <div className="card p-6">
              <div className="text-sm text-muted-foreground">Crédito Usado</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(usedCredit)}
              </div>
            </div>
            <div className="card p-6">
              <div className="text-sm text-muted-foreground">Crédito Disponível</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(availableCredit)}
              </div>
            </div>
          </div>

          {/* Lista de cartões */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditCards.map((card) => (
              <CreditCardComponent
                key={card.id}
                card={card}
                onEdit={setEditingCard}
                onDelete={(id) => deleteCreditCard(id)}
              />
            ))}
            
            {creditCards.length === 0 && (
              <div className="col-span-full card p-8 text-center">
                <p className="text-muted-foreground">Nenhum cartão cadastrado</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Adicione seu primeiro cartão clicando no botão acima
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <CardExpensesTab 
          currentMonthData={{ transactions, categories, creditCards }}
          creditCards={creditCards}
          onEditTransaction={(transaction) => {
            // TODO: Implementar edição de transação
            console.log('Editar transação:', transaction);
          }}
          onDeleteTransaction={(id) => {
            deleteTransaction(id);
          }}
        />
      )}

      {/* Modais */}
      {showAddModal && (
        <CreditCardModal
          onSave={(card) => {
            addCreditCard(card);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingCard && (
        <CreditCardModal
          card={editingCard}
          onSave={(card) => {
            updateCreditCard(editingCard.id, card);
            setEditingCard(null);
          }}
          onClose={() => setEditingCard(null)}
        />
      )}

      {/* Modal de gastos do cartão */}
      {showExpenseModal && (
        <CardExpenseModal
          cards={creditCards}
          categories={categories.filter((cat: Category) => cat.type === 'expense')}
          onSave={(expense) => {
            addTransaction(expense);
            setShowExpenseModal(false);
          }}
          onClose={() => setShowExpenseModal(false)}
        />
      )}
    </div>
  );
}

function CreditCardComponent({
  card,
  onEdit,
  onDelete
}: {
  card: CreditCard;
  onEdit: (card: CreditCard) => void;
  onDelete: (id: string) => void;
}) {
  const getBrandColor = (brand: string) => {
    switch (brand) {
      case 'visa': return 'bg-blue-600';
      case 'mastercard': return 'bg-red-600';
      case 'amex': return 'bg-green-600';
      case 'elo': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  const getBrandIcon = (brand: string) => {
    switch (brand) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'amex': return '💳';
      case 'elo': return '💳';
      default: return '💳';
    }
  };

  return (
    <div className="card p-6 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-20 h-20 ${getBrandColor(card.brand)} opacity-20 rounded-bl-full`}></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getBrandIcon(card.brand)}</span>
            <div>
              <div className="font-semibold">{card.name}</div>
              <div className="text-sm text-muted-foreground">
                **** **** **** {card.lastFourDigits}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(card)}
              className="p-1 rounded hover:bg-accent transition"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(card.id)}
              className="p-1 rounded hover:bg-destructive/10 text-destructive transition"
            >
              🗑️
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Limite</span>
            <span className="font-medium">{formatCurrency(card.limit)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fechamento</span>
            <span className="font-medium">Dia {card.closingDay}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vencimento</span>
            <span className="font-medium">Dia {card.dueDay}</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${card.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-xs text-muted-foreground">
              {card.isActive ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreditCardModal({
  card,
  onSave,
  onClose
}: {
  card?: CreditCard;
  onSave: (card: Omit<CreditCard, 'id'>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: card?.name || '',
    lastFourDigits: card?.lastFourDigits || '',
    brand: card?.brand || 'visa' as 'visa' | 'mastercard' | 'amex' | 'elo' | 'other',
    limit: card?.limit || 0,
    closingDay: card?.closingDay || 1,
    dueDay: card?.dueDay || 10,
    color: card?.color || '#3b82f6',
    isActive: card?.isActive ?? true
  });

  const [limitDisplay, setLimitDisplay] = useState(
    card?.limit ? formatCurrencyInput(card.limit) : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      limit: parseCurrencyInputNew(limitDisplay)
    });
  };

  const handleLimitChange = (value: string) => {
    const formatted = formatCurrencyWhileTyping(value);
    setLimitDisplay(formatted);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto my-4">
        <h2 className="text-xl font-semibold mb-4">
          {card ? 'Editar Cartão' : 'Novo Cartão'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome do Cartão</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Ex: Cartão Principal"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Últimos 4 dígitos</label>
            <input
              type="text"
              value={formData.lastFourDigits}
              onChange={(e) => setFormData({ ...formData, lastFourDigits: e.target.value })}
              className="input"
              placeholder="1234"
              maxLength={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bandeira</label>
            <select
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value as 'visa' | 'mastercard' | 'amex' | 'elo' | 'other' })}
              className="input"
            >
              <option value="visa">Visa</option>
              <option value="mastercard">Mastercard</option>
              <option value="amex">American Express</option>
              <option value="elo">Elo</option>
              <option value="other">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Limite</label>
            <input
              type="text"
              value={limitDisplay}
              onChange={(e) => handleLimitChange(e.target.value)}
              className="input"
              placeholder="0,00"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Dia do Fechamento</label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.closingDay}
                onChange={(e) => setFormData({ ...formData, closingDay: parseInt(e.target.value) || 1 })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dia do Vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.dueDay}
                onChange={(e) => setFormData({ ...formData, dueDay: parseInt(e.target.value) || 10 })}
                className="input"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm">
              Cartão ativo
            </label>
          </div>

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

function CardExpenseModal({
  cards,
  categories,
  onSave,
  onClose
}: {
  cards: CreditCard[];
  categories: Category[];
  onSave: (expense: Omit<Transaction, 'id' | 'month'>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    creditCardId: '',
    isFixed: false,
    isRecurring: false,
    dayOfMonth: 1,
    recurringRule: {
      id: '',
      type: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
      interval: 1,
      endDate: '',
      maxOccurrences: undefined
    },
    installmentInfo: {
      totalInstallments: 1,
      currentInstallment: 1,
      installmentAmount: 0
    }
  });

  const [amountDisplay, setAmountDisplay] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calcular valor da parcela se for parcelado
    const installmentAmount = formData.installmentInfo.totalInstallments > 1 
      ? parseCurrencyInputNew(amountDisplay) / formData.installmentInfo.totalInstallments 
      : parseCurrencyInputNew(amountDisplay);
    
    const expenseData = {
      ...formData,
      amount: parseCurrencyInputNew(amountDisplay),
      type: 'expense' as const,
      recurringRule: formData.isRecurring ? formData.recurringRule : undefined,
      installmentInfo: formData.installmentInfo.totalInstallments > 1 ? {
        ...formData.installmentInfo,
        installmentAmount
      } : undefined
    };
    
    onSave(expenseData);
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatCurrencyWhileTyping(value);
    setAmountDisplay(formatted);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in my-4">
        <h2 className="text-xl font-semibold mb-4">
          💳 Lançar Gasto no Cartão
        </h2>
        
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
          <p><strong>💡 Dica:</strong> Use <strong>Parcelamento</strong> para compras parceladas (ex: 12x no cartão) e <strong>Recorrência</strong> para gastos que se repetem automaticamente (ex: assinaturas).</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cartão</label>
            <select
              value={formData.creditCardId}
              onChange={(e) => setFormData({ ...formData, creditCardId: e.target.value })}
              className="input"
              required
            >
              <option value="">Selecione um cartão</option>
              {cards.filter(card => card.isActive).map(card => (
                <option key={card.id} value={card.id}>
                  {card.name} - ****{card.lastFourDigits}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              placeholder="Ex: Supermercado, Restaurante..."
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

          {/* Sistema de parcelas */}
          <div className="space-y-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <h4 className="font-medium text-sm text-orange-800 dark:text-orange-200">
              💳 Parcelamento
            </h4>
            <p className="text-xs text-orange-700 dark:text-orange-300">
              Para compras parceladas (ex: 12x no cartão)
            </p>
            
            <div>
              <label className="block text-sm font-medium mb-1">Número de parcelas</label>
              <input
                type="number"
                min="1"
                max="24"
                value={formData.installmentInfo.totalInstallments}
                onChange={(e) => {
                  const totalInstallments = parseInt(e.target.value) || 1;
                  setFormData({ 
                    ...formData, 
                    installmentInfo: { 
                      ...formData.installmentInfo, 
                      totalInstallments,
                      currentInstallment: 1
                    },
                    // Se ativar parcelas, desativar recorrência
                    isRecurring: totalInstallments > 1 ? false : formData.isRecurring
                  });
                }}
                className="input"
              />
            </div>

            {formData.installmentInfo.totalInstallments > 1 && (
              <div>
                <label className="block text-sm font-medium mb-1">Parcela atual</label>
                <input
                  type="number"
                  min="1"
                  max={formData.installmentInfo.totalInstallments}
                  value={formData.installmentInfo.currentInstallment}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    installmentInfo: { 
                      ...formData.installmentInfo, 
                      currentInstallment: parseInt(e.target.value) || 1 
                    } 
                  })}
                  className="input"
                />
              </div>
            )}

            {formData.installmentInfo.totalInstallments > 1 && (
              <div className="text-sm text-muted-foreground">
                <p>Valor total: {formatCurrency(parseCurrencyInputNew(amountDisplay))}</p>
                <p>Valor da parcela: {formatCurrency(parseCurrencyInputNew(amountDisplay) / formData.installmentInfo.totalInstallments)}</p>
                <p>Parcela {formData.installmentInfo.currentInstallment} de {formData.installmentInfo.totalInstallments}</p>
              </div>
            )}
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
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="input"
              required
            >
              <option value="">Selecione uma categoria</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Opções de tipo de transação */}
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
                Despesa fixa
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => {
                  const isRecurring = e.target.checked;
                  setFormData({ 
                    ...formData, 
                    isRecurring,
                    // Se ativar recorrência, desativar parcelas
                    installmentInfo: isRecurring ? { ...formData.installmentInfo, totalInstallments: 1 } : formData.installmentInfo
                  });
                }}
                className="rounded"
              />
              <label htmlFor="isRecurring" className="text-sm">
                Transação recorrente
              </label>
            </div>
          </div>

          {/* Configuração de recorrência */}
          {formData.isRecurring && (
            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-sm text-blue-800 dark:text-blue-200">
                🔄 Configuração de Recorrência
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Para transações que se repetem automaticamente (ex: assinaturas)
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
              Salvar Gasto
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


