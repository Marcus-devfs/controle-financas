export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'investment';
  color: string;
}

export interface CreditCard {
  id: string;
  name: string;
  lastFourDigits: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'elo' | 'other';
  limit: number;
  closingDay: number; // dia do fechamento (1-31)
  dueDay: number; // dia do vencimento (1-31)
  color: string;
  isActive: boolean;
}

export interface CreditCardBill {
  id: string;
  cardId: string;
  month: string; // formato YYYY-MM
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  transactions: string[]; // IDs das transações
}

export interface RecurringRule {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // a cada X dias/semanas/meses/anos
  dayOfMonth?: number; // para recorrência mensal (1-31)
  dayOfWeek?: number; // para recorrência semanal (0-6, domingo=0)
  endDate?: string; // data de fim da recorrência
  maxOccurrences?: number; // número máximo de ocorrências
}

export interface Transaction {
  id: string;
  categoryId: string;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense' | 'investment';
  isPaid: boolean;
  isFixed: boolean; // true para receitas/despesas fixas
  isRecurring: boolean; // true para transações recorrentes
  recurringRule?: RecurringRule;
  dayOfMonth?: number; // para despesas fixas mensais
  creditCardId?: string; // se foi pago com cartão
  installmentInfo?: {
    totalInstallments: number;
    currentInstallment: number;
    installmentAmount: number;
  };
  month: string; // formato YYYY-MM
}

export interface MonthlyData {
  month: string; // formato YYYY-MM
  fixedIncome: Transaction[];
  variableIncome: Transaction[];
  fixedExpenses: Transaction[];
  variableExpenses: Transaction[];
  investments: Transaction[];
  categories: Category[];
  creditCards: CreditCard[];
  creditCardBills: CreditCardBill[];
}

export interface UserData {
  userId: string;
  currentMonth: string; // mês atual sendo visualizado
  monthlyData: MonthlyData[];
}

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  totalInvestments: number;
  balance: number;
  fixedIncome: number;
  variableIncome: number;
  fixedExpenses: number;
  variableExpenses: number;
  creditCardDebt: number;
  availableCredit: number;
}
