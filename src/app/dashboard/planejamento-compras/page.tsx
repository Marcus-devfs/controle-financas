"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatMonth } from "@/lib/data";
import { formatCurrencyWhileTyping, parseCurrencyInputNew, formatCurrencyInput } from "@/lib/utils";
import { ShoppingPlanItem, ShoppingPlanItemInput } from "@/lib/api";
import {
  useShoppingPlan,
  monthlyQuantity,
  monthlyEstimatedTotal,
  WEEKS_IN_MONTH
} from "@/hooks/useShoppingPlan";

const CATEGORY_SUGGESTIONS = [
  "Alimentação",
  "Higiene",
  "Limpeza",
  "Bebê",
  "Farmácia",
  "Bebidas",
  "Pet"
];

const FREQUENCY_LABEL: Record<ShoppingPlanItem["frequency"], string> = {
  weekly: "Semanal",
  monthly: "Mensal",
  once: "Compra única"
};

const PURCHASE_METHOD_LABEL: Record<ShoppingPlanItem["purchaseMethod"], string> = {
  online: "Online",
  store: "Loja física",
  both: "Online ou loja"
};

type Tab = "planejamento" | "real";

export default function PlanejamentoComprasPage() {
  const {
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
  } = useShoppingPlan();

  const [activeTab, setActiveTab] = useState<Tab>("planejamento");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingPlanItem | null>(null);

  const availableMonths = getAvailableMonths();

  const groupedByCategory = useMemo(() => {
    const groups = new Map<string, ShoppingPlanItem[]>();
    for (const item of items) {
      const list = groups.get(item.category) || [];
      list.push(item);
      groups.set(item.category, list);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  const handleDelete = async (item: ShoppingPlanItem) => {
    if (window.confirm(`Remover "${item.name}" da lista de ${formatMonth(currentMonth)}?`)) {
      await deleteItem(item._id);
    }
  };

  const handleDuplicate = async () => {
    if (window.confirm(`Copiar os itens do mês anterior para ${formatMonth(currentMonth)}?`)) {
      const result = await duplicatePreviousMonth();
      alert(`${result.duplicatedCount} item(ns) copiado(s). ${result.alreadyExistsCount} já existiam.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Planejamento de Compras</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monte a lista no planejamento e acompanhe o gasto real do mês.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
          >
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {formatMonth(month)}
              </option>
            ))}
          </select>
          {activeTab === "planejamento" && (
            <div className="flex gap-2">
              <button
                onClick={handleDuplicate}
                disabled={saving}
                className="btn btn-secondary px-3 py-2 text-sm disabled:opacity-50"
              >
                Duplicar Mês Anterior
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary px-3 py-2 text-sm flex-1 sm:flex-none"
              >
                + Adicionar Item
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Abas */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("planejamento")}
          className={`px-3 sm:px-4 py-2 font-medium text-sm transition flex-1 sm:flex-none ${
            activeTab === "planejamento"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Planejamento Mensal
        </button>
        <button
          onClick={() => setActiveTab("real")}
          className={`px-3 sm:px-4 py-2 font-medium text-sm transition flex-1 sm:flex-none ${
            activeTab === "real"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Real do Mês
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {activeTab === "planejamento" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-6">
              <div className="text-sm text-muted-foreground">Estimativa do mês</div>
              <div className="text-2xl font-bold">{formatCurrency(plannedTotal)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Quantidades semanais × {WEEKS_IN_MONTH} semanas
              </div>
            </div>
            <div className="card p-6">
              <div className="text-sm text-muted-foreground">Itens na lista</div>
              <div className="text-2xl font-bold">{items.length}</div>
              <div className="text-xs text-muted-foreground mt-1">{formatMonth(currentMonth)}</div>
            </div>
            <div className="card p-6">
              <div className="text-sm text-muted-foreground">Com frequência semanal</div>
              <div className="text-2xl font-bold">
                {items.filter(i => i.frequency === "weekly").length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Viram quantidade mensal na aba Real
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-muted-foreground">Nenhum item no planejamento de {formatMonth(currentMonth)}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Adicione itens com frequência (semanal/mensal) ou duplique o mês anterior
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedByCategory.map(([category, categoryItems]) => (
                <div key={category} className="space-y-2">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {category}
                  </h2>
                  <div className="card divide-y divide-border overflow-hidden">
                    {categoryItems.map(item => (
                      <PlanningRow
                        key={item._id}
                        item={item}
                        onEdit={() => setEditingItem(item)}
                        onDelete={() => handleDelete(item)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "real" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="card p-6">
              <div className="text-sm text-muted-foreground">Planejado</div>
              <div className="text-2xl font-bold">{formatCurrency(plannedTotal)}</div>
              <div className="text-xs text-muted-foreground mt-1">{items.length} itens</div>
            </div>
            <div className="card p-6">
              <div className="text-sm text-muted-foreground">Gasto Real</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(spentTotal)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{purchasedCount} comprado(s)</div>
            </div>
            <div className="card p-6">
              <div className="text-sm text-muted-foreground">Falta Comprar</div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(remainingTotal)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {items.length - purchasedCount} pendente(s)
              </div>
            </div>
            <div className="card p-6">
              <div className="text-sm text-muted-foreground">Diferença</div>
              <div
                className={`text-2xl font-bold ${
                  spentTotal - (plannedTotal - remainingTotal) > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {formatCurrency(spentTotal - (plannedTotal - remainingTotal))}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Real vs. planejado (comprados)</div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-muted-foreground">Nenhum item para {formatMonth(currentMonth)}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Monte a lista na aba Planejamento Mensal primeiro
              </p>
              <button
                onClick={() => setActiveTab("planejamento")}
                className="btn btn-primary mt-4 px-4 py-2 text-sm"
              >
                Ir para Planejamento
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Quantidades já convertidas para o mês (itens semanais × {WEEKS_IN_MONTH}).
                Marque o que comprou e, se quiser, informe o valor gasto.
              </p>
              {groupedByCategory.map(([category, categoryItems]) => (
                <div key={category} className="space-y-2">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {category}
                  </h2>
                  <div className="card divide-y divide-border overflow-hidden">
                    {categoryItems.map(item => (
                      <RealMonthRow
                        key={item._id}
                        item={item}
                        onToggle={async (actualAmount) => {
                          if (item.isPurchased) {
                            await setPurchased(item._id, false);
                          } else {
                            await setPurchased(item._id, true, actualAmount);
                          }
                        }}
                        onSaveAmount={async (actualAmount) => {
                          await setPurchased(item._id, true, actualAmount);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showModal && (
        <ShoppingItemModal
          saving={saving}
          onSave={async (data) => {
            await addItem(data);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}

      {editingItem && (
        <ShoppingItemModal
          item={editingItem}
          saving={saving}
          onSave={async (data) => {
            await updateItem(editingItem._id, { ...data, month: currentMonth });
            setEditingItem(null);
          }}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

function PlanningRow({
  item,
  onEdit,
  onDelete
}: {
  item: ShoppingPlanItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const qtyMonth = monthlyQuantity(item);
  const estimated = monthlyEstimatedTotal(item);

  return (
    <div className="flex items-center gap-3 p-4">
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{item.name}</div>
        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-2">
          <span>
            {item.quantity} {item.unit} · {FREQUENCY_LABEL[item.frequency]}
          </span>
          {item.frequency === "weekly" && (
            <>
              <span>→</span>
              <span>
                {qtyMonth} {item.unit}/mês
              </span>
            </>
          )}
          <span>·</span>
          <span>{PURCHASE_METHOD_LABEL[item.purchaseMethod]}</span>
        </div>
        {item.notes && <div className="text-xs text-muted-foreground italic mt-0.5">{item.notes}</div>}
      </div>

      <div className="text-right flex-shrink-0">
        <div className="font-medium">{formatCurrency(estimated)}</div>
        {item.estimatedUnitPrice > 0 && (
          <div className="text-xs text-muted-foreground">
            {formatCurrency(item.estimatedUnitPrice)}/{item.unit}
          </div>
        )}
      </div>

      <div className="flex gap-1 flex-shrink-0">
        <button onClick={onEdit} className="p-1 rounded hover:bg-accent transition" title="Editar">
          Editar
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded hover:bg-destructive/10 text-destructive transition"
          title="Excluir"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}

function RealMonthRow({
  item,
  onToggle,
  onSaveAmount
}: {
  item: ShoppingPlanItem;
  onToggle: (actualAmount?: number) => void;
  onSaveAmount: (actualAmount: number) => void;
}) {
  const qtyMonth = monthlyQuantity(item);
  const estimated = monthlyEstimatedTotal(item);
  const [amountDisplay, setAmountDisplay] = useState(() =>
    item.actualAmount != null
      ? formatCurrencyInput(item.actualAmount)
      : estimated > 0
        ? formatCurrencyInput(estimated)
        : ""
  );
  const [savingAmount, setSavingAmount] = useState(false);

  useEffect(() => {
    setAmountDisplay(
      item.actualAmount != null
        ? formatCurrencyInput(item.actualAmount)
        : estimated > 0
          ? formatCurrencyInput(estimated)
          : ""
    );
  }, [item._id, item.actualAmount, item.isPurchased, estimated]);

  const handleToggle = async () => {
    const parsed = amountDisplay.trim() ? parseCurrencyInputNew(amountDisplay) : undefined;
    await onToggle(parsed);
  };

  const handleSaveAmount = async () => {
    if (!amountDisplay.trim()) return;
    setSavingAmount(true);
    try {
      await onSaveAmount(parseCurrencyInputNew(amountDisplay));
    } finally {
      setSavingAmount(false);
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 ${item.isPurchased ? "bg-muted/40" : ""}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={handleToggle}
          aria-label={item.isPurchased ? "Marcar como pendente" : "Marcar como comprado"}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
            item.isPurchased
              ? "bg-green-600 border-green-600 text-white"
              : "border-muted-foreground/40 hover:border-primary"
          }`}
        >
          {item.isPurchased && "✓"}
        </button>

        <div className="flex-1 min-w-0">
          <div className={`font-medium truncate ${item.isPurchased ? "line-through text-muted-foreground" : ""}`}>
            {item.name}
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">
              {qtyMonth} {item.unit}
            </span>
            {item.frequency === "weekly" && (
              <span> (de {item.quantity} {item.unit}/semana)</span>
            )}
            {estimated > 0 && !item.isPurchased && (
              <span> · estimado {formatCurrency(estimated)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:ml-auto pl-9 sm:pl-0">
        <div className="relative flex-1 sm:w-32">
          <input
            type="text"
            value={amountDisplay}
            onChange={(e) => setAmountDisplay(formatCurrencyWhileTyping(e.target.value))}
            onBlur={() => {
              if (item.isPurchased && amountDisplay.trim()) {
                handleSaveAmount();
              }
            }}
            className="input text-sm py-1.5"
            placeholder="Valor (opc.)"
            aria-label={`Valor gasto em ${item.name}`}
          />
        </div>
        {item.isPurchased && amountDisplay.trim() && (
          <button
            onClick={handleSaveAmount}
            disabled={savingAmount}
            className="btn btn-secondary text-xs px-2 py-1.5 disabled:opacity-50"
            title="Salvar valor"
          >
            OK
          </button>
        )}
        {item.isPurchased && item.actualAmount != null && (
          <div className="text-sm font-semibold text-green-600 dark:text-green-400 whitespace-nowrap hidden sm:block">
            {formatCurrency(item.actualAmount)}
          </div>
        )}
      </div>
    </div>
  );
}

function ShoppingItemModal({
  item,
  saving,
  onSave,
  onClose
}: {
  item?: ShoppingPlanItem;
  saving: boolean;
  onSave: (data: Omit<ShoppingPlanItemInput, "month">) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: item?.name || "",
    category: item?.category || "",
    frequency: item?.frequency || ("monthly" as ShoppingPlanItem["frequency"]),
    quantity: item?.quantity || 1,
    unit: item?.unit || "un",
    purchaseMethod: item?.purchaseMethod || ("store" as ShoppingPlanItem["purchaseMethod"]),
    notes: item?.notes || ""
  });

  const [priceDisplay, setPriceDisplay] = useState(
    item?.estimatedUnitPrice ? formatCurrencyInput(item.estimatedUnitPrice) : ""
  );

  const unitPrice = priceDisplay.trim() ? parseCurrencyInputNew(priceDisplay) : 0;
  const previewMonthlyQty =
    formData.frequency === "weekly" ? formData.quantity * WEEKS_IN_MONTH : formData.quantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      estimatedUnitPrice: unitPrice
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in my-4">
        <h2 className="text-xl font-semibold mb-4">
          {item ? "Editar Item" : "Novo Item de Compra"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome do item</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Ex: Fraldas, Ovos, Carne..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <input
              type="text"
              list="category-suggestions"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input"
              placeholder="Ex: Alimentação, Higiene..."
              required
            />
            <datalist id="category-suggestions">
              {CATEGORY_SUGGESTIONS.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Frequência de compra</label>
            <select
              value={formData.frequency}
              onChange={(e) =>
                setFormData({ ...formData, frequency: e.target.value as ShoppingPlanItem["frequency"] })
              }
              className="input"
            >
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
              <option value="once">Compra única</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Quantidade</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unidade</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="input"
                placeholder="kg, un, pacote, L..."
                required
              />
            </div>
          </div>

          {formData.frequency === "weekly" && formData.quantity > 0 && (
            <div className="text-sm text-muted-foreground p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              No mês: <strong>{previewMonthlyQty} {formData.unit}</strong> ({formData.quantity} × {WEEKS_IN_MONTH} semanas)
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Preço estimado por unidade <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={priceDisplay}
              onChange={(e) => setPriceDisplay(formatCurrencyWhileTyping(e.target.value))}
              className="input"
              placeholder="0,00"
            />
          </div>

          {formData.quantity > 0 && unitPrice > 0 && (
            <div className="text-sm text-muted-foreground p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              Total estimado no mês: {formatCurrency(previewMonthlyQty * unitPrice)}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Forma de compra</label>
            <select
              value={formData.purchaseMethod}
              onChange={(e) =>
                setFormData({ ...formData, purchaseMethod: e.target.value as ShoppingPlanItem["purchaseMethod"] })
              }
              className="input"
            >
              <option value="store">Loja física</option>
              <option value="online">Online</option>
              <option value="both">Online ou loja</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Observações (opcional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows={2}
              placeholder="Ex: marca preferida, loja específica..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={saving} className="btn btn-primary flex-1 px-4 py-3 disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary px-4 py-3">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
