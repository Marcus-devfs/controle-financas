import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt é obrigatório' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.log('🔧 Usando análise local (sem API key)');
      return NextResponse.json({ 
        text: JSON.stringify({
          summary: "Análise local: Sistema funcionando sem API externa",
          insights: ["Dados carregados localmente", "Sistema operacional"],
          suggestions: [{
            type: "info",
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
    
    // Inicializar o cliente da biblioteca oficial
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096, // Limite maior para evitar cortes
      }
    });

    // Fazer a chamada
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    console.log('✅ Resposta recebida da Gemini API');
    console.log('📊 Finish reason:', response.candidates?.[0]?.finishReason);
    
    // Verificar se ainda foi cortado
    if (response.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
      console.warn('⚠️ Resposta ainda cortada por limite de tokens, mas temos conteúdo parcial');
    }
    
    const text = response.text();
    
    if (!text) {
      console.error('❌ Texto vazio na resposta da API');
      return NextResponse.json({ error: 'Texto vazio na resposta da API' }, { status: 500 });
    }
    
    console.log('📝 Texto extraído:', text.substring(0, 200) + '...');
    
    return NextResponse.json({
      text: text
    });

  } catch (error) {
    console.error('❌ Erro no proxy da IA:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}