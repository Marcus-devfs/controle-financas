"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient, Category, CreditCard } from "@/lib/api";
import { formatCurrency } from "@/lib/data";

interface ImportItem {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  suggestedCategory: string;
  categoryId: string;
  selected: boolean;
}

export default function ImportarPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [parsing, setParsing] = useState(false);
  const [items, setItems] = useState<ImportItem[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [sourceType, setSourceType] = useState<"account" | "card">("account");
  const [selectedCardId, setSelectedCardId] = useState("");

  useEffect(() => {
    Promise.all([apiClient.getCategories(), apiClient.getCreditCards()]).then(([cats, cards]) => {
      setCategories(cats);
      setCreditCards(cards);
      if (cards.length > 0) setSelectedCardId(cards[0]._id);
    }).catch(console.error);
  }, []);

  const findCategoryId = (suggestedName: string, type: "income" | "expense") => {
    const matching = categories.filter((c) => c.type === type);
    const found = matching.find(
      (c) =>
        c.name.toLowerCase().includes(suggestedName.toLowerCase()) ||
        suggestedName.toLowerCase().includes(c.name.toLowerCase())
    );
    return found?._id || "";
  };

  const processFile = useCallback(
    async (file: File) => {
      setParsing(true);
      setError("");
      setItems([]);
      setImportResult(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("categories", JSON.stringify(categories));

        const response = await fetch("/api/import/parse", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao processar arquivo");
        }

        const importItems: ImportItem[] = (data.transactions || []).map((t: any) => ({
          ...t,
          categoryId: findCategoryId(t.suggestedCategory, t.type),
          selected: true,
        }));

        setItems(importItems);

        if (importItems.length === 0) {
          setError("Nenhuma transação encontrada no arquivo. Verifique se é um extrato bancário ou fatura válida.");
        }
      } catch (err: any) {
        setError(err.message || "Erro ao processar arquivo");
      } finally {
        setParsing(false);
      }
    },
    [categories]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const updateItem = (id: string, changes: Partial<ImportItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleImport = async () => {
    const selected = items.filter((i) => i.selected);
    if (!selected.length) return;

    setImporting(true);
    let success = 0;
    let errors = 0;

    for (const item of selected) {
      try {
        const month = item.date.substring(0, 7);
        await apiClient.createTransaction({
          description: item.description,
          amount: item.amount,
          date: item.date,
          type: item.type,
          categoryId: item.categoryId,
          isPaid: true,
          isFixed: false,
          isRecurring: false,
          month,
          ...(sourceType === "card" && selectedCardId ? { creditCardId: selectedCardId } : {}),
        });
        success++;
      } catch {
        errors++;
      }
    }

    setImportResult({ success, errors });
    setImporting(false);

    if (success > 0) {
      setItems((prev) => prev.filter((i) => !i.selected));
    }
  };

  const selectedCount = items.filter((i) => i.selected).length;
  const noCategoryCount = items.filter((i) => i.selected && !i.categoryId).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">Importar Extrato</h1>
        <p className="text-sm text-foreground/60 mt-1">
          Importe seu extrato bancário ou fatura do cartão. A IA irá extrair e categorizar as transações automaticamente.
        </p>
      </div>

      {/* Configurações */}
      <div className="rounded-xl border border-black/10 p-4 space-y-4">
        <h3 className="font-medium text-sm">Tipo de importação</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="flex gap-2">
              <button
                onClick={() => setSourceType("account")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm border transition ${
                  sourceType === "account"
                    ? "bg-foreground text-background border-foreground"
                    : "border-black/10 hover:bg-foreground/5"
                }`}
              >
                🏦 Extrato Bancário
              </button>
              <button
                onClick={() => setSourceType("card")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm border transition ${
                  sourceType === "card"
                    ? "bg-foreground text-background border-foreground"
                    : "border-black/10 hover:bg-foreground/5"
                }`}
              >
                💳 Fatura do Cartão
              </button>
            </div>
          </div>
          {sourceType === "card" && creditCards.length > 0 && (
            <div className="flex-1">
              <select
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-black/10 bg-background text-foreground text-sm"
              >
                {creditCards.map((card) => (
                  <option key={card._id} value={card._id}>
                    {card.name} ****{card.lastFourDigits}
                  </option>
                ))}
              </select>
            </div>
          )}
          {sourceType === "card" && creditCards.length === 0 && (
            <p className="text-sm text-foreground/60 flex-1">
              Nenhum cartão cadastrado.{" "}
              <a href="/dashboard/cartoes" className="underline">
                Cadastrar cartão
              </a>
            </p>
          )}
        </div>
      </div>

      {/* Upload Area */}
      {items.length === 0 && !parsing && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
            dragOver ? "border-blue-400 bg-blue-50" : "border-black/20 hover:border-black/40"
          }`}
        >
          <div className="text-5xl mb-4">📂</div>
          <p className="text-lg font-medium mb-1">Arraste seu arquivo aqui</p>
          <p className="text-sm text-foreground/60 mb-4">ou clique no botão abaixo para selecionar</p>
          <p className="text-xs text-foreground/40 mb-6">Formatos aceitos: PDF · OFX · QFX · CSV</p>
          <label className="btn btn-primary px-6 py-2 cursor-pointer inline-block">
            Selecionar arquivo
            <input
              type="file"
              accept=".pdf,.ofx,.qfx,.csv"
              className="hidden"
              onChange={handleFileInput}
            />
          </label>
        </div>
      )}

      {/* Carregando */}
      {parsing && (
        <div className="rounded-xl border border-black/10 p-12 text-center">
          <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-medium">Analisando arquivo com IA...</p>
          <p className="text-sm text-foreground/60 mt-1">Extraindo e categorizando transações automaticamente</p>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <span className="text-red-500 text-lg">⚠️</span>
          <div className="flex-1">
            <p className="font-medium text-red-700 text-sm">Erro ao processar arquivo</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={() => { setError(""); setItems([]); }}
              className="mt-2 text-sm text-red-600 underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Resultado da importação */}
      {importResult && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
          <span className="text-green-500 text-lg">✅</span>
          <div>
            <p className="font-medium text-green-700 text-sm">
              {importResult.success} {importResult.success === 1 ? "transação importada" : "transações importadas"} com sucesso
            </p>
            {importResult.errors > 0 && (
              <p className="text-red-600 text-sm mt-1">
                {importResult.errors} {importResult.errors === 1 ? "transação com erro" : "transações com erro"}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      {items.length > 0 && !parsing && (
        <div className="space-y-4">
          {/* Header da prévia */}
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold">{items.length} transações encontradas</h3>
              <p className="text-sm text-foreground/60">
                {selectedCount} selecionadas para importar
                {noCategoryCount > 0 && (
                  <span className="text-amber-600 ml-2">· {noCategoryCount} sem categoria</span>
                )}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setItems((prev) => prev.map((i) => ({ ...i, selected: true })))}
                className="text-sm px-3 py-1.5 rounded-lg border border-black/10 hover:bg-foreground/5 transition"
              >
                Selecionar tudo
              </button>
              <button
                onClick={() => setItems((prev) => prev.map((i) => ({ ...i, selected: false })))}
                className="text-sm px-3 py-1.5 rounded-lg border border-black/10 hover:bg-foreground/5 transition"
              >
                Desmarcar tudo
              </button>
              <label className="text-sm px-3 py-1.5 rounded-lg border border-black/10 hover:bg-foreground/5 transition cursor-pointer">
                Importar outro arquivo
                <input
                  type="file"
                  accept=".pdf,.ofx,.qfx,.csv"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </label>
              <button
                onClick={handleImport}
                disabled={importing || selectedCount === 0}
                className="btn btn-primary px-4 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span>
                    Importando...
                  </span>
                ) : (
                  `Importar ${selectedCount} transações`
                )}
              </button>
            </div>
          </div>

          {/* Cards Mobile */}
          <div className="md:hidden space-y-3">
            {items.map((item) => (
              <MobileImportCard
                key={item.id}
                item={item}
                categories={categories}
                onChange={(changes) => updateItem(item.id, changes)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </div>

          {/* Tabela Desktop */}
          <div className="hidden md:block rounded-xl border border-black/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-foreground/5">
                  <tr>
                    <th className="p-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={items.length > 0 && selectedCount === items.length}
                        onChange={(e) =>
                          setItems((prev) => prev.map((i) => ({ ...i, selected: e.target.checked })))
                        }
                        className="rounded"
                      />
                    </th>
                    <th className="p-3 text-left text-sm font-medium">Data</th>
                    <th className="p-3 text-left text-sm font-medium">Descrição</th>
                    <th className="p-3 text-left text-sm font-medium">Tipo</th>
                    <th className="p-3 text-left text-sm font-medium">Categoria</th>
                    <th className="p-3 text-right text-sm font-medium">Valor</th>
                    <th className="p-3 text-center text-sm font-medium w-20">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const matchingCats = categories.filter((c) => c.type === item.type);
                    return (
                      <tr
                        key={item.id}
                        className={`border-t border-black/5 transition-opacity ${!item.selected ? "opacity-40" : ""}`}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={(e) => updateItem(item.id, { selected: e.target.checked })}
                            className="rounded"
                          />
                        </td>
                        <td className="p-3 text-sm whitespace-nowrap">
                          {formatDate(item.date)}
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, { description: e.target.value })}
                            className="w-full min-w-48 text-sm px-2 py-1 rounded border border-transparent hover:border-black/10 focus:border-blue-400 focus:outline-none bg-transparent focus:bg-white transition"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={item.type}
                            onChange={(e) =>
                              updateItem(item.id, {
                                type: e.target.value as "income" | "expense",
                                categoryId: "",
                              })
                            }
                            className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${
                              item.type === "income"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            <option value="income">Receita</option>
                            <option value="expense">Despesa</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select
                            value={item.categoryId}
                            onChange={(e) => updateItem(item.id, { categoryId: e.target.value })}
                            className={`text-sm px-2 py-1 rounded-lg border bg-background text-foreground ${
                              !item.categoryId ? "border-amber-300" : "border-black/10"
                            }`}
                          >
                            <option value="">Sem categoria</option>
                            {matchingCats.map((c) => (
                              <option key={c._id} value={c._id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td
                          className={`p-3 text-sm font-medium text-right whitespace-nowrap ${
                            item.type === "income" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {item.type === "income" ? "+" : "-"}
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded transition"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botão inferior */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleImport}
              disabled={importing || selectedCount === 0}
              className="btn btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span>
                  Importando {selectedCount} transações...
                </span>
              ) : (
                `Importar ${selectedCount} transações`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileImportCard({
  item,
  categories,
  onChange,
  onRemove,
}: {
  item: ImportItem;
  categories: Category[];
  onChange: (changes: Partial<ImportItem>) => void;
  onRemove: () => void;
}) {
  const matchingCats = categories.filter((c) => c.type === item.type);

  return (
    <div
      className={`bg-white rounded-xl border p-4 shadow-sm transition-opacity ${
        !item.selected ? "opacity-50 border-gray-200" : "border-gray-200"
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <input
          type="checkbox"
          checked={item.selected}
          onChange={(e) => onChange({ selected: e.target.checked })}
          className="mt-1 rounded flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={item.description}
            onChange={(e) => onChange({ description: e.target.value })}
            className="w-full text-sm font-medium bg-transparent border-b border-transparent hover:border-black/20 focus:border-blue-400 focus:outline-none pb-0.5"
          />
          <p className="text-xs text-gray-500 mt-1">{formatDate(item.date)}</p>
        </div>
        <span
          className={`text-sm font-semibold whitespace-nowrap flex-shrink-0 ${
            item.type === "income" ? "text-green-600" : "text-red-600"
          }`}
        >
          {item.type === "income" ? "+" : "-"}
          {formatCurrency(item.amount)}
        </span>
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        <select
          value={item.type}
          onChange={(e) =>
            onChange({ type: e.target.value as "income" | "expense", categoryId: "" })
          }
          className={`text-xs px-2 py-1 rounded-full font-medium border-0 ${
            item.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          <option value="income">Receita</option>
          <option value="expense">Despesa</option>
        </select>
        <select
          value={item.categoryId}
          onChange={(e) => onChange({ categoryId: e.target.value })}
          className={`flex-1 text-xs px-2 py-1 rounded-lg border bg-background text-foreground ${
            !item.categoryId ? "border-amber-300" : "border-black/10"
          }`}
        >
          <option value="">Sem categoria</option>
          {matchingCats.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          onClick={onRemove}
          className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded transition flex-shrink-0"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}
