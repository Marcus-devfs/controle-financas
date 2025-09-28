import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt é obrigatório e deve ser uma string' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.log('🔧 Usando análise local (sem API key)');
      return NextResponse.json({ 
        text: JSON.stringify({
          summary: "Análise local: Sistema funcionando sem API externa",
          insights: ["Dados carregados localmente", "Sistema operacional"],
          suggestions: [{
            type: "expense_reduction",
            title: "Sistema Local",
            description: "Funcionando com análise local",
            impact: "low",
            estimatedSavings: 0,
            priority: 1
          }],
          riskLevel: "low",
          score: 85
        })
      });
    }

    console.log('🔑 Fazendo chamada para Gemini API com biblioteca oficial...');
    console.log('📝 Tamanho do prompt:', prompt.length, 'caracteres');
    
    // Inicializar o cliente da biblioteca oficial
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192, // AUMENTAR SIGNIFICATIVAMENTE
      }
    });

    // Fazer a chamada com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

    try {
      const result = await model.generateContent(prompt);
      clearTimeout(timeoutId);
      
      const response = await result.response;
      
      console.log('✅ Resposta recebida da Gemini API');
      console.log('📊 Finish reason:', response.candidates?.[0]?.finishReason);
      console.log('📊 Safety ratings:', response.candidates?.[0]?.safetyRatings);
      
      // Verificar se ainda foi cortado
      if (response.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
        console.warn('⚠️ Resposta cortada por limite de tokens');
      }
      
      // Verificar se foi bloqueado por segurança
      if (response.candidates?.[0]?.finishReason === 'SAFETY') {
        console.error('❌ Resposta bloqueada por filtros de segurança');
        return NextResponse.json({ error: 'Resposta bloqueada por filtros de segurança' }, { status: 400 });
      }
      
      const text = response.text();
      
      if (!text || text.trim().length === 0) {
        console.error('❌ Texto vazio na resposta da API');
        return NextResponse.json({ error: 'Texto vazio na resposta da API' }, { status: 500 });
      }
      
      console.log('📝 Texto extraído:', text.substring(0, 200) + '...');
      console.log('📏 Tamanho da resposta:', text.length, 'caracteres');
      
      return NextResponse.json({
        text: text
      });
      
    } catch (apiError: any) {
      clearTimeout(timeoutId);
      
      if (controller.signal.aborted) {
        console.error('❌ Timeout na chamada da API');
        return NextResponse.json({ error: 'Timeout na chamada da API' }, { status: 408 });
      }
      
      console.error('❌ Erro específico da API:', apiError);
      
      // Tratar erros específicos da API
      if (apiError.message?.includes('API_KEY_INVALID')) {
        return NextResponse.json({ error: 'Chave da API inválida' }, { status: 401 });
      }
      
      if (apiError.message?.includes('QUOTA_EXCEEDED')) {
        return NextResponse.json({ error: 'Cota da API excedida' }, { status: 429 });
      }
      
      throw apiError;
    }

  } catch (error: any) {
    console.error('❌ Erro no proxy da IA:', error);
    
    // Retornar erro mais específico
    const errorMessage = error.message || 'Erro interno do servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}