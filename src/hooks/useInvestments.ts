"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  apiClient,
  InvestmentAccount,
  InvestmentMovement,
  PortfolioSummary,
  AccountPortfolioSummary
} from '@/lib/api';

export function useInvestments() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [accounts, setAccounts] = useState<InvestmentAccount[]>([]);
  const [movements, setMovements] = useState<InvestmentMovement[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPortfolio = useCallback(async () => {
    try {
      const data = await apiClient.getPortfolio();
      setPortfolio(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar carteira');
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      const data = await apiClient.getInvestmentAccounts();
      setAccounts(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar contas');
    }
  }, []);

  const loadMovements = useCallback(async (accountId: string) => {
    try {
      const data = await apiClient.getInvestmentMovements(accountId);
      setMovements(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar movimentações');
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadPortfolio(), loadAccounts()]);
    setLoading(false);
  }, [loadPortfolio, loadAccounts]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (selectedAccountId) {
      loadMovements(selectedAccountId);
    } else {
      setMovements([]);
    }
  }, [selectedAccountId, loadMovements]);

  const createAccount = async (data: Omit<InvestmentAccount, '_id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    setSaving(true);
    try {
      await apiClient.createInvestmentAccount(data);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const updateAccount = async (id: string, data: Partial<InvestmentAccount>) => {
    setSaving(true);
    try {
      await apiClient.updateInvestmentAccount(id, data);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async (id: string) => {
    setSaving(true);
    try {
      await apiClient.deleteInvestmentAccount(id);
      if (selectedAccountId === id) setSelectedAccountId(null);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const addMovement = async (
    accountId: string,
    data: Omit<InvestmentMovement, '_id' | 'userId' | 'accountId' | 'createdAt' | 'updatedAt'>
  ) => {
    setSaving(true);
    try {
      await apiClient.createInvestmentMovement(accountId, data);
      await refresh();
      if (selectedAccountId === accountId) {
        await loadMovements(accountId);
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteMovement = async (movementId: string) => {
    setSaving(true);
    try {
      await apiClient.deleteInvestmentMovement(movementId);
      await refresh();
      if (selectedAccountId) {
        await loadMovements(selectedAccountId);
      }
    } finally {
      setSaving(false);
    }
  };

  const syncCdi = async () => {
    setSaving(true);
    try {
      const result = await apiClient.syncCdiRates();
      await refresh();
      return result;
    } finally {
      setSaving(false);
    }
  };

  const getAccountSummary = (accountId: string): AccountPortfolioSummary | undefined => {
    const fromPortfolio = portfolio?.accounts.find(a => a.accountId === accountId);
    if (fromPortfolio) return fromPortfolio;

    const account = accounts.find(a => a._id === accountId);
    if (!account) return undefined;

    return {
      accountId: account._id,
      name: account.name,
      institution: account.institution,
      cdiPercentage: account.cdiPercentage,
      color: account.color,
      currentBalance: 0,
      principal: 0,
      grossYield: 0,
      estimatedIr: 0,
      netBalance: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      todayYield: 0,
      monthYield: 0,
      lots: []
    };
  };

  const getDisplayAccounts = (): AccountPortfolioSummary[] => {
    return accounts
      .filter(a => a.isActive)
      .map(a => getAccountSummary(a._id))
      .filter((a): a is AccountPortfolioSummary => a !== undefined);
  };

  return {
    portfolio,
    accounts,
    movements,
    selectedAccountId,
    setSelectedAccountId,
    loading,
    saving,
    error,
    refresh,
    createAccount,
    updateAccount,
    deleteAccount,
    addMovement,
    deleteMovement,
    syncCdi,
    getAccountSummary,
    getDisplayAccounts
  };
}
