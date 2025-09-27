"use client";

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency, formatMonth } from '@/lib/data';

interface BarChartData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

interface BarChartProps {
  data: BarChartData[];
  title: string;
}

export function BarChart({ data, title }: BarChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-black/10 p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-foreground/60">Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{formatMonth(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-black/10 p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" />
            <XAxis 
              dataKey="month" 
              tickFormatter={(value) => formatMonth(value).split(' ')[0]}
              stroke="hsl(var(--foreground))"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              stroke="hsl(var(--foreground))"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="income" 
              fill="#10b981" 
              name="Receitas"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="expenses" 
              fill="#ef4444" 
              name="Despesas"
              radius={[2, 2, 0, 0]}
            />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}