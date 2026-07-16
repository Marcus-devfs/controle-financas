"use client";

import { useState } from "react";
import { useInvestments } from "@/hooks/useInvestments";
import { formatCurrency } from "@/lib/data";
import {
  InvestmentAccount,
  AccountPortfolioSummary,
  InvestmentMovement,
  InvestmentLotSummary
} from "@/lib/api";
import { formatCurrencyWhileTyping, parseCurrencyInputNew } from "@/lib/utils";
import { InvestmentDashboard } from "./InvestmentDashboard";

const IR_TABLE = [
  { period: "Até 180 dias", rate: "22,5%" },
  { period: "181 a 360 dias", rate: "20%" },
  { period: "361 a 720 dias", rate: "17,5%" },
  { period: "Acima de 720 dias", rate: "15%" },
];

export default function InvestimentosPage() {
  const {
    portfolio,
    accounts,
    movements,
    selectedAccountId,
    setSelectedAccountId,
    loading,
    saving,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    addMovement,
    deleteMovement,
    syncCdi,
    getAccountSummary,
    getDisplayAccounts,
    refresh
  } = useInvestments();

  const [activeTab, setActiveTab] = useState<'resumo' | 'aplicacoes'>('resumo');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<InvestmentAccount | null>(null);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementType, setMovementType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [bankImportMode, setBankImportMode] = useState(true);
  const [showLotsModal, setShowLotsModal] = useState(false);
  const [lotsAccount, setLotsAccount] = useState<AccountPortfolioSummary | null>(null);

  if (loading) {
    return <div className="space-y-4">Carregando carteira...</div>;
  }

  const displayAccounts = getDisplayAccounts();
  const selectedSummary = selectedAccountId ? getAccountSummary(selectedAccountId) : null;
  const hasNoMovements = displayAccounts.every(a => a.totalDeposits === 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Investimentos</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Carteira CDI com rendimento diário e IR regressivo
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={async () => {
              try {
                const result = await syncCdi();
                alert(`${result.count} taxas CDI sincronizadas com sucesso!`);
              } catch (err: any) {
                alert('Erro ao sincronizar CDI: ' + err.message);
              }
            }}
            disabled={saving}
            className="btn btn-secondary px-3 py-2 text-sm disabled:opacity-50"
          >
            {saving ? 'Atualizando...' : '🔄 Atualizar CDI'}
          </button>
          <button
            onClick={() => refresh()}
            disabled={saving}
            className="btn btn-secondary px-3 py-2 text-sm disabled:opacity-50"
          >
            ↻ Recalcular
          </button>
          <button
            onClick={() => { setEditingAccount(null); setShowAccountModal(true); }}
            className="btn btn-primary px-3 py-2 text-sm"
          >
            + Nova Conta
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Abas */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('resumo')}
          className={`px-3 sm:px-4 py-2 font-medium text-sm transition flex-1 sm:flex-none ${
            activeTab === 'resumo'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="sm:hidden">📊</span>
          <span className="hidden sm:inline">📊 Resumo</span>
        </button>
        <button
          onClick={() => setActiveTab('aplicacoes')}
          className={`px-3 sm:px-4 py-2 font-medium text-sm transition flex-1 sm:flex-none ${
            activeTab === 'aplicacoes'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="sm:hidden">💼</span>
          <span className="hidden sm:inline">💼 Aplicações</span>
        </button>
      </div>

      {activeTab === 'resumo' && (
        <>
          {portfolio && accounts.length > 0 ? (
            <InvestmentDashboard portfolio={portfolio} />
          ) : accounts.length === 0 ? (
            <EmptyState onCreateAccount={() => {
              setActiveTab('aplicacoes');
              setShowAccountModal(true);
            }} />
          ) : (
            <div className="rounded-xl border border-black/10 p-8 text-center text-foreground/60">
              Carregando resumo da carteira...
            </div>
          )}
        </>
      )}

      {activeTab === 'aplicacoes' && (
        <>
          {portfolio && (
            <PortfolioSummaryCards portfolio={portfolio} />
          )}

          {accounts.length === 0 ? (
            <EmptyState onCreateAccount={() => setShowAccountModal(true)} />
          ) : (
            <>
              {hasNoMovements && (
                <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-300">
                        Próximo passo: registrar seus saldos atuais
                      </p>
                      <p className="text-sm text-blue-700/80 dark:text-blue-400/80 mt-1">
                        Clique em <strong>Importar saldo</strong> em cada conta e use os valores bruto e líquido do app do banco (Itaú, Nubank, etc.).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-lg font-semibold mb-3">Minhas Contas ({displayAccounts.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayAccounts.map(account => (
                    <AccountCard
                      key={account.accountId}
                      account={account}
                      isSelected={selectedAccountId === account.accountId}
                      onSelect={() => setSelectedAccountId(
                        selectedAccountId === account.accountId ? null : account.accountId
                      )}
                      onEdit={() => {
                        const acc = accounts.find(a => a._id === account.accountId);
                        if (acc) { setEditingAccount(acc); setShowAccountModal(true); }
                      }}
                      onDelete={async () => {
                        if (window.confirm(`Excluir "${account.name}" e todas as movimentações?`)) {
                          await deleteAccount(account.accountId);
                        }
                      }}
                      onDeposit={() => {
                        setSelectedAccountId(account.accountId);
                        setMovementType('deposit');
                        setBankImportMode(false);
                        setShowMovementModal(true);
                      }}
                      onImportBank={() => {
                        setSelectedAccountId(account.accountId);
                        setMovementType('deposit');
                        setBankImportMode(true);
                        setShowMovementModal(true);
                      }}
                      onWithdraw={() => {
                        setSelectedAccountId(account.accountId);
                        setMovementType('withdrawal');
                        setShowMovementModal(true);
                      }}
                      onViewLots={() => {
                        setLotsAccount(account);
                        setShowLotsModal(true);
                      }}
                    />
                  ))}
                </div>
              </div>

              {selectedAccountId && selectedSummary && (
                <MovementsSection
                  account={selectedSummary}
                  movements={movements}
                  onImportBank={() => { setMovementType('deposit'); setBankImportMode(true); setShowMovementModal(true); }}
                  onAddDeposit={() => { setMovementType('deposit'); setBankImportMode(false); setShowMovementModal(true); }}
                  onAddWithdrawal={() => { setMovementType('withdrawal'); setShowMovementModal(true); }}
                  onDeleteMovement={async (id) => {
                    if (window.confirm('Excluir esta movimentação?')) {
                      await deleteMovement(id);
                    }
                  }}
                />
              )}

              {!selectedAccountId && displayAccounts.length > 0 && (
                <p className="text-sm text-foreground/50 text-center">
                  Clique em uma conta para ver o histórico de movimentações
                </p>
              )}
            </>
          )}

          <IrTableSection />

          {portfolio?.lastCdiUpdate ? (
            <p className="text-xs text-foreground/40 text-center">
              CDI atualizado em {new Date(portfolio.lastCdiUpdate + 'T12:00:00').toLocaleDateString('pt-BR')}
              {portfolio.currentCdiRate !== null && ` · Taxa diária: ${portfolio.currentCdiRate.toFixed(6)}%`}
            </p>
          ) : accounts.length > 0 && (
            <p className="text-xs text-amber-600 text-center">
              CDI ainda não sincronizado — clique em &quot;Atualizar CDI&quot; para buscar as taxas do Banco Central
            </p>
          )}
        </>
      )}

      {showAccountModal && (
        <AccountModal
          account={editingAccount}
          onSave={async (data) => {
            if (editingAccount) {
              await updateAccount(editingAccount._id, data);
            } else {
              await createAccount(data as Omit<InvestmentAccount, '_id' | 'userId' | 'createdAt' | 'updatedAt'>);
            }
            setShowAccountModal(false);
            setEditingAccount(null);
          }}
          onClose={() => { setShowAccountModal(false); setEditingAccount(null); }}
          saving={saving}
        />
      )}

      {showMovementModal && selectedAccountId && selectedSummary && (
        <MovementModal
          type={movementType}
          initialBankImport={bankImportMode}
          account={selectedSummary}
          onSave={async (data) => {
            await addMovement(selectedAccountId, data);
            setShowMovementModal(false);
          }}
          onClose={() => setShowMovementModal(false)}
          saving={saving}
        />
      )}

      {showLotsModal && lotsAccount && (
        <LotsModal
          account={lotsAccount}
          onClose={() => { setShowLotsModal(false); setLotsAccount(null); }}
        />
      )}
    </div>
  );
}

function PortfolioSummaryCards({ portfolio }: { portfolio: NonNullable<ReturnType<typeof useInvestments>['portfolio']> }) {
  const cards = [
    { label: 'Saldo Total', value: portfolio.totalBalance, color: 'text-blue-600 dark:text-blue-400', sub: 'Bruto acumulado' },
    { label: 'Rendimento', value: portfolio.totalGrossYield, color: 'text-green-600 dark:text-green-400', sub: 'Lucro bruto' },
    { label: 'IR Estimado', value: portfolio.totalEstimatedIr, color: 'text-orange-600 dark:text-orange-400', sub: 'Se resgatar hoje' },
    { label: 'Saldo Líquido', value: portfolio.totalNetBalance, color: 'text-purple-600 dark:text-purple-400', sub: 'Após IR' },
    { label: 'Rendimento Hoje', value: portfolio.todayYield, color: 'text-emerald-600 dark:text-emerald-400', sub: 'Dia útil atual' },
    { label: 'Rendimento no Mês', value: portfolio.monthYield, color: 'text-teal-600 dark:text-teal-400', sub: 'Mês corrente' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(card => (
        <div key={card.label} className="rounded-xl border border-black/10 dark:border-white/10 p-4">
          <div className="text-xs text-foreground/60 mb-1">{card.label}</div>
          <div className={`text-lg sm:text-xl font-bold ${card.color}`}>
            {formatCurrency(card.value)}
          </div>
          <div className="text-xs text-foreground/40 mt-1">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onCreateAccount }: { onCreateAccount: () => void }) {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-12 text-center">
      <div className="text-4xl mb-4">📈</div>
      <h3 className="text-lg font-semibold mb-2">Configure sua carteira</h3>
      <p className="text-foreground/60 mb-6 max-w-md mx-auto">
        Adicione suas contas de CDB, Caixinhas e outros investimentos atrelados ao CDI.
        O sistema calcula o rendimento diário e estima o IR automaticamente.
      </p>
      <button onClick={onCreateAccount} className="btn btn-primary px-6 py-3">
        + Criar primeira conta
      </button>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto text-left">
        {[
          { name: 'CDB Itaú', cdi: '100% CDI', color: '#ff6200' },
          { name: 'Caixinha Nubank', cdi: '100% CDI', color: '#820ad1' },
          { name: 'CDB C6', cdi: '102% CDI', color: '#000000' },
        ].map(ex => (
          <div key={ex.name} className="text-sm p-3 rounded-lg bg-foreground/5">
            <div className="font-medium">{ex.name}</div>
            <div className="text-foreground/60">{ex.cdi}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountCard({
  account,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onDeposit,
  onImportBank,
  onWithdraw,
  onViewLots
}: {
  account: AccountPortfolioSummary;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDeposit: () => void;
  onImportBank: () => void;
  onWithdraw: () => void;
  onViewLots: () => void;
}) {
  const pct = account.currentBalance > 0
    ? ((account.grossYield / account.currentBalance) * 100).toFixed(2)
    : '0.00';

  return (
    <div
      className={`rounded-xl border p-5 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/20'
          : 'border-black/10 dark:border-white/10 hover:border-black/20'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }} />
          <div>
            <div className="font-semibold">{account.name}</div>
            <div className="text-xs text-foreground/60">{account.institution} · {account.cdiPercentage}% CDI</div>
          </div>
        </div>
        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={onEdit} className="text-xs px-2 py-1 rounded hover:bg-foreground/10">✏️</button>
          <button onClick={onDelete} className="text-xs px-2 py-1 rounded hover:bg-red-100 text-red-600">🗑</button>
        </div>
      </div>

      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
        {formatCurrency(account.currentBalance)}
      </div>
      {account.currentBalance === 0 ? (
        <div className="text-xs text-foreground/60 mb-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
          Nenhum saldo registrado — clique em <strong>Importar saldo</strong> abaixo
        </div>
      ) : (
        <div className="text-xs text-foreground/60 mb-3">
          Principal: {formatCurrency(account.principal)} · Rendimento: {formatCurrency(account.grossYield)} ({pct}%)
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="bg-foreground/5 rounded-lg p-2">
          <div className="text-foreground/60">IR estimado</div>
          <div className="font-medium text-orange-600">{formatCurrency(account.estimatedIr)}</div>
        </div>
        <div className="bg-foreground/5 rounded-lg p-2">
          <div className="text-foreground/60">Líquido</div>
          <div className="font-medium text-purple-600">{formatCurrency(account.netBalance)}</div>
        </div>
      </div>

      <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
        <button
          onClick={onImportBank}
          className="w-full text-xs py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
        >
          🏦 Importar saldo do banco
        </button>
        <div className="flex gap-2">
          <button
            onClick={onDeposit}
            className="flex-1 text-xs py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
          >
            + Aporte
          </button>
          <button
            onClick={onWithdraw}
            className="flex-1 text-xs py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition"
          >
            − Resgate
          </button>
          {account.lots.length > 0 && (
            <button
              onClick={onViewLots}
              className="text-xs py-2 px-3 rounded-lg border border-black/10 hover:bg-foreground/5 transition"
              title="Ver lotes e IR"
            >
              IR
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MovementsSection({
  account,
  movements,
  onImportBank,
  onAddDeposit,
  onAddWithdrawal,
  onDeleteMovement
}: {
  account: AccountPortfolioSummary;
  movements: InvestmentMovement[];
  onImportBank: () => void;
  onAddDeposit: () => void;
  onAddWithdrawal: () => void;
  onDeleteMovement: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5">
        <h3 className="font-semibold">Movimentações — {account.name}</h3>
        <div className="flex gap-2 flex-wrap">
          <button onClick={onImportBank} className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white">🏦 Importar saldo</button>
          <button onClick={onAddDeposit} className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white">+ Aporte</button>
          <button onClick={onAddWithdrawal} className="text-xs px-3 py-1.5 rounded-lg bg-orange-600 text-white">− Resgate</button>
        </div>
      </div>

      {movements.length === 0 ? (
        <div className="p-8 text-center text-foreground/60 text-sm">
          Nenhuma movimentação registrada. Faça seu primeiro aporte para começar a render.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-foreground/5">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Data</th>
                <th className="text-left p-3 text-sm font-medium">Tipo</th>
                <th className="text-left p-3 text-sm font-medium">Descrição</th>
                <th className="text-right p-3 text-sm font-medium">Valor</th>
                <th className="text-center p-3 text-sm font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {movements.map(mov => (
                <tr key={mov._id} className="border-t border-black/5 dark:border-white/5">
                  <td className="p-3 text-sm">
                    {new Date(mov.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-3 text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      mov.type === 'deposit'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : mov.type === 'snapshot'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {mov.type === 'deposit' ? 'Aporte' : mov.type === 'snapshot' ? 'Importação' : 'Resgate'}
                    </span>
                  </td>
                  <td className="p-3 text-sm">{mov.description || '—'}</td>
                  <td className={`p-3 text-sm font-medium text-right ${
                    mov.type === 'withdrawal' ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {mov.type === 'withdrawal' ? '−' : '+'}{formatCurrency(mov.amount)}
                    {mov.type === 'snapshot' && mov.netBalance !== undefined && (
                      <div className="text-xs text-foreground/50 font-normal">
                        Líq: {formatCurrency(mov.netBalance)}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => onDeleteMovement(mov._id)}
                      className="text-xs px-2 py-1 rounded hover:bg-red-100 text-red-600"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function IrTableSection() {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-6">
      <h3 className="font-semibold mb-3">Tabela de IR — Renda Fixa (Regressiva)</h3>
      <p className="text-sm text-foreground/60 mb-4">
        O imposto incide apenas sobre o rendimento, não sobre o principal investido.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {IR_TABLE.map(row => (
          <div key={row.period} className="bg-foreground/5 rounded-lg p-3 text-center">
            <div className="text-xs text-foreground/60">{row.period}</div>
            <div className="text-lg font-bold text-orange-600">{row.rate}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountModal({
  account,
  onSave,
  onClose,
  saving
}: {
  account: InvestmentAccount | null;
  onSave: (data: Partial<InvestmentAccount>) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    name: account?.name || '',
    institution: account?.institution || '',
    cdiPercentage: account?.cdiPercentage || 100,
    color: account?.color || '#3b82f6',
    isActive: account?.isActive ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  const presets = [
    { name: 'CDB Itaú', institution: 'Itaú', cdiPercentage: 100, color: '#ff6200' },
    { name: 'Caixinha Nubank', institution: 'Nubank', cdiPercentage: 100, color: '#820ad1' },
    { name: 'CDB C6', institution: 'C6 Bank', cdiPercentage: 102, color: '#1a1a1a' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          {account ? 'Editar Conta' : 'Nova Conta de Investimento'}
        </h2>

        {!account && (
          <div className="mb-4">
            <div className="text-xs text-foreground/60 mb-2">Modelos rápidos:</div>
            <div className="flex flex-wrap gap-2">
              {presets.map(p => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setForm({ ...form, ...p })}
                  className="text-xs px-3 py-1.5 rounded-full border border-black/10 hover:bg-foreground/5"
                  style={{ borderColor: p.color + '40' }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full p-3 rounded-lg border border-black/10 dark:border-white/10 bg-background"
              placeholder="Ex: CDB Itaú"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Instituição</label>
            <input
              type="text"
              value={form.institution}
              onChange={e => setForm({ ...form, institution: e.target.value })}
              className="w-full p-3 rounded-lg border border-black/10 dark:border-white/10 bg-background"
              placeholder="Ex: Itaú"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Percentual do CDI (%)</label>
            <input
              type="number"
              value={form.cdiPercentage}
              onChange={e => setForm({ ...form, cdiPercentage: parseFloat(e.target.value) || 0 })}
              className="w-full p-3 rounded-lg border border-black/10 dark:border-white/10 bg-background"
              min={0}
              max={500}
              step={0.01}
              required
            />
            <p className="text-xs text-foreground/50 mt-1">100 = 100% do CDI, 102 = 102% do CDI</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cor</label>
            <input
              type="color"
              value={form.color}
              onChange={e => setForm({ ...form, color: e.target.value })}
              className="w-full h-10 rounded-lg border border-black/10 cursor-pointer"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-3 border border-black/10 rounded-lg hover:bg-foreground/5">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MovementModal({
  type,
  initialBankImport = true,
  account,
  onSave,
  onClose,
  saving
}: {
  type: 'deposit' | 'withdrawal';
  initialBankImport?: boolean;
  account: AccountPortfolioSummary;
  onSave: (data: Omit<InvestmentMovement, '_id' | 'userId' | 'accountId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}) {
  const [bankImport, setBankImport] = useState(type === 'deposit' && initialBankImport);
  const [amountDisplay, setAmountDisplay] = useState('');
  const [netBalanceDisplay, setNetBalanceDisplay] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [investmentStartDate, setInvestmentStartDate] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseCurrencyInputNew(amountDisplay);
    if (amount <= 0) return;

    if (bankImport && type === 'deposit') {
      const netBalance = parseCurrencyInputNew(netBalanceDisplay);
      if (netBalance <= 0 || netBalance >= amount) {
        alert('Saldo líquido deve ser menor que o saldo bruto');
        return;
      }
      if (!investmentStartDate) {
        alert('Informe a data em que o dinheiro entrou no investimento');
        return;
      }
      await onSave({
        type: 'snapshot',
        amount,
        netBalance,
        investmentStartDate,
        date,
        description: description || 'Importação de saldo do banco'
      });
      return;
    }

    await onSave({ type, amount, date, description });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-1">
          {type === 'deposit'
            ? (bankImport ? 'Importar Saldo do Banco' : 'Registrar Aporte')
            : 'Registrar Resgate'}
        </h2>
        <p className="text-sm text-foreground/60 mb-4">
          {account.name} · Saldo atual: {formatCurrency(account.currentBalance)}
        </p>

        {type === 'deposit' && (
          <div className="flex rounded-lg border border-black/10 p-1 mb-4">
            <button
              type="button"
              onClick={() => setBankImport(true)}
              className={`flex-1 text-xs py-2 rounded-md transition ${bankImport ? 'bg-blue-600 text-white' : 'hover:bg-foreground/5'}`}
            >
              Saldo do banco
            </button>
            <button
              type="button"
              onClick={() => setBankImport(false)}
              className={`flex-1 text-xs py-2 rounded-md transition ${!bankImport ? 'bg-green-600 text-white' : 'hover:bg-foreground/5'}`}
            >
              Novo aporte
            </button>
          </div>
        )}

        {bankImport && type === 'deposit' && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 mb-4 text-xs text-blue-800 dark:text-blue-300">
            Use os valores exatos do app do banco (como Itaú, Nubank). O sistema calcula principal, rendimento e IR automaticamente.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {bankImport && type === 'deposit' ? 'Saldo bruto (do banco)' : 'Valor'}
            </label>
            <input
              type="text"
              value={amountDisplay}
              onChange={e => setAmountDisplay(formatCurrencyWhileTyping(e.target.value))}
              className="w-full p-3 rounded-lg border border-black/10 dark:border-white/10 bg-background"
              placeholder="0,00"
              required
            />
          </div>

          {bankImport && type === 'deposit' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Saldo líquido (do banco)</label>
                <input
                  type="text"
                  value={netBalanceDisplay}
                  onChange={e => setNetBalanceDisplay(formatCurrencyWhileTyping(e.target.value))}
                  className="w-full p-3 rounded-lg border border-black/10 dark:border-white/10 bg-background"
                  placeholder="Valor se resgatar hoje"
                  required
                />
                <p className="text-xs text-foreground/50 mt-1">No Itaú: coluna &quot;Saldo Líquido&quot;</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data que o dinheiro entrou</label>
                <input
                  type="date"
                  value={investmentStartDate}
                  onChange={e => setInvestmentStartDate(e.target.value)}
                  className="w-full p-3 rounded-lg border border-black/10 dark:border-white/10 bg-background"
                  required
                />
                <p className="text-xs text-foreground/50 mt-1">Define a alíquota de IR (22,5%, 20%, etc.)</p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              {bankImport && type === 'deposit' ? 'Data do saldo' : 'Data'}
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full p-3 rounded-lg border border-black/10 dark:border-white/10 bg-background"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descrição (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-3 rounded-lg border border-black/10 dark:border-white/10 bg-background"
              placeholder={bankImport ? 'Ex: Venda do Apartamento' : type === 'deposit' ? 'Ex: Transferência do salário' : 'Ex: Reserva de emergência'}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 px-4 py-3 text-white rounded-lg disabled:opacity-50 ${
                type === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {saving ? 'Salvando...' : bankImport && type === 'deposit' ? 'Importar Saldo' : type === 'deposit' ? 'Confirmar Aporte' : 'Confirmar Resgate'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-3 border border-black/10 rounded-lg hover:bg-foreground/5">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LotsModal({
  account,
  onClose
}: {
  account: AccountPortfolioSummary;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-1">Lotes e IR — {account.name}</h2>
        <p className="text-sm text-foreground/60 mb-4">
          Cada aporte forma um lote com alíquota de IR baseada no tempo investido.
        </p>

        {account.lots.length === 0 ? (
          <p className="text-foreground/60 text-sm">Nenhum lote ativo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-foreground/5">
                <tr>
                  <th className="text-left p-3 text-sm">Data aporte</th>
                  <th className="text-right p-3 text-sm">Principal</th>
                  <th className="text-right p-3 text-sm">Rendimento</th>
                  <th className="text-center p-3 text-sm">Dias</th>
                  <th className="text-center p-3 text-sm">Alíquota IR</th>
                  <th className="text-right p-3 text-sm">IR estimado</th>
                </tr>
              </thead>
              <tbody>
                {account.lots.map((lot: InvestmentLotSummary, i: number) => (
                  <tr key={i} className="border-t border-black/5">
                    <td className="p-3 text-sm">
                      {new Date(lot.depositDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-3 text-sm text-right">{formatCurrency(lot.principal)}</td>
                    <td className="p-3 text-sm text-right text-green-600">{formatCurrency(lot.grossYield)}</td>
                    <td className="p-3 text-sm text-center">{lot.daysHeld}</td>
                    <td className="p-3 text-sm text-center">{(lot.irRate * 100).toFixed(1)}%</td>
                    <td className="p-3 text-sm text-right text-orange-600">{formatCurrency(lot.estimatedIr)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-black/10">
                <tr>
                  <td className="p-3 text-sm font-semibold" colSpan={2}>Total</td>
                  <td className="p-3 text-sm text-right font-semibold text-green-600">
                    {formatCurrency(account.grossYield)}
                  </td>
                  <td colSpan={2} />
                  <td className="p-3 text-sm text-right font-semibold text-orange-600">
                    {formatCurrency(account.estimatedIr)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <button onClick={onClose} className="mt-4 w-full px-4 py-3 border border-black/10 rounded-lg hover:bg-foreground/5">
          Fechar
        </button>
      </div>
    </div>
  );
}
