import { Transaction, Category, DashboardStats } from './types';
import { apiClient } from './api';

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
  type: string;
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

export interface CategoryGoal {
  categoryId: string;
  categoryName: string;
  categoryType: 'income' | 'expense' | 'investment';
  currentAverage: number; // média dos últimos 3 meses
  recommendedGoal: number; // meta recomendada
  percentageOfIncome: number; // porcentagem da receita média
  idealPercentage: number; // porcentagem ideal segundo padrões financeiros
  difference: number; // diferença entre atual e meta
  priority: 'low' | 'medium' | 'high';
  reasoning: string; // explicação da meta
  paymentMethod?: 'card' | 'cash' | 'both'; // método de pagamento predominante
}

export interface BudgetGoalsAnalysis {
  summary: string;
  averageMonthlyIncome: number;
  averageMonthlyExpenses: number;
  categoryGoals: CategoryGoal[];
  overallRecommendations: string[];
  idealBudgetBreakdown: {
    needs: number; // porcentagem
    wants: number; // porcentagem
    savings: number; // porcentagem
  };
  generatedAt: string;
}

export interface FinancialData {
  transactions: Transaction[];
  categories: Category[];
  stats: DashboardStats;
  currentMonth: string;
  previousMonth?: string;
}

export interface MultiMonthFinancialData {
  months: {
    month: string;
    transactions: Transaction[];
    stats: DashboardStats;
  }[];
  categories: Category[];
  averageIncome: number;
  averageExpenses: number;
}

class AIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  }

  async analyzeFinancialData(data: FinancialData): Promise<AIAnalysis> {
    try {
      // Primeiro, verificar se já existe uma análise salva para este mês
      try {
        const existingAnalysis = await apiClient.getAIAnalysis(data.currentMonth);
        console.log('📋 Análise existente encontrada para o mês:', data.currentMonth);
        return existingAnalysis.analysis as AIAnalysis;
      } catch {
        console.log('📝 Nenhuma análise existente encontrada, gerando nova...');
      }

      // Se não tiver API key, usar análise local
      if (!this.apiKey) {
        console.log('🔧 Usando análise local (sem API key)');
        const localAnalysis = this.getLocalAnalysis(data);
        // Salvar análise local no banco
        await this.saveAnalysisToDatabase(data.currentMonth, localAnalysis);
        return localAnalysis;
      }

      console.log('🔑 API Key configurada, usando Gemini API via proxy');

      const prompt = this.buildAnalysisPrompt(data);
      console.log('📝 Prompt gerado:', prompt.substring(0, 200) + '...');

      const response = await this.callGeminiAPI(prompt);
      console.log('🤖 Resposta da IA recebida:', response.substring(0, 200) + '...');

      const analysis = this.parseAIResponse(response, data);
      
      // Salvar análise no banco de dados
      await this.saveAnalysisToDatabase(data.currentMonth, analysis);
      
      return analysis;
    } catch (error) {
      console.error('❌ Erro na análise de IA:', error);
      console.log('🔄 Usando análise local como fallback');
      // Fallback para análise local
      const localAnalysis = this.getLocalAnalysis(data);
      // Tentar salvar análise local no banco
      try {
        await this.saveAnalysisToDatabase(data.currentMonth, localAnalysis);
      } catch (saveError) {
        console.error('❌ Erro ao salvar análise local:', saveError);
      }
      return localAnalysis;
    }
  }

  private buildAnalysisPrompt(data: FinancialData): string {
    const { transactions, categories } = data;

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
          .filter(t => {
            const categoryId = typeof t.categoryId === 'object' ? (t.categoryId as any)._id : t.categoryId;
            return t.type === 'expense' && categoryId === category.id;
          })
          .reduce((sum, t) => sum + t.amount, 0);
        return { name: category.name, amount: total };
      })
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    // Buscar todas as categorias de receitas também
    const categoryIncome = categories
      .filter(cat => cat.type === 'income')
      .map(category => {
        const total = transactions
          .filter(t => {
            const categoryId = typeof t.categoryId === 'object' ? (t.categoryId as any)._id : t.categoryId;
            return t.type === 'income' && categoryId === category.id;
          })
          .reduce((sum, t) => sum + t.amount, 0);
        return { name: category.name, amount: total };
      })
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    const prompt = `Analise estes dados financeiros e retorne APENAS um JSON válido:

DADOS:
- Receita Total: R$ ${monthlyIncome.toFixed(2)}
- Despesas Total: R$ ${monthlyExpenses.toFixed(2)}
- Saldo: R$ ${balance.toFixed(2)}
- Margem: ${margin.toFixed(1)}%

CATEGORIAS DE RECEITAS:
${categoryIncome.length > 0 ? categoryIncome.map(c => `${c.name}: R$ ${c.amount.toFixed(2)}`).join(', ') : 'Nenhuma receita categorizada'}

CATEGORIAS DE DESPESAS:
${categoryExpenses.length > 0 ? categoryExpenses.map(c => `${c.name}: R$ ${c.amount.toFixed(2)}`).join(', ') : 'Nenhuma despesa categorizada'}

ANÁLISE SOLICITADA:
1. **Diagnóstico da situação atual** - Compare com padrões saudáveis de orçamento
2. **Identificação de problemas** - Onde estão os maiores riscos financeiros
3. **Estratégias específicas** - Planos de ação concretos para cada categoria
4. **Meta de margem ideal** - Qual deveria ser a margem de segurança ideal
5. **Cronograma de implementação** - Como implementar as mudanças

INSTRUÇÕES PARA ANÁLISE:
- Analise as categorias de despesas e identifique quais são ESSENCIAIS (necessidades básicas) vs DESEJOS (luxos/opcionais)
- Compare os gastos por categoria com padrões saudáveis de orçamento
- Identifique categorias com gastos excessivos ou desproporcionais
- Sugira estratégias específicas para cada categoria problemática
- Considere a margem de segurança ideal (mínimo 10%, ideal 15-20%)
JSON OBRIGATÓRIO (sem texto extra):
{
  "summary": "Resumo em 2 frases da situação financeira",
  "insights": [
    "Problema principal identificado",
    "Comparação com padrões saudáveis",
    "Risco mais crítico",
    "Identificação do principal problema",
    "Sugestões de melhoria"
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
  "riskLevel": "high",
  "score": 30,
  "recommendations": [
    "Ação imediata 1",
    "Ação imediata 2",
    "Ação imediata 3"
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

      // Se terminar com string incompleta, fechar adequadamente
      if (repaired.match(/"[^"]*$/)) {
        // Se a string está incompleta, completar com texto genérico
        repaired = repaired.replace(/"[^"]*$/, '"Análise incompleta"');
      }
      
      // Se terminar com string que não foi fechada, fechar
      if (repaired.match(/"[^"]*$/)) {
        repaired += '"';
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

      // Verificar se ainda há strings não terminadas no final
      if (repaired.match(/"[^"]*$/)) {
        repaired = repaired.replace(/"[^"]*$/, '"Análise cortada"');
      }

      console.log('🔧 JSON reparado:', repaired.substring(0, 200) + '...');
      return repaired;
    } catch (error) {
      console.error('❌ Erro ao reparar JSON:', error);
      return jsonString;
    }
  }

  private getLocalAnalysis(data: FinancialData): AIAnalysis {
    const { transactions, categories } = data;

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
          .filter(t => {
            const categoryId = typeof t.categoryId === 'object' ? (t.categoryId as any)._id : t.categoryId;
            return t.type === 'expense' && categoryId === category.id;
          })
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

  // Método para salvar análise no banco de dados
  private async saveAnalysisToDatabase(month: string, analysis: AIAnalysis): Promise<void> {
    try {
      await apiClient.saveAIAnalysis(month, analysis);
      console.log('💾 Análise salva no banco de dados para o mês:', month);
    } catch (error) {
      console.error('❌ Erro ao salvar análise no banco:', error);
      // Não re-lançar o erro para não quebrar o fluxo principal
    }
  }

  // Método para verificar se existe análise para um mês
  async hasAnalysisForMonth(month: string): Promise<boolean> {
    try {
      await apiClient.getAIAnalysis(month);
      return true;
    } catch {
      return false;
    }
  }

  // Método para deletar análise de um mês
  async deleteAnalysisForMonth(month: string): Promise<void> {
    try {
      await apiClient.deleteAIAnalysis(month);
      console.log('🗑️ Análise deletada para o mês:', month);
    } catch (error) {
      console.error('❌ Erro ao deletar análise:', error);
      throw error;
    }
  }

  // Método para gerar metas de orçamento baseado nos últimos 3 meses
  async generateBudgetGoals(data: MultiMonthFinancialData): Promise<BudgetGoalsAnalysis> {
    try {
      // Verificar se já existe análise de metas salva
      try {
        const existingGoals = await apiClient.getBudgetGoals();
        console.log('📋 Metas existentes encontradas');
        return existingGoals.goals as BudgetGoalsAnalysis;
      } catch {
        console.log('📝 Nenhuma meta existente encontrada, gerando novas...');
      }

      // Se não tiver API key, usar análise local
      if (!this.apiKey) {
        console.log('🔧 Usando análise local de metas (sem API key)');
        const localGoals = this.getLocalBudgetGoals(data);
        await this.saveBudgetGoalsToDatabase(localGoals);
        return localGoals;
      }

      console.log('🔑 API Key configurada, usando Gemini API para gerar metas');

      const prompt = this.buildBudgetGoalsPrompt(data);
      console.log('📝 Prompt de metas gerado:', prompt.substring(0, 200) + '...');

      const response = await this.callGeminiAPI(prompt);
      console.log('🤖 Resposta da IA recebida:', response.substring(0, 200) + '...');

      const goals = this.parseBudgetGoalsResponse(response, data);
      
      // Salvar metas no banco de dados
      await this.saveBudgetGoalsToDatabase(goals);
      
      return goals;
    } catch (error) {
      console.error('❌ Erro ao gerar metas de orçamento:', error);
      console.log('🔄 Usando análise local como fallback');
      const localGoals = this.getLocalBudgetGoals(data);
      try {
        await this.saveBudgetGoalsToDatabase(localGoals);
      } catch (saveError) {
        console.error('❌ Erro ao salvar metas locais:', saveError);
      }
      return localGoals;
    }
  }

  private buildBudgetGoalsPrompt(data: MultiMonthFinancialData): string {
    const { months, categories, averageIncome, averageExpenses } = data;

    // Preparar dados por categoria para os últimos 3 meses
    const categoryData: Record<string, {
      name: string;
      type: 'income' | 'expense' | 'investment';
      monthlyTotals: number[];
      average: number;
      paymentMethods: { card: number; cash: number };
    }> = {};

    categories.forEach(category => {
      categoryData[category.id] = {
        name: category.name,
        type: category.type,
        monthlyTotals: [],
        average: 0,
        paymentMethods: { card: 0, cash: 0 }
      };
    });

    // Calcular totais por categoria para cada mês
    months.forEach((monthData, index) => {
      const categoryTotals: Record<string, number> = {};
      const categoryPaymentMethods: Record<string, { card: number; cash: number }> = {};

      monthData.transactions.forEach(transaction => {
        const categoryId = typeof transaction.categoryId === 'object' 
          ? (transaction.categoryId as any)._id 
          : transaction.categoryId;
        
        if (!categoryTotals[categoryId]) {
          categoryTotals[categoryId] = 0;
          categoryPaymentMethods[categoryId] = { card: 0, cash: 0 };
        }

        categoryTotals[categoryId] += transaction.amount;
        
        // Contar método de pagamento
        if (transaction.creditCardId) {
          categoryPaymentMethods[categoryId].card += transaction.amount;
        } else {
          categoryPaymentMethods[categoryId].cash += transaction.amount;
        }
      });

      // Adicionar totais ao histórico da categoria
      Object.keys(categoryData).forEach(catId => {
        const total = categoryTotals[catId] || 0;
        categoryData[catId].monthlyTotals.push(total);
        if (categoryPaymentMethods[catId]) {
          categoryData[catId].paymentMethods.card += categoryPaymentMethods[catId].card;
          categoryData[catId].paymentMethods.cash += categoryPaymentMethods[catId].cash;
        }
      });
    });

    // Calcular médias
    Object.keys(categoryData).forEach(catId => {
      const totals = categoryData[catId].monthlyTotals;
      categoryData[catId].average = totals.length > 0 
        ? totals.reduce((sum, val) => sum + val, 0) / totals.length 
        : 0;
    });

    // Preparar string de dados por categoria
    const expenseCategories = Object.values(categoryData)
      .filter(cat => cat.type === 'expense' && cat.average > 0)
      .map(cat => {
        const paymentMethod = cat.paymentMethods.card > cat.paymentMethods.cash ? 'cartão' : 'dinheiro';
        return `${cat.name}: R$ ${cat.average.toFixed(2)}/mês (${paymentMethod})`;
      })
      .join(', ');

    const incomeCategories = Object.values(categoryData)
      .filter(cat => cat.type === 'income' && cat.average > 0)
      .map(cat => `${cat.name}: R$ ${cat.average.toFixed(2)}/mês`)
      .join(', ');

    // Preparar lista de categorias com IDs para o prompt (limitado a 20 para evitar prompt muito longo)
    const categoryList = Object.entries(categoryData)
      .filter(([_, cat]) => cat.average > 0)
      .sort(([_, a], [__, b]) => b.average - a.average) // Ordenar por maior gasto primeiro
      .slice(0, 20) // Limitar a 20 categorias
      .map(([id, cat]) => {
        const paymentMethod = cat.paymentMethods.card > cat.paymentMethods.cash ? 'card' : cat.paymentMethods.cash > 0 ? 'cash' : 'both';
        return {
          id,
          name: cat.name,
          type: cat.type,
          average: cat.average,
          paymentMethod,
          pct: averageIncome > 0 ? ((cat.average / averageIncome) * 100).toFixed(1) : '0'
        };
      });

    const prompt = `Crie metas financeiras realistas. Receita: R$ ${averageIncome.toFixed(2)}/mês. Despesa: R$ ${averageExpenses.toFixed(2)}/mês.

Categorias (${categoryList.length}):
${categoryList.map(c => `${c.name}(${c.type}): R$ ${c.average.toFixed(2)} (${c.pct}%) [ID:${c.id}]`).join('; ')}

Padrões ideais: Moradia 30%, Alimentação 15%, Transporte 12%, Saúde 8%, Contas 5%, Lazer 8%, Outros 8%.

Para cada categoria de DESPESA:
- Se gasto > ideal*1.2: meta = ideal (reduzir)
- Se gasto < ideal*1.1: meta = min(atual*1.05, ideal*1.1) (pode aumentar um pouco)
- Senão: meta = atual*0.9 (reduzir 10%)
- Prioridade: high se > ideal*1.5, medium se > ideal*1.2, low senão

Para RECEITAS: meta = atual*1.1 (aumentar 10%)

Retorne JSON válido (sem markdown):
{
  "summary": "Resumo em 2 frases",
  "averageMonthlyIncome": ${averageIncome},
  "averageMonthlyExpenses": ${averageExpenses},
  "categoryGoals": [${categoryList.map(c => `{"categoryId":"${c.id}","categoryName":"${c.name}","categoryType":"${c.type}","currentAverage":${c.average},"recommendedGoal":CALCULE,"percentageOfIncome":${c.pct},"idealPercentage":DEFINA,"difference":CALCULE,"priority":"DEFINA","reasoning":"Explicação curta","paymentMethod":"${c.paymentMethod}"}`).join(',')}],
  "overallRecommendations": ["Rec 1", "Rec 2"],
  "idealBudgetBreakdown": {"needs":55,"wants":25,"savings":20}
}`;

    return prompt;
  }

  private parseBudgetGoalsResponse(response: string, data: MultiMonthFinancialData): BudgetGoalsAnalysis {
    try {
      console.log('🔍 Tentando parsear resposta de metas da IA:', response.substring(0, 300) + '...');

      let cleanResponse = response.trim();
      cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');

      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonString = jsonMatch[0];

        const isIncomplete = this.isJSONIncomplete(jsonString);
        if (isIncomplete) {
          console.warn('⚠️ JSON parece estar incompleto, tentando reparar...');
          jsonString = this.repairIncompleteJSON(jsonString);
        }

        const parsed = JSON.parse(jsonString);

        const goals: BudgetGoalsAnalysis = {
          summary: parsed.summary || 'Metas de orçamento geradas com sucesso',
          averageMonthlyIncome: typeof parsed.averageMonthlyIncome === 'number' ? parsed.averageMonthlyIncome : data.averageIncome,
          averageMonthlyExpenses: typeof parsed.averageMonthlyExpenses === 'number' ? parsed.averageMonthlyExpenses : data.averageExpenses,
          categoryGoals: Array.isArray(parsed.categoryGoals) ? parsed.categoryGoals.map((g: any) => ({
            categoryId: g.categoryId || '',
            categoryName: g.categoryName || 'Categoria',
            categoryType: ['income', 'expense', 'investment'].includes(g.categoryType) ? g.categoryType : 'expense',
            currentAverage: typeof g.currentAverage === 'number' ? g.currentAverage : 0,
            recommendedGoal: typeof g.recommendedGoal === 'number' ? g.recommendedGoal : 0,
            percentageOfIncome: typeof g.percentageOfIncome === 'number' ? g.percentageOfIncome : 0,
            idealPercentage: typeof g.idealPercentage === 'number' ? g.idealPercentage : 0,
            difference: typeof g.difference === 'number' ? g.difference : 0,
            priority: ['low', 'medium', 'high'].includes(g.priority) ? g.priority : 'medium',
            reasoning: g.reasoning || 'Meta baseada em padrões financeiros saudáveis',
            paymentMethod: g.paymentMethod || undefined
          })) : [],
          overallRecommendations: Array.isArray(parsed.overallRecommendations) ? parsed.overallRecommendations : [],
          idealBudgetBreakdown: parsed.idealBudgetBreakdown ? {
            needs: typeof parsed.idealBudgetBreakdown.needs === 'number' ? parsed.idealBudgetBreakdown.needs : 55,
            wants: typeof parsed.idealBudgetBreakdown.wants === 'number' ? parsed.idealBudgetBreakdown.wants : 25,
            savings: typeof parsed.idealBudgetBreakdown.savings === 'number' ? parsed.idealBudgetBreakdown.savings : 20
          } : { needs: 55, wants: 25, savings: 20 },
          generatedAt: new Date().toISOString()
        };

        console.log('✅ Metas parseadas com sucesso');
        return goals;
      } else {
        console.warn('⚠️ Nenhum JSON encontrado na resposta');
      }
    } catch (error) {
      console.error('❌ Erro ao parsear resposta de metas da IA:', error);
      console.log('📝 Resposta original:', response);
    }

    console.log('🔄 Usando análise local como fallback');
    return this.getLocalBudgetGoals(data);
  }

  private getLocalBudgetGoals(data: MultiMonthFinancialData): BudgetGoalsAnalysis {
    const { months, categories, averageIncome, averageExpenses } = data;

    // Calcular médias por categoria
    const categoryAverages: Record<string, number> = {};
    
    categories.forEach(category => {
      const totals: number[] = [];
      months.forEach(monthData => {
        const monthTotal = monthData.transactions
          .filter(t => {
            const categoryId = typeof t.categoryId === 'object' ? (t.categoryId as any)._id : t.categoryId;
            return categoryId === category.id;
          })
          .reduce((sum, t) => sum + t.amount, 0);
        totals.push(monthTotal);
      });
      categoryAverages[category.id] = totals.length > 0 
        ? totals.reduce((sum, val) => sum + val, 0) / totals.length 
        : 0;
    });

    // Mapeamento mais detalhado de categorias para porcentagens ideais
    const getIdealPercentage = (categoryName: string, categoryType: string): number => {
      if (categoryType !== 'expense') return 0;
      
      const name = categoryName.toLowerCase();
      
      // Necessidades básicas (55% total)
      if (name.includes('moradia') || name.includes('aluguel') || name.includes('casa') || name.includes('condomínio')) {
        return 30;
      }
      if (name.includes('alimentação') || name.includes('comida') || name.includes('supermercado') || name.includes('restaurante')) {
        return 15;
      }
      if (name.includes('transporte') || name.includes('combustível') || name.includes('uber') || name.includes('taxi') || name.includes('ônibus')) {
        return 12;
      }
      if (name.includes('saúde') || name.includes('convênio') || name.includes('plano') || name.includes('médico') || name.includes('farmacia')) {
        return 8;
      }
      if (name.includes('contas') || name.includes('luz') || name.includes('água') || name.includes('internet') || name.includes('telefone')) {
        return 5;
      }
      
      // Desejos (25% total)
      if (name.includes('lazer') || name.includes('entretenimento') || name.includes('cinema') || name.includes('shows')) {
        return 8;
      }
      if (name.includes('assinatura') || name.includes('streaming') || name.includes('netflix') || name.includes('spotify')) {
        return 5;
      }
      if (name.includes('compras') || name.includes('roupa') || name.includes('eletrônicos')) {
        return 7;
      }
      if (name.includes('cuidados') || name.includes('beleza') || name.includes('salão')) {
        return 5;
      }
      
      // Se não se encaixar em nenhuma, usar porcentagem baseada no gasto atual
      // Se está gastando muito (>15% da receita), meta é reduzir para 10%
      // Se está gastando pouco (<5% da receita), manter próximo do atual
      const currentPct = averageIncome > 0 ? (categoryAverages[category.id] / averageIncome) * 100 : 0;
      if (currentPct > 15) return 10;
      if (currentPct < 5) return Math.max(currentPct * 1.1, 3); // Aumentar um pouco se muito baixo
      return 8; // Padrão para outras categorias
    };

    const categoryGoals: CategoryGoal[] = categories
      .filter(cat => categoryAverages[cat.id] > 0)
      .map(category => {
        const currentAvg = categoryAverages[category.id];
        const percentage = averageIncome > 0 ? (currentAvg / averageIncome) * 100 : 0;
        
        // Definir porcentagem ideal baseada na categoria
        const idealPercentage = category.type === 'expense' 
          ? getIdealPercentage(category.name, category.type)
          : 0;

        // Para despesas: se está acima do ideal, reduzir. Se está abaixo, pode aumentar um pouco mas não muito
        let recommendedGoal: number;
        if (category.type === 'expense') {
          const idealAmount = averageIncome > 0 ? (averageIncome * idealPercentage) / 100 : 0;
          
          // Se o gasto atual está muito acima do ideal, meta é reduzir para o ideal
          if (currentAvg > idealAmount * 1.2) {
            recommendedGoal = idealAmount;
          } 
          // Se está próximo ou abaixo do ideal, manter próximo do atual (não forçar redução desnecessária)
          else if (currentAvg <= idealAmount * 1.1) {
            recommendedGoal = Math.min(currentAvg * 1.05, idealAmount * 1.1); // Pode aumentar até 5% ou 10% acima do ideal
          }
          // Se está um pouco acima, reduzir gradualmente
          else {
            recommendedGoal = currentAvg * 0.9; // Reduzir 10%
          }
        } else {
          // Para receitas, sugerir aumento de 10%
          recommendedGoal = currentAvg * 1.1;
        }
        
        const difference = recommendedGoal - currentAvg;
        
        // Determinar prioridade baseada em quanto está acima do ideal
        let priority: 'low' | 'medium' | 'high' = 'low';
        if (category.type === 'expense') {
          if (percentage > idealPercentage * 1.5) {
            priority = 'high';
          } else if (percentage > idealPercentage * 1.2 || difference < -100) {
            priority = 'medium';
          } else {
            priority = 'low';
          }
        }

        // Determinar método de pagamento predominante
        let paymentMethod: 'card' | 'cash' | 'both' | undefined = undefined;
        if (category.type === 'expense') {
          const cardTotal = months.reduce((sum, m) => {
            return sum + m.transactions
              .filter(t => {
                const catId = typeof t.categoryId === 'object' ? (t.categoryId as any)._id : t.categoryId;
                return catId === category.id && t.creditCardId;
              })
              .reduce((s, t) => s + t.amount, 0);
          }, 0);
          
          const cashTotal = currentAvg * months.length - cardTotal;
          if (cardTotal > cashTotal * 1.5) {
            paymentMethod = 'card';
          } else if (cashTotal > cardTotal * 1.5) {
            paymentMethod = 'cash';
          } else if (cardTotal > 0 && cashTotal > 0) {
            paymentMethod = 'both';
          }
        }

        return {
          categoryId: category.id,
          categoryName: category.name,
          categoryType: category.type,
          currentAverage: currentAvg,
          recommendedGoal: Math.max(0, recommendedGoal), // Garantir que não seja negativo
          percentageOfIncome: percentage,
          idealPercentage,
          difference,
          priority,
          reasoning: category.type === 'expense'
            ? `Gasto atual de ${percentage.toFixed(1)}% da receita. Meta ideal é ${idealPercentage}% (R$ ${((averageIncome * idealPercentage) / 100).toFixed(2)}). ${difference < 0 ? `Redução de R$ ${Math.abs(difference).toFixed(2)} necessária.` : `Pode manter próximo do atual.`}`
            : `Receita atual de R$ ${currentAvg.toFixed(2)}. Meta sugerida de R$ ${recommendedGoal.toFixed(2)} para aumentar em ${((recommendedGoal / currentAvg - 1) * 100).toFixed(1)}%.`,
          paymentMethod
        };
      })
      .sort((a, b) => {
        // Ordenar por prioridade (high primeiro) e depois por diferença (maior redução primeiro)
        if (a.priority !== b.priority) {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return Math.abs(b.difference) - Math.abs(a.difference);
      })
      .slice(0, 20); // Limitar a 20 categorias mais relevantes

    return {
      summary: `Receita média: R$ ${averageIncome.toFixed(2)} | Despesa média: R$ ${averageExpenses.toFixed(2)} | Metas criadas para ${categoryGoals.length} categorias`,
      averageMonthlyIncome: averageIncome,
      averageMonthlyExpenses: averageExpenses,
      categoryGoals,
      overallRecommendations: [
        'Mantenha gastos essenciais abaixo de 60% da receita',
        'Reserve pelo menos 20% para poupança e investimentos',
        'Revise e ajuste as metas mensalmente'
      ],
      idealBudgetBreakdown: {
        needs: 55,
        wants: 25,
        savings: 20
      },
      generatedAt: new Date().toISOString()
    };
  }

  private async saveBudgetGoalsToDatabase(goals: BudgetGoalsAnalysis): Promise<void> {
    try {
      await apiClient.saveBudgetGoals(goals);
      console.log('💾 Metas salvas no banco de dados');
    } catch (error) {
      console.error('❌ Erro ao salvar metas no banco:', error);
    }
  }
}

export const aiService = new AIService();
