/**
 * Utilitários para formatação de valores monetários
 */

/**
 * Formata um valor numérico para string com formatação brasileira
 * @param value - Valor numérico
 * @returns String formatada (ex: "1.234,56")
 */
export function formatCurrencyInput(value: number): string {
  if (isNaN(value) || value === 0) return '';
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Converte string formatada para número
 * @param value - String formatada (ex: "1.234,56")
 * @returns Número (ex: 1234.56)
 */
export function parseCurrencyInput(value: string): number {
  if (!value || value.trim() === '') return 0;
  
  // Remove todos os pontos (separadores de milhares)
  const withoutThousands = value.replace(/\./g, '');
  
  // Substitui vírgula por ponto (separador decimal)
  const withDecimalPoint = withoutThousands.replace(',', '.');
  
  const parsed = parseFloat(withDecimalPoint);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formata valor enquanto o usuário digita - versão que aceita apenas números
 * @param value - Valor atual do input
 * @returns String formatada para exibição
 */
export function formatCurrencyWhileTyping(value: string): string {
  if (!value) return '';
  
  // Remove tudo que não é número
  const rawValue = value.replace(/[^\d]/g, '');
  
  if (rawValue === '') {
    return '';
  }
  
  // Pega os últimos 2 dígitos como decimais
  let intValue = rawValue.slice(0, -2) || '0'; // Parte inteira
  const decimalValue = rawValue.slice(-2).padStart(2, '0'); // Parte decimal
  
  // Se o valor inteiro é 0 e temos mais de 2 dígitos, remove o 0
  if (intValue === '0' && rawValue.length > 2) {
    intValue = rawValue.slice(0, -2);
  }
  
  // Formata a parte inteira com separadores de milhares
  const formattedIntValue = parseInt(intValue, 10).toLocaleString('pt-BR');
  
  // Retorna o valor formatado
  return `${formattedIntValue},${decimalValue}`;
}

/**
 * Converte string formatada para número (versão para a nova formatação)
 * @param value - String formatada (ex: "1.280,80")
 * @returns Número (ex: 1280.80)
 */
export function parseCurrencyInputNew(value: string): number {
  if (!value || value.trim() === '') return 0;
  
  // Remove todos os pontos (separadores de milhares)
  const withoutThousands = value.replace(/\./g, '');
  
  // Substitui vírgula por ponto (separador decimal)
  const withDecimalPoint = withoutThousands.replace(',', '.');
  
  const parsed = parseFloat(withDecimalPoint);
  return isNaN(parsed) ? 0 : parsed;
}


