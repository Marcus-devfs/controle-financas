"use client";

import { CreditCard, Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/data";

interface CardExpensesTabProps {
  currentMonthData: any;
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
  // Filtrar apenas transações que foram pagas com cartão
  const cardExpenses = [
    ...currentMonthData.fixedExpenses.filter((t: any) => t.creditCardId),
    ...currentMonthData.variableExpenses.filter((t: any) => t.creditCardId)
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getCardName = (cardId: string) => {
    const card = creditCards.find(c => c.id === cardId);
    return card ? `${card.name} - ****${card.lastFourDigits}` : 'Cartão não encontrado';
  };

  const getCategoryName = (categoryId: string) => {
    const category = currentMonthData.categories.find((c: any) => c.id === categoryId);
    return category?.name || 'Sem categoria';
  };

  const totalCardExpenses = cardExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      {/* Resumo dos gastos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-6">
          <div className="text-sm text-muted-foreground">Total Gasto no Cartão</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(totalCardExpenses)}
          </div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-muted-foreground">Número de Transações</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {cardExpenses.length}
          </div>
        </div>
      </div>

      {/* Lista de gastos */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold">Gastos do Cartão</h3>
        </div>
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
              {cardExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhum gasto registrado no cartão
                  </td>
                </tr>
              ) : (
                cardExpenses.map((expense) => (
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
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            🔄 Recorrente
                          </div>
                        )}
                        {expense.isFixed && (
                          <div className="text-xs text-orange-600 dark:text-orange-400">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
