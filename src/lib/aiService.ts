import { Transaction, Category, DashboardStats } from './types';

export interface AIAnalysis {
  summary: string;
  insights: string[];
  suggestions: AISuggestion[];
  budgetAnalysis?: BudgetAnalysis;
  riskLevel: 'low' | 'medium' | 'high';
  score: number; // 0-100
  recommendations?: string[];
}

export interface AISuggestion {
  type: 'expense_reduction' | 'income_increase' | 'investment_optimization' | 'budget_adjustment';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  category?: string;
  estimatedSavings?: number;
  priority: number; // 1-5
  timeline?: string;
}

export interface BudgetAnalysis {
  currentNeeds: string; // percentage as string
  currentWants: string; // percentage as string
  idealNeeds: number;
  idealWants: number;
  idealSavings: number;
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

    const balance = monthlyIncome - monthlyExpenses;
    const margin = monthlyIncome > 0 ? (balance / monthlyIncome) * 100 : 0;

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

    // Calcular necessidades vs desejos
    const needsCategories = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Contas', 'Aluguel', 'Supermercado', 'Combustível', 'Farmácia'];
    const wantsCategories = ['Lazer', 'Roupas', 'Entretenimento', 'Viagem', 'Shopping', 'Restaurante'];

    const currentNeeds = categoryExpenses
      .filter(c => needsCategories.some(need => c.name.toLowerCase().includes(need.toLowerCase())))
      .reduce((sum, c) => sum + c.amount, 0);

    const currentWants = categoryExpenses
      .filter(c => wantsCategories.some(want => c.name.toLowerCase().includes(want.toLowerCase())))
      .reduce((sum, c) => sum + c.amount, 0);

    const needsPercentage = monthlyIncome > 0 ? (currentNeeds / monthlyIncome) * 100 : 0;
    const wantsPercentage = monthlyIncome > 0 ? (currentWants / monthlyIncome) * 100 : 0;

    const prompt = `Analise estes dados financeiros e retorne APENAS um JSON válido:

DADOS:
- Receita: R$ ${monthlyIncome.toFixed(2)}
- Despesas: R$ ${monthlyExpenses.toFixed(2)}
- Saldo: R$ ${balance.toFixed(2)}
- Margem: ${margin.toFixed(1)}%
- Necessidades: ${needsPercentage.toFixed(1)}%
- Desejos: ${wantsPercentage.toFixed(1)}%

TOP GASTOS:
${categoryExpenses.slice(0, 10).map(c => `${c.name}: R$ ${c.amount.toFixed(2)}`).join(', ')}

ANÁLISE SOLICITADA:
1. **Diagnóstico da situação atual** - Compare com padrões saudáveis de orçamento
2. **Identificação de problemas** - Onde estão os maiores riscos financeiros
3. **Estratégias específicas** - Planos de ação concretos para cada categoria
4. **Meta de margem ideal** - Qual deveria ser a margem de segurança ideal
5. **Cronograma de implementação** - Como implementar as mudanças

PADRÕES DE ORÇAMENTO SAUDÁVEL:
- Necessidades (50-60%): Moradia, alimentação, transporte, saúde
- Desejos (20-30%): Lazer, roupas, entretenimento
- Poupança/Investimentos (20%): Reserva de emergência, investimentos
- Margem de segurança: Mínimo 10%, ideal 15-20%
JSON OBRIGATÓRIO (sem texto extra):
{
  "summary": "Resumo em 2 frases da situação financeira",
  "insights": [
    "Problema principal identificado",
    "Comparação com padrões saudáveis",
    "Risco mais crítico"
     "Identificação do principal problema"
    "Sugestões de melhoria""
  ],
  "suggestions": [
    {
      "type": "expense_reduction",
      "title": "Título curto da sugestão",
      "description": "Descrição concisa com estratégia",
      "impact": "high",
      "category": "Categoria",
      "estimatedSavings": 500,
      "priority": 1,
      "timeline": "1-2 meses"
    }
  ],
  "budgetAnalysis": {
    "currentNeeds": "${needsPercentage.toFixed(1)}",
    "currentWants": "${wantsPercentage.toFixed(1)}",
    "idealNeeds": 55,
    "idealWants": 25,
    "idealSavings": 20
  },
  "riskLevel": "high",
  "score": 30,
  "recommendations": [
    "Ação imediata 1",
    "Ação imediata 2",
    "Ação imediata 3",
    "Ação imediata 4",
  ]
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
      console.log('🔍 Tentando parsear resposta da IA:', response.substring(0, 300) + '...');

      // Limpar a resposta removendo markdown e texto extra
      let cleanResponse = response.trim();

      // Remover markdown code blocks se existirem
      cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');

      // Tentar extrair JSON da resposta
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonString = jsonMatch[0];
        console.log('📋 JSON extraído (primeiros 200 chars):', jsonString.substring(0, 200) + '...');

        // Verificar se o JSON está incompleto (cortado)
        const isIncomplete = this.isJSONIncomplete(jsonString);
        if (isIncomplete) {
          console.warn('⚠️ JSON parece estar incompleto, tentando reparar...');
          jsonString = this.repairIncompleteJSON(jsonString);
        }

        const parsed = JSON.parse(jsonString);

        // Validar e limpar os dados
        const analysis: AIAnalysis = {
          summary: parsed.summary || 'Análise concluída com sucesso',
          insights: Array.isArray(parsed.insights) ? parsed.insights : [],
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.map((s: any) => ({
            type: s.type || 'expense_reduction',
            title: s.title || 'Sugestão',
            description: s.description || 'Descrição não disponível',
            impact: s.impact || 'medium',
            category: s.category,
            estimatedSavings: s.estimatedSavings || 0,
            priority: s.priority || 1,
            timeline: s.timeline
          })) : [],
          budgetAnalysis: parsed.budgetAnalysis ? {
            currentNeeds: parsed.budgetAnalysis.currentNeeds || '0',
            currentWants: parsed.budgetAnalysis.currentWants || '0',
            idealNeeds: parsed.budgetAnalysis.idealNeeds || 55,
            idealWants: parsed.budgetAnalysis.idealWants || 25,
            idealSavings: parsed.budgetAnalysis.idealSavings || 20
          } : undefined,
          riskLevel: ['low', 'medium', 'high'].includes(parsed.riskLevel) ? parsed.riskLevel : 'medium',
          score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 50,
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
        };

        console.log('✅ Análise parseada com sucesso');
        return analysis;
      } else {
        console.warn('⚠️ Nenhum JSON encontrado na resposta');
      }
    } catch (error) {
      console.error('❌ Erro ao parsear resposta da IA:', error);
      console.log('📝 Resposta original:', response);
    }

    // Fallback se não conseguir parsear
    console.log('🔄 Usando análise local como fallback');
    return this.getLocalAnalysis(data);
  }

  private isJSONIncomplete(jsonString: string): boolean {
    // Verificar se o JSON está incompleto
    const openBraces = (jsonString.match(/\{/g) || []).length;
    const closeBraces = (jsonString.match(/\}/g) || []).length;
    const openBrackets = (jsonString.match(/\[/g) || []).length;
    const closeBrackets = (jsonString.match(/\]/g) || []).length;

    return openBraces !== closeBraces || openBrackets !== closeBrackets;
  }

  private repairIncompleteJSON(jsonString: string): string {
    try {
      // Tentar reparar JSON incompleto
      let repaired = jsonString;

      // Remover vírgulas finais antes de fechar arrays/objetos
      repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

      // Se terminar com vírgula, remover
      repaired = repaired.replace(/,\s*$/, '');

      // Se terminar com string incompleta, fechar
      if (repaired.match(/"[^"]*$/)) {
        repaired = repaired.replace(/"[^"]*$/, '""');
      }

      // Fechar arrays abertos
      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/\]/g) || []).length;
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        repaired += ']';
      }

      // Fechar objetos abertos
      const openBraces = (repaired.match(/\{/g) || []).length;
      const closeBraces = (repaired.match(/\}/g) || []).length;
      for (let i = 0; i < openBraces - closeBraces; i++) {
        repaired += '}';
      }

      console.log('🔧 JSON reparado:', repaired.substring(0, 200) + '...');
      return repaired;
    } catch (error) {
      console.error('❌ Erro ao reparar JSON:', error);
      return jsonString;
    }
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
