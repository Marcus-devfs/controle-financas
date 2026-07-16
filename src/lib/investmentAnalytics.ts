import { AccountPortfolioSummary } from '@/lib/api';

const BUSINESS_DAYS_PER_MONTH = 21;
const BUSINESS_DAYS_PER_YEAR = 252;

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
  isCurrentMonth: boolean;
}

export interface ProjectionSummary {
  restOfMonthGross: number;
  restOfMonthNet: number;
  fullMonthGross: number;
  fullMonthNet: number;
  yearGross: number;
  yearNet: number;
  yearEndBalance: number;
  monthly: MonthProjection[];
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
 * capitalização diária em dias úteis e IR médio estimado da carteira.
 */
export function computeProjections(
  accounts: AccountPortfolioSummary[],
  metrics: InvestmentMetrics,
  monthsAhead: number = 12
): ProjectionSummary {
  const dailyRate = metrics.effectiveDailyRatePct / 100;
  const irFactor = 1 - metrics.avgIrRate;
  const balance = metrics.totalBalance;
  const remainingDays = countRemainingBusinessDays();

  // Projeção do restante do mês: rendimento já acumulado + dias úteis restantes
  const restOfMonthGross =
    dailyRate > 0 && balance > 0
      ? balance * (Math.pow(1 + dailyRate, remainingDays) - 1)
      : metrics.todayYield * remainingDays;

  const fullMonthGross = metrics.monthYield + restOfMonthGross;
  const restOfMonthNet = restOfMonthGross * irFactor;
  const fullMonthNet = metrics.monthYieldNet + restOfMonthNet;

  // Projeção anual com capitalização em ~252 dias úteis
  const yearGross =
    dailyRate > 0 && balance > 0
      ? balance * (Math.pow(1 + dailyRate, BUSINESS_DAYS_PER_YEAR) - 1)
      : fullMonthGross * 12;
  const yearNet = yearGross * irFactor;
  const yearEndBalance = balance + yearGross;

  const monthly: MonthProjection[] = [];
  const now = new Date();
  let runningBalance = balance;

  for (let i = 0; i < monthsAhead; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthKey = formatMonthKey(date);
    const isCurrent = i === 0;

    let projectedGross: number;
    if (isCurrent) {
      projectedGross = fullMonthGross;
      runningBalance = balance + restOfMonthGross;
    } else {
      const days = BUSINESS_DAYS_PER_MONTH;
      projectedGross =
        dailyRate > 0 && runningBalance > 0
          ? runningBalance * (Math.pow(1 + dailyRate, days) - 1)
          : 0;
      runningBalance += projectedGross;
    }

    monthly.push({
      month: monthKey,
      label: monthLabel(monthKey),
      projectedGross: Math.round(projectedGross * 100) / 100,
      projectedNet: Math.round(projectedGross * irFactor * 100) / 100,
      projectedBalance: Math.round(runningBalance * 100) / 100,
      isCurrentMonth: isCurrent,
    });
  }

  return {
    restOfMonthGross: Math.round(restOfMonthGross * 100) / 100,
    restOfMonthNet: Math.round(restOfMonthNet * 100) / 100,
    fullMonthGross: Math.round(fullMonthGross * 100) / 100,
    fullMonthNet: Math.round(fullMonthNet * 100) / 100,
    yearGross: Math.round(yearGross * 100) / 100,
    yearNet: Math.round(yearNet * 100) / 100,
    yearEndBalance: Math.round(yearEndBalance * 100) / 100,
    monthly,
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
