import { useCallback, useEffect, useState } from 'react';
import { apiClient, ShoppingPlanItem, ShoppingPlanItemInput } from '@/lib/api';
import { getCurrentMonth } from '@/lib/data';

/** Semanas consideradas no mês para itens semanais */
export const WEEKS_IN_MONTH = 4;

/** Quantidade já convertida para o total do mês (ex.: semanal × 4) */
export function monthlyQuantity(item: Pick<ShoppingPlanItem, 'quantity' | 'frequency'>): number {
  if (item.frequency === 'weekly') {
    return item.quantity * WEEKS_IN_MONTH;
  }
  return item.quantity;
}

/** Total estimado do mês (quantidade mensal × preço unitário) */
export function monthlyEstimatedTotal(
  item: Pick<ShoppingPlanItem, 'quantity' | 'frequency' | 'estimatedUnitPrice'>
): number {
  return monthlyQuantity(item) * (item.estimatedUnitPrice || 0);
}

/** @deprecated use monthlyEstimatedTotal — mantido para compatibilidade */
export function itemTotal(item: Pick<ShoppingPlanItem, 'quantity' | 'estimatedUnitPrice' | 'frequency'>): number {
  if ('frequency' in item && item.frequency) {
    return monthlyEstimatedTotal(item as Pick<ShoppingPlanItem, 'quantity' | 'frequency' | 'estimatedUnitPrice'>);
  }
  return item.quantity * item.estimatedUnitPrice;
}

export function useShoppingPlan() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [items, setItems] = useState<ShoppingPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async (month: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getShoppingPlanItems(month);
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar planejamento de compras');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems(currentMonth);
  }, [currentMonth, loadItems]);

  const addItem = useCallback(async (item: Omit<ShoppingPlanItemInput, 'month'>) => {
    setSaving(true);
    setError(null);
    try {
      const created = await apiClient.createShoppingPlanItem({
        ...item,
        estimatedUnitPrice: item.estimatedUnitPrice ?? 0,
        month: currentMonth
      });
      setItems(prev => [...prev, created]);
      return created;
    } catch (err: any) {
      setError(err.message || 'Erro ao criar item');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [currentMonth]);

  const updateItem = useCallback(async (id: string, item: Partial<ShoppingPlanItemInput>) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await apiClient.updateShoppingPlanItem(id, item);
      setItems(prev => prev.map(i => (i._id === id ? updated : i)));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar item');
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      await apiClient.deleteShoppingPlanItem(id);
      setItems(prev => prev.filter(i => i._id !== id));
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir item');
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const setPurchased = useCallback(async (id: string, isPurchased: boolean, actualAmount?: number) => {
    setError(null);
    try {
      const updated = await apiClient.setShoppingPlanItemPurchased(id, isPurchased, actualAmount);
      setItems(prev => prev.map(i => (i._id === id ? updated : i)));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar compra');
      throw err;
    }
  }, []);

  const duplicatePreviousMonth = useCallback(async () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const sourceMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    setSaving(true);
    setError(null);
    try {
      const result = await apiClient.duplicateShoppingPlanItems(sourceMonth, currentMonth);
      await loadItems(currentMonth);
      return result;
    } catch (err: any) {
      setError(err.message || 'Erro ao duplicar mês');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [currentMonth, loadItems]);

  const getAvailableMonths = useCallback(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = -6; i <= 2; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
  }, []);

  const plannedTotal = items.reduce((sum, i) => sum + monthlyEstimatedTotal(i), 0);
  const spentTotal = items
    .filter(i => i.isPurchased)
    .reduce((sum, i) => sum + (i.actualAmount ?? monthlyEstimatedTotal(i)), 0);
  const remainingTotal = items
    .filter(i => !i.isPurchased)
    .reduce((sum, i) => sum + monthlyEstimatedTotal(i), 0);
  const purchasedCount = items.filter(i => i.isPurchased).length;

  return {
    items,
    loading,
    saving,
    error,
    currentMonth,
    setCurrentMonth,
    getAvailableMonths,
    addItem,
    updateItem,
    deleteItem,
    setPurchased,
    duplicatePreviousMonth,
    plannedTotal,
    spentTotal,
    remainingTotal,
    purchasedCount
  };
}
