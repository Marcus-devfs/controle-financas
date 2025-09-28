import { Transaction, Category, DashboardStats } from './types';

export interface AIAnalysis {
  summary: string;
  insights: string[];
  suggestions: AISuggestion[];
  riskLevel: 'low' | 'medium' | 'high';
  score: number; // 0-100
}

export interface AISuggestion {
  type: 'expense_reduction' | 'income_increase' | 'investment_optimization' | 'budget_adjustment';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  category?: string;
  estimatedSavings?: number;
  priority: number; // 1-5
}

export interface FinancialData {
  transactions: Transaction[];
  categories: Category[];
  stats: DashboardStats;
  currentMonth: string;
  previousMonth?: string;
}

class AIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  }

  async analyzeFinancialData(data: FinancialData): Promise<AIAnalysis> {
    try {
      // Se não tiver API key, usar análise local
      if (!this.apiKey) {
        console.log('🔧 Usando análise local (sem API key)');
        return this.getLocalAnalysis(data);
      }

      console.log('🔑 API Key configurada, usando Gemini API via proxy');
      
      const prompt = this.buildAnalysisPrompt(data);
      console.log('📝 Prompt gerado:', prompt.substring(0, 200) + '...');
      
      const response = await this.callGeminiAPI(prompt);
      console.log('🤖 Resposta da IA recebida:', response.substring(0, 200) + '...');
      
      return this.parseAIResponse(response, data);
    } catch (error) {
      console.error('❌ Erro na análise de IA:', error);
      console.log('🔄 Usando análise local como fallback');
      // Fallback para análise local
      return this.getLocalAnalysis(data);
    }
  }

  private buildAnalysisPrompt(data: FinancialData): string {
    const { transactions, categories, stats, currentMonth } = data;
    
    // Preparar dados para análise
    const monthlyIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const categoryExpenses = categories
      .filter(c => c.type === 'expense')
      .map(category => {
        const total = transactions
          .filter(t => t.type === 'expense' && t.categoryId === category.id)
          .reduce((sum, t) => sum + t.amount, 0);
        return { name: category.name, amount: total };
      })
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    const prompt = `Analise financeira:
Receita: R$ ${monthlyIncome.toFixed(2)} | Despesas: R$ ${monthlyExpenses.toFixed(2)} | Saldo: R$ ${(monthlyIncome - monthlyExpenses).toFixed(2)}
Margem: ${((monthlyIncome - monthlyExpenses) / monthlyIncome * 100).toFixed(1)}%

Top gastos: ${categoryExpenses.slice(0, 3).map(c => `${c.name} R$ ${c.amount.toFixed(0)}`).join(', ')}

Responda em JSON:
{
  "summary": "Resumo em 1-2 frases",
  "insights": ["insight 1", "insight 2"],
  "suggestions": [
    {
      "type": "expense_reduction",
      "title": "Sugestão",
      "description": "Descrição",
      "impact": "high",
      "estimatedSavings": 500,
      "priority": 1
    }
  ],
  "riskLevel": "medium",
  "score": 75
}`;

    return prompt;
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    // Usar a API route do Next.js para evitar problemas de CORS
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${response.status} - ${errorData.error}`);
    }

    const data = await response.json();
    return data.text;
  }

  private parseAIResponse(response: string, data: FinancialData): AIAnalysis {
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || 'Análise concluída',
          insights: parsed.insights || [],
          suggestions: parsed.suggestions || [],
          riskLevel: parsed.riskLevel || 'medium',
          score: parsed.score || 50
        };
      }
    } catch (error) {
      console.error('Erro ao parsear resposta da IA:', error);
    }

    // Fallback se não conseguir parsear
    return this.getLocalAnalysis(data);
  }

  private getLocalAnalysis(data: FinancialData): AIAnalysis {
    const { transactions, categories, stats } = data;
    
    const monthlyIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = monthlyIncome - monthlyExpenses;
    const margin = monthlyIncome > 0 ? (balance / monthlyIncome) * 100 : 0;

    // Análise local baseada em regras
    const insights: string[] = [];
    const suggestions: AISuggestion[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let score = 50;

    // Análise de margem
    if (margin < 0) {
      insights.push('Suas despesas estão superando suas receitas este mês');
      riskLevel = 'high';
      score = 20;
    } else if (margin < 10) {
      insights.push('Sua margem de segurança está muito baixa');
      riskLevel = 'high';
      score = 30;
    } else if (margin < 20) {
      insights.push('Sua margem de segurança está baixa');
      riskLevel = 'medium';
      score = 50;
    } else {
      insights.push('Sua margem de segurança está saudável');
      riskLevel = 'low';
      score = 80;
    }

    // Análise de categorias
    const categoryExpenses = categories
      .filter(c => c.type === 'expense')
      .map(category => {
        const total = transactions
          .filter(t => t.type === 'expense' && t.categoryId === category.id)
          .reduce((sum, t) => sum + t.amount, 0);
        return { name: category.name, amount: total, id: category.id };
      })
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    if (categoryExpenses.length > 0) {
      const topCategory = categoryExpenses[0];
      insights.push(`${topCategory.name} é sua maior categoria de gastos (R$ ${topCategory.amount.toFixed(2)})`);
      
      if (topCategory.amount > monthlyIncome * 0.3) {
        suggestions.push({
          type: 'expense_reduction',
          title: `Reduzir gastos em ${topCategory.name}`,
          description: `Esta categoria representa mais de 30% da sua receita. Considere reduzir em 20-30%.`,
          impact: 'high',
          category: topCategory.name,
          estimatedSavings: topCategory.amount * 0.25,
          priority: 1
        });
      }
    }

    // Sugestões baseadas em margem
    if (margin < 20) {
      suggestions.push({
        type: 'expense_reduction',
        title: 'Criar orçamento mensal',
        description: 'Defina limites para cada categoria de gastos para melhor controle.',
        impact: 'high',
        estimatedSavings: monthlyExpenses * 0.15,
        priority: 2
      });

      suggestions.push({
        type: 'income_increase',
        title: 'Buscar fontes de renda extras',
        description: 'Considere freelances, vendas online ou outras atividades para aumentar a receita.',
        impact: 'medium',
        estimatedSavings: monthlyIncome * 0.2,
        priority: 3
      });
    }

    // Sugestão de investimento se margem boa
    if (margin > 20) {
      suggestions.push({
        type: 'investment_optimization',
        title: 'Aumentar investimentos',
        description: 'Com boa margem, considere investir mais para o futuro.',
        impact: 'medium',
        estimatedSavings: balance * 0.5,
        priority: 4
      });
    }

    return {
      summary: `Receita: R$ ${monthlyIncome.toFixed(2)} | Despesas: R$ ${monthlyExpenses.toFixed(2)} | Saldo: R$ ${balance.toFixed(2)}`,
      insights,
      suggestions: suggestions.slice(0, 5), // Máximo 5 sugestões
      riskLevel,
      score
    };
  }

  // Método para obter sugestões rápidas
  async getQuickSuggestions(data: FinancialData): Promise<AISuggestion[]> {
    const analysis = await this.analyzeFinancialData(data);
    return analysis.suggestions.slice(0, 3); // Top 3 sugestões
  }
}

export const aiService = new AIService();
