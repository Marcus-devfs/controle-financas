import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ParsedTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  suggestedCategory: string;
}

const buildPrompt = (categoryNames: string) =>
  `Extract all financial transactions from this document. Return ONLY valid JSON, no markdown, no explanation:
{"transactions":[{"description":"...","amount":0.00,"date":"YYYY-MM-DD","type":"expense","suggestedCategory":"..."}]}
Rules: amount always positive; type="income" for credits/deposits, type="expense" for debits/purchases; date in YYYY-MM-DD; suggestedCategory from: ${categoryNames || 'Alimentação,Transporte,Moradia,Saúde,Educação,Lazer,Outros'}; skip balances/totals/headers.`;

async function callWithRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const retryable = err.status === 503 || err.status === 429;
      if (!retryable || attempt === maxAttempts) throw err;
      const delay = attempt * 2000; // 2s, 4s
      console.log(`Attempt ${attempt} failed (${err.status}), retrying in ${delay}ms…`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

function extractJsonBlock(text: string): string | null {
  // 1. Markdown code block: ```json ... ``` or ``` ... ```
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // 2. Look for {"transactions": specifically
  const transactionsIdx = text.indexOf('"transactions"');
  if (transactionsIdx !== -1) {
    const openBrace = text.lastIndexOf('{', transactionsIdx);
    if (openBrace !== -1) {
      // Find matching closing brace
      let depth = 0;
      for (let i = openBrace; i < text.length; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') {
          depth--;
          if (depth === 0) return text.substring(openBrace, i + 1);
        }
      }
      // Truncated — return what we have up to last }
      const lastClose = text.lastIndexOf('}');
      if (lastClose > openBrace) return text.substring(openBrace, lastClose + 1);
    }
  }

  // 3. Fallback: first { to last }
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last > first) return text.substring(first, last + 1);

  return null;
}

function repairJson(raw: string): string {
  return raw
    // Remove trailing commas before ] or }
    .replace(/,(\s*[}\]])/g, '$1')
    // Remove control characters except newline/tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Replace single quotes used as string delimiters with double quotes
    .replace(/'/g, '"');
}

function parseJsonSafe(raw: string): any | null {
  // Try direct parse first
  try {
    return JSON.parse(raw);
  } catch {}

  // Try after repair
  try {
    return JSON.parse(repairJson(raw));
  } catch {}

  // Try to truncate at the last complete transaction object
  try {
    const lastBracket = raw.lastIndexOf('}');
    if (lastBracket > 0) {
      const truncated = raw.substring(0, lastBracket + 1);
      // Find the transactions array closing
      const arrayClose = truncated.lastIndexOf(']');
      if (arrayClose > 0) {
        const candidate = truncated.substring(0, arrayClose + 1) + '}';
        return JSON.parse(repairJson(candidate));
      }
    }
  } catch {}

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const categoriesJson = formData.get('categories') as string;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo fornecido' }, { status: 400 });
    }

    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Limite de 15MB.' }, { status: 400 });
    }

    const categories = categoriesJson ? JSON.parse(categoriesJson) : [];
    const categoryNames = categories.map((c: any) => c.name).join(', ');
    const fileName = file.name.toLowerCase();

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave da API Gemini não configurada' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
        // @ts-ignore — thinkingBudget: 0 disables reasoning mode for speed
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const prompt = buildPrompt(categoryNames);

    let contents: Parameters<typeof model.generateContent>[0];
    if (fileName.endsWith('.pdf')) {
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      contents = [
        { text: prompt },
        { inlineData: { mimeType: 'application/pdf', data: base64 } }
      ];
    } else {
      const text = await file.text();
      const fileType = fileName.endsWith('.ofx') || fileName.endsWith('.qfx') ? 'OFX/QFX' : 'CSV';
      contents = `${prompt}\n\nConteúdo do arquivo ${fileType}:\n${text.substring(0, 20000)}`;
    }

    const result = await callWithRetry(() => model.generateContent(contents));

    const responseText = result.response.text();
    console.log('Gemini response preview:', responseText.substring(0, 500));

    const rawJson = extractJsonBlock(responseText);
    if (!rawJson) {
      console.error('No JSON found in response. Full response:', responseText.substring(0, 1000));
      return NextResponse.json(
        { error: 'Não foi possível extrair transações do arquivo. Verifique se é um extrato bancário ou fatura válida.' },
        { status: 422 }
      );
    }

    const parsed = parseJsonSafe(rawJson);
    if (!parsed) {
      console.error('JSON parse failed. Raw:', rawJson.substring(0, 500));
      return NextResponse.json(
        { error: 'A IA retornou dados no formato incorreto. Tente novamente.' },
        { status: 422 }
      );
    }
    const now = Date.now();
    const transactions: ParsedTransaction[] = (parsed.transactions || [])
      .filter((t: any) => t.description && t.amount && t.date)
      .map((t: any, idx: number) => ({
        id: `import-${idx}-${now}`,
        description: String(t.description).trim(),
        amount: Math.abs(parseFloat(String(t.amount)) || 0),
        date: String(t.date),
        type: t.type === 'income' ? 'income' : 'expense',
        suggestedCategory: String(t.suggestedCategory || 'Outros')
      }));

    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error('Erro ao processar arquivo de importação:', error);
    const isQuota = error.status === 429;
    const isOverload = error.status === 503;
    const isKeyInvalid = error.status === 400 && error.message?.includes('API_KEY');
    const isKeyLeaked = error.status === 403;
    const status = isQuota ? 429 : 500;
    const message = isQuota
      ? 'Limite da API Gemini atingido. Aguarde alguns minutos e tente novamente.'
      : isOverload
      ? 'API Gemini sobrecarregada no momento. Tente novamente em alguns segundos.'
      : isKeyInvalid
      ? 'Chave da API Gemini expirada ou inválida. Gere uma nova chave em aistudio.google.com.'
      : isKeyLeaked
      ? 'Chave da API Gemini foi reportada como vazada. Gere uma nova chave em aistudio.google.com.'
      : error.message || 'Erro ao processar arquivo';
    return NextResponse.json({ error: message }, { status });
  }
}
