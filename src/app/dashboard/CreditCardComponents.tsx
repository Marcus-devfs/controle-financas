"use client";

import { formatCurrency } from "@/lib/data";

export function CreditCardExpenses({
  currentMonthData,
  creditCards
}: {
  currentMonthData: { transactions: any[]; categories: any[]; creditCards: any[] };
  creditCards: any[];
}) {
  // Filtrar apenas transações que foram pagas com cartão
  const cardExpenses = currentMonthData.transactions
    .filter((t: any) => t.creditCardId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getCardName = (cardId: string) => {
    const card = creditCards.find((c: any) => c.id === cardId);
    return card ? `${card.name} - ****${card.lastFourDigits}` : 'Cartão não encontrado';
  };

  const getCategoryName = (categoryId: string) => {
    const category = currentMonthData.categories.find((c: any) => c.id === categoryId);
    return category?.name || 'Sem categoria';
  };

  return (
    <div className="card p-6 animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">💳 Gastos Recentes no Cartão</h3>
      <div className="space-y-3">
        {cardExpenses.length === 0 ? (
          <p className="text-foreground/60 text-sm">Nenhum gasto registrado no cartão</p>
        ) : (
          cardExpenses.map((expense) => (
            <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex-1">
                <div className="font-medium text-sm">{expense.description}</div>
                <div className="text-xs text-muted-foreground">
                  {getCardName(expense.creditCardId)} • {getCategoryName(expense.categoryId)}
                </div>
                {expense.installmentInfo && (
                  <div className="text-xs text-orange-600 dark:text-orange-400">
                    Parcela {expense.installmentInfo.currentInstallment} de {expense.installmentInfo.totalInstallments}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="font-medium text-red-600 dark:text-red-400">
                  {formatCurrency(expense.amount)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(expense.date).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {cardExpenses.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={() => window.location.href = '/dashboard/cartoes'}
            className="text-sm text-primary hover:underline"
          >
            Ver todos os gastos do cartão →
          </button>
        </div>
      )}
    </div>
  );
}

export function CreditCardSummary({
  creditCards,
  currentMonthData
}: {
  creditCards: any[];
  currentMonthData: { transactions: any[]; categories: any[]; creditCards: any[] };
}) {
  const totalLimit = creditCards.reduce((sum, card) => sum + card.limit, 0);
  const usedCredit = currentMonthData.transactions
    .filter((t: any) => t.creditCardId)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const availableCredit = totalLimit - usedCredit;
  const usagePercentage = totalLimit > 0 ? (usedCredit / totalLimit) * 100 : 0;

  return (
    <div className="card p-6 animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">💳 Resumo dos Cartões</h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Limite Total</span>
            <span className="font-medium">{formatCurrency(totalLimit)}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: '100%' }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Crédito Usado</span>
            <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(usedCredit)}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-red-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {usagePercentage.toFixed(1)}% do limite utilizado
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Crédito Disponível</span>
            <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(availableCredit)}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(100 - usagePercentage, 0)}%` }}
            ></div>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {creditCards.length}
              </div>
              <div className="text-xs text-muted-foreground">Cartões Ativos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {currentMonthData?.transactions?.filter((t: any) => t.creditCardId)?.length}
              </div>
              <div className="text-xs text-muted-foreground">Transações</div>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={() => window.location.href = '/dashboard/cartoes'}
            className="w-full btn btn-secondary py-2"
          >
            Gerenciar Cartões
          </button>
        </div>
      </div>
    </div>
  );
}
