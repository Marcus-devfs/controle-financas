"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PortfolioSummary } from "@/lib/api";
import { formatCurrency } from "@/lib/data";
import { PieChart } from "@/components/PieChart";
import { formatCurrencyWhileTyping, parseCurrencyInputNew } from "@/lib/utils";
import {
  buildAllocationChartData,
  buildYieldByAccountChartData,
  computeMetrics,
  computeProjections,
  filterAccounts,
} from "@/lib/investmentAnalytics";

interface InvestmentDashboardProps {
  portfolio: PortfolioSummary;
}

const CONTRIBUTION_PRESETS = [500, 1000, 2000, 5000];

function formatPct(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`;
}

export function InvestmentDashboard({ portfolio }: InvestmentDashboardProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | "all">("all");
  const [projectionMonths, setProjectionMonths] = useState(12);
  const [contributionInput, setContributionInput] = useState("");
  const [includeCurrentMonth, setIncludeCurrentMonth] = useState(false);

  const monthlyContribution = useMemo(
    () => parseCurrencyInputNew(contributionInput) || 0,
    [contributionInput]
  );

  const filteredAccounts = useMemo(
    () => filterAccounts(portfolio.accounts, selectedAccountId),
    [portfolio.accounts, selectedAccountId]
  );

  const metrics = useMemo(
    () => computeMetrics(filteredAccounts, portfolio.currentCdiRate),
    [filteredAccounts, portfolio.currentCdiRate]
  );

  const projections = useMemo(
    () =>
      computeProjections(filteredAccounts, metrics, projectionMonths, {
        monthlyContribution,
        includeCurrentMonth,
      }),
    [filteredAccounts, metrics, projectionMonths, monthlyContribution, includeCurrentMonth]
  );

  const allocationData = useMemo(
    () => buildAllocationChartData(filteredAccounts),
    [filteredAccounts]
  );

  const yieldByAccount = useMemo(
    () => buildYieldByAccountChartData(filteredAccounts),
    [filteredAccounts]
  );

  const hasBalance = metrics.totalBalance > 0;
  const hasSimulation = monthlyContribution > 0;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/30 rounded-lg">
        <div className="flex-1">
          <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
            Conta
          </label>
          <select
            value={selectedAccountId}
            onChange={(e) =>
              setSelectedAccountId(e.target.value === "all" ? "all" : e.target.value)
            }
            className="w-full px-3 py-2 rounded-lg border border-black/10 bg-background text-foreground text-sm"
          >
            <option value="all">Todas as contas</option>
            {portfolio.accounts.map((account) => (
              <option key={account.accountId} value={account.accountId}>
                {account.name} · {account.institution}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
            Horizonte de projeção
          </label>
          <select
            value={projectionMonths}
            onChange={(e) => setProjectionMonths(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-black/10 bg-background text-foreground text-sm"
          >
            <option value={6}>6 meses</option>
            <option value={12}>12 meses</option>
            <option value={24}>24 meses</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setSelectedAccountId("all");
              setProjectionMonths(12);
              setContributionInput("");
              setIncludeCurrentMonth(false);
            }}
            className="px-3 py-2 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 rounded-lg transition-colors w-full sm:w-auto"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {/* Simulação de aportes */}
      <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Simular aportes mensais</h2>
            <p className="text-xs sm:text-sm text-foreground/60 mt-1">
              Informe quanto pretende investir por mês. A projeção e o gráfico são recalculados na hora.
            </p>
          </div>
          {hasSimulation && (
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 self-start">
              Simulação ativa
            </span>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 max-w-sm">
            <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
              Aporte mensal (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground/50">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={contributionInput}
                onChange={(e) =>
                  setContributionInput(formatCurrencyWhileTyping(e.target.value))
                }
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-black/10 bg-background text-foreground text-sm"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
              Atalhos
            </label>
            <div className="flex flex-wrap gap-2">
              {CONTRIBUTION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    setContributionInput(
                      formatCurrencyWhileTyping(String(Math.round(preset * 100)))
                    )
                  }
                  className={`px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors ${
                    monthlyContribution === preset
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-black/10 hover:bg-muted/50"
                  }`}
                >
                  {formatCurrency(preset)}
                </button>
              ))}
              {hasSimulation && (
                <button
                  type="button"
                  onClick={() => setContributionInput("")}
                  className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-black/10 hover:bg-muted/50 text-foreground/60"
                >
                  Zerar
                </button>
              )}
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeCurrentMonth}
            onChange={(e) => setIncludeCurrentMonth(e.target.checked)}
            className="rounded border-black/20"
          />
          Incluir aporte também neste mês
        </label>
      </div>

      {!hasBalance ? (
        <div className="rounded-xl border border-black/10 dark:border-white/10 p-10 text-center">
          <p className="text-foreground/60">
            Sem saldo para exibir o resumo. Importe ou registre aplicações na aba Aplicações.
          </p>
        </div>
      ) : (
        <>
          {/* Métricas de retorno % */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Métricas de rendimento</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <MetricCard
                label="Rend. bruto (mês)"
                value={formatPct(metrics.grossMonthlyReturnPct)}
                sub={formatCurrency(metrics.monthYield)}
                color="text-green-600 dark:text-green-400"
              />
              <MetricCard
                label="Rend. líquido (mês)"
                value={formatPct(metrics.netMonthlyReturnPct)}
                sub={formatCurrency(metrics.monthYieldNet)}
                color="text-emerald-600 dark:text-emerald-400"
              />
              <MetricCard
                label="Rend. bruto total"
                value={formatPct(metrics.grossTotalReturnPct)}
                sub={formatCurrency(metrics.totalGrossYield)}
                color="text-blue-600 dark:text-blue-400"
              />
              <MetricCard
                label="Rend. líquido total"
                value={formatPct(metrics.netTotalReturnPct)}
                sub={formatCurrency(metrics.totalGrossYield - metrics.totalEstimatedIr)}
                color="text-indigo-600 dark:text-indigo-400"
              />
              <MetricCard
                label="IR médio estimado"
                value={formatPct(metrics.avgIrRate * 100, 1)}
                sub="Sobre o rendimento"
                color="text-orange-600 dark:text-orange-400"
              />
              <MetricCard
                label="Taxa diária efetiva"
                value={formatPct(metrics.effectiveDailyRatePct, 4)}
                sub={`${metrics.weightedCdiPercentage.toFixed(0)}% CDI`}
                color="text-teal-600 dark:text-teal-400"
              />
            </div>
          </div>

          {/* Projeções resumo */}
          <div>
            <h2 className="text-lg font-semibold mb-3">
              Projeções{hasSimulation ? " (com aportes)" : ""}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <ProjectionCard
                title="Restante do mês"
                gross={projections.restOfMonthGross}
                net={projections.restOfMonthNet}
                hint="Dias úteis restantes"
              />
              <ProjectionCard
                title="Mês completo"
                gross={projections.fullMonthGross}
                net={projections.fullMonthNet}
                hint="Já acumulado + projeção"
              />
              <ProjectionCard
                title={`Rendimento em ${projectionMonths} meses`}
                gross={projections.yearGross}
                net={projections.yearNet}
                hint={
                  hasSimulation
                    ? `Só juros (sem contar aportes)`
                    : "Capitalização diária"
                }
              />
              <div className="rounded-xl border border-black/10 dark:border-white/10 p-4">
                <div className="text-xs text-foreground/60 mb-1">
                  Saldo bruto projetado ({projectionMonths}m)
                </div>
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(projections.yearEndBalance)}
                </div>
                <div className="text-xs text-foreground/40 mt-2">
                  Atual {formatCurrency(metrics.totalBalance)}
                  {hasSimulation && (
                    <>
                      {" · "}Aportes {formatCurrency(projections.totalContributed)}
                    </>
                  )}
                </div>
              </div>
            </div>

            {hasSimulation && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <div className="rounded-xl border border-dashed border-black/15 dark:border-white/15 p-4">
                  <div className="text-xs text-foreground/60 mb-1">Total aportado</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(projections.totalContributed)}
                  </div>
                  <div className="text-xs text-foreground/40 mt-1">
                    {formatCurrency(monthlyContribution)}/mês
                  </div>
                </div>
                <div className="rounded-xl border border-dashed border-black/15 dark:border-white/15 p-4">
                  <div className="text-xs text-foreground/60 mb-1">Saldo sem aportes</div>
                  <div className="text-lg font-semibold text-foreground/70">
                    {formatCurrency(projections.yearEndBalanceWithoutContribution)}
                  </div>
                  <div className="text-xs text-foreground/40 mt-1">Só o saldo atual rendendo</div>
                </div>
                <div className="rounded-xl border border-dashed border-emerald-300/60 dark:border-emerald-700/50 p-4 bg-emerald-50/50 dark:bg-emerald-900/10">
                  <div className="text-xs text-foreground/60 mb-1">Juros extras dos aportes</div>
                  <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(projections.extraFromContributions)}
                  </div>
                  <div className="text-xs text-foreground/40 mt-1">
                    Além do principal investido
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-foreground/40 mt-2">
              Projeções usam a taxa CDI atual e o % CDI médio da carteira filtrada. Aportes entram
              no início de cada mês e passam a render. IR líquido aplica a alíquota média estimada.
              Valores futuros são estimativas.
            </p>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PieChart
              data={allocationData}
              title="Distribuição por conta"
              total={metrics.totalBalance}
            />
            <YieldByAccountChart data={yieldByAccount} />
          </div>

          <MonthlyProjectionChart
            data={projections.monthly}
            hasSimulation={hasSimulation}
            monthlyContribution={monthlyContribution}
          />

          {/* Snapshot rápido */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SnapshotCard label="Saldo bruto" value={metrics.totalBalance} />
            <SnapshotCard label="Principal" value={metrics.totalPrincipal} />
            <SnapshotCard label="Rendimento hoje" value={metrics.todayYield} accent="green" />
            <SnapshotCard label="IR estimado" value={metrics.totalEstimatedIr} accent="orange" />
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-4">
      <div className="text-xs text-foreground/60 mb-1">{label}</div>
      <div className={`text-lg sm:text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-foreground/40 mt-1">{sub}</div>
    </div>
  );
}

function ProjectionCard({
  title,
  gross,
  net,
  hint,
}: {
  title: string;
  gross: number;
  net: number;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-4">
      <div className="text-xs text-foreground/60 mb-1">{title}</div>
      <div className="text-lg font-bold text-green-600 dark:text-green-400">
        {formatCurrency(gross)}
      </div>
      <div className="text-sm text-emerald-700/80 dark:text-emerald-400/80 mt-1">
        Líquido: {formatCurrency(net)}
      </div>
      <div className="text-xs text-foreground/40 mt-2">{hint}</div>
    </div>
  );
}

function SnapshotCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "green" | "orange";
}) {
  const color =
    accent === "green"
      ? "text-green-600 dark:text-green-400"
      : accent === "orange"
        ? "text-orange-600 dark:text-orange-400"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-4">
      <div className="text-xs text-foreground/60 mb-1">{label}</div>
      <div className={`text-base sm:text-lg font-semibold ${color}`}>
        {formatCurrency(value)}
      </div>
    </div>
  );
}

function YieldByAccountChart({
  data,
}: {
  data: ReturnType<typeof buildYieldByAccountChartData>;
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-black/10 p-6">
        <h3 className="text-lg font-semibold mb-4">Rendimento por conta</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-foreground/60">Nenhum rendimento registrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-6">
      <h3 className="text-lg font-semibold mb-4">Rendimento por conta</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
            <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={11} />
            <YAxis
              tickFormatter={(v) => `R$ ${(v / 1000).toFixed(v >= 1000 ? 1 : 0)}${v >= 1000 ? "k" : ""}`}
              stroke="hsl(var(--foreground))"
              fontSize={11}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value ?? 0))}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ""}
            />
            <Legend />
            <Bar dataKey="bruto" name="Bruto acumulado" fill="#10b981" radius={[2, 2, 0, 0]} />
            <Bar dataKey="liquido" name="Líquido estimado" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            <Bar dataKey="mes" name="No mês" fill="#14b8a6" radius={[2, 2, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MonthlyProjectionChart({
  data,
  hasSimulation,
  monthlyContribution,
}: {
  data: ReturnType<typeof computeProjections>["monthly"];
  hasSimulation: boolean;
  monthlyContribution: number;
}) {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h3 className="text-lg font-semibold">Projeção mensal de rendimentos</h3>
        {hasSimulation && (
          <p className="text-xs text-foreground/50">
            Comparando com e sem aporte de {formatCurrency(monthlyContribution)}/mês
          </p>
        )}
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
            <XAxis dataKey="label" stroke="hsl(var(--foreground))" fontSize={11} />
            <YAxis
              yAxisId="left"
              tickFormatter={(v) =>
                `R$ ${(v / 1000).toFixed(v >= 1000 ? 1 : 0)}${v >= 1000 ? "k" : ""}`
              }
              stroke="hsl(var(--foreground))"
              fontSize={11}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
              stroke="hsl(var(--foreground))"
              fontSize={11}
            />
            <Tooltip
              formatter={(value, name) => [
                formatCurrency(Number(value ?? 0)),
                String(name),
              ]}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="projectedGross"
              name="Rendimento bruto"
              fill="#10b981"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              yAxisId="left"
              dataKey="projectedNet"
              name="Rendimento líquido"
              fill="#3b82f6"
              radius={[2, 2, 0, 0]}
            />
            {hasSimulation && (
              <Bar
                yAxisId="left"
                dataKey="contribution"
                name="Aporte do mês"
                fill="#f59e0b"
                radius={[2, 2, 0, 0]}
              />
            )}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="projectedBalance"
              name={hasSimulation ? "Saldo com aportes" : "Saldo projetado"}
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
            />
            {hasSimulation && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="balanceWithoutContribution"
                name="Saldo sem aportes"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
