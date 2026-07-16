import { AccountPortfolioSummary } from '@/lib/api';

const BUSINESS_DAYS_PER_MONTH = 21;

export interface InvestmentMetrics {
  totalBalance: number;
  totalPrincipal: number;
  totalGrossYield: number;
  totalEstimatedIr: number;
  totalNetBalance: number;
  todayYield: number;
  monthYield: number;
  monthYieldNet: number;
  grossMonthlyReturnPct: number;
  netMonthlyReturnPct: number;
  grossTotalReturnPct: number;
  netTotalReturnPct: number;
  avgIrRate: number;
  weightedCdiPercentage: number;
  effectiveDailyRatePct: number;
}

export interface MonthProjection {
  month: string; // YYYY-MM
  label: string;
  projectedGross: number;
  projectedNet: number;
  projectedBalance: number;
  contribution: number;
  /** Saldo se não houver aportes mensais (para comparação no gráfico) */
  balanceWithoutContribution: number;
  /** Rendimento bruto do mês sem aportes */
  grossWithoutContribution: number;
  isCurrentMonth: boolean;
}

export interface SimulationOptions {
  monthlyContribution?: number;
  /** Se true, aplica o aporte também no mês atual */
  includeCurrentMonth?: boolean;
}

export interface ProjectionSummary {
  restOfMonthGross: number;
  restOfMonthNet: number;
  fullMonthGross: number;
  fullMonthNet: number;
  /** Rendimento bruto total no horizonte (sem contar aportes) */
  yearGross: number;
  yearNet: number;
  yearEndBalance: number;
  yearEndBalanceWithoutContribution: number;
  totalContributed: number;
  /** Quanto o saldo final ganhou além dos aportes + rendimento sem aporte */
  extraFromContributions: number;
  monthly: MonthProjection[];
  monthlyContribution: number;
}

function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

function formatMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function compoundYield(balance: number, dailyRate: number, days: number): number {
  if (dailyRate <= 0 || balance <= 0 || days <= 0) return 0;
  return balance * (Math.pow(1 + dailyRate, days) - 1);
}

/** Conta dias úteis restantes no mês (a partir de amanhã até o último dia). */
export function countRemainingBusinessDays(from: Date = new Date()): number {
  const year = from.getFullYear();
  const month = from.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  let count = 0;
  for (let d = from.getDate() + 1; d <= lastDay; d++) {
    const date = new Date(year, month, d);
    if (isBusinessDay(date)) count++;
  }
  return count;
}

export function filterAccounts(
  accounts: AccountPortfolioSummary[],
  accountId: string | 'all'
): AccountPortfolioSummary[] {
  if (accountId === 'all') return accounts;
  return accounts.filter(a => a.accountId === accountId);
}

export function computeMetrics(
  accounts: AccountPortfolioSummary[],
  currentCdiRate: number | null
): InvestmentMetrics {
  const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);
  const totalPrincipal = accounts.reduce((s, a) => s + a.principal, 0);
  const totalGrossYield = accounts.reduce((s, a) => s + a.grossYield, 0);
  const totalEstimatedIr = accounts.reduce((s, a) => s + a.estimatedIr, 0);
  const totalNetBalance = accounts.reduce((s, a) => s + a.netBalance, 0);
  const todayYield = accounts.reduce((s, a) => s + a.todayYield, 0);
  const monthYield = accounts.reduce((s, a) => s + a.monthYield, 0);

  const avgIrRate =
    totalGrossYield > 0 ? totalEstimatedIr / totalGrossYield : 0.225;

  const monthYieldNet = monthYield * (1 - avgIrRate);

  const baseForPct = totalPrincipal > 0 ? totalPrincipal : totalBalance;

  const weightedCdiPercentage =
    totalBalance > 0
      ? accounts.reduce((s, a) => s + a.cdiPercentage * a.currentBalance, 0) / totalBalance
      : accounts.length > 0
        ? accounts.reduce((s, a) => s + a.cdiPercentage, 0) / accounts.length
        : 100;

  const effectiveDailyRatePct =
    currentCdiRate !== null
      ? currentCdiRate * (weightedCdiPercentage / 100)
      : todayYield > 0 && totalBalance > 0
        ? (todayYield / totalBalance) * 100
        : 0;

  return {
    totalBalance,
    totalPrincipal,
    totalGrossYield,
    totalEstimatedIr,
    totalNetBalance,
    todayYield,
    monthYield,
    monthYieldNet,
    grossMonthlyReturnPct: baseForPct > 0 ? (monthYield / baseForPct) * 100 : 0,
    netMonthlyReturnPct: baseForPct > 0 ? (monthYieldNet / baseForPct) * 100 : 0,
    grossTotalReturnPct: baseForPct > 0 ? (totalGrossYield / baseForPct) * 100 : 0,
    netTotalReturnPct:
      baseForPct > 0 ? ((totalGrossYield - totalEstimatedIr) / baseForPct) * 100 : 0,
    avgIrRate,
    weightedCdiPercentage,
    effectiveDailyRatePct,
  };
}

/**
 * Projeta rendimentos futuros com base na taxa diária efetiva atual (CDI × % da conta),
 * capitalização diária em dias úteis, IR médio e aportes mensais opcionais.
 */
export function computeProjections(
  accounts: AccountPortfolioSummary[],
  metrics: InvestmentMetrics,
  monthsAhead: number = 12,
  simulation: SimulationOptions = {}
): ProjectionSummary {
  const monthlyContribution = Math.max(0, simulation.monthlyContribution ?? 0);
  const includeCurrentMonth = simulation.includeCurrentMonth ?? false;

  const dailyRate = metrics.effectiveDailyRatePct / 100;
  const irFactor = 1 - metrics.avgIrRate;
  const initialBalance = metrics.totalBalance;
  const remainingDays = countRemainingBusinessDays();

  const restOfMonthGross =
    compoundYield(initialBalance, dailyRate, remainingDays) ||
    metrics.todayYield * remainingDays;

  const fullMonthGrossBase = metrics.monthYield + restOfMonthGross;

  const monthly: MonthProjection[] = [];
  const now = new Date();

  let runningWith = initialBalance;
  let runningWithout = initialBalance;
  let totalContributed = 0;
  let totalYieldWith = 0;
  let totalYieldWithout = 0;

  for (let i = 0; i < monthsAhead; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthKey = formatMonthKey(date);
    const isCurrent = i === 0;
    const applyContribution =
      monthlyContribution > 0 && (isCurrent ? includeCurrentMonth : true);

    const contribution = applyContribution ? monthlyContribution : 0;

    // Aporte no início do período (rende no mês)
    if (contribution > 0) {
      runningWith += contribution;
      totalContributed += contribution;
    }

    let projectedGross: number;
    let grossWithout: number;

    if (isCurrent) {
      // Sem aporte: rendimento já acumulado + restante do mês
      // Com aporte no mês atual: rendimento do saldo atual + rendimento do aporte nos dias restantes
      const yieldOnBalance = restOfMonthGross;
      const yieldOnContribution = compoundYield(contribution, dailyRate, remainingDays);
      projectedGross = metrics.monthYield + yieldOnBalance + yieldOnContribution;
      grossWithout = fullMonthGrossBase;

      runningWith = initialBalance + contribution + yieldOnBalance + yieldOnContribution;
      runningWithout = initialBalance + yieldOnBalance;
    } else {
      projectedGross = compoundYield(runningWith, dailyRate, BUSINESS_DAYS_PER_MONTH);
      grossWithout = compoundYield(runningWithout, dailyRate, BUSINESS_DAYS_PER_MONTH);
      runningWith += projectedGross;
      runningWithout += grossWithout;
    }

    // No mês atual, projectedGross inclui o já acumulado no mês; para o total de yield
    // futuro no horizonte usamos só a parte projetada + meses seguintes
    if (isCurrent) {
      totalYieldWith += projectedGross;
      totalYieldWithout += grossWithout;
    } else {
      totalYieldWith += projectedGross;
      totalYieldWithout += grossWithout;
    }

    monthly.push({
      month: monthKey,
      label: monthLabel(monthKey),
      projectedGross: round2(projectedGross),
      projectedNet: round2(projectedGross * irFactor),
      projectedBalance: round2(runningWith),
      contribution: round2(contribution),
      balanceWithoutContribution: round2(runningWithout),
      grossWithoutContribution: round2(grossWithout),
      isCurrentMonth: isCurrent,
    });
  }

  const yearEndBalance = runningWith;
  const yearEndBalanceWithoutContribution = runningWithout;
  const yearGross = totalYieldWith;
  const yearNet = yearGross * irFactor;
  const extraFromContributions =
    yearEndBalance - yearEndBalanceWithoutContribution - totalContributed;

  // Cards de mês (restante / completo) — aporte no mês atual só entra no rendimento do aporte
  const currentContributionYield = includeCurrentMonth
    ? compoundYield(monthlyContribution, dailyRate, remainingDays)
    : 0;
  const restGross = restOfMonthGross + currentContributionYield;
  const fullGross = metrics.monthYield + restGross;

  return {
    restOfMonthGross: round2(restGross),
    restOfMonthNet: round2(restGross * irFactor),
    fullMonthGross: round2(fullGross),
    fullMonthNet: round2(fullGross * irFactor),
    yearGross: round2(yearGross),
    yearNet: round2(yearNet),
    yearEndBalance: round2(yearEndBalance),
    yearEndBalanceWithoutContribution: round2(yearEndBalanceWithoutContribution),
    totalContributed: round2(totalContributed),
    extraFromContributions: round2(Math.max(0, extraFromContributions)),
    monthly,
    monthlyContribution: round2(monthlyContribution),
  };
}

export function buildAllocationChartData(accounts: AccountPortfolioSummary[]) {
  return accounts
    .filter(a => a.currentBalance > 0)
    .map(a => ({
      name: a.name,
      value: a.currentBalance,
      color: a.color || '#3b82f6',
    }));
}

export function buildYieldByAccountChartData(accounts: AccountPortfolioSummary[]) {
  return accounts
    .filter(a => a.grossYield > 0 || a.monthYield > 0)
    .map(a => ({
      name: a.name.length > 14 ? a.name.slice(0, 12) + '…' : a.name,
      fullName: a.name,
      bruto: Math.round(a.grossYield * 100) / 100,
      liquido: Math.round((a.grossYield - a.estimatedIr) * 100) / 100,
      mes: Math.round(a.monthYield * 100) / 100,
      color: a.color,
    }));
}
