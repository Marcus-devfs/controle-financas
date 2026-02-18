import { formatCurrency } from "@/lib/data";

interface FixedCostCardProps {
  fixedCosts: number;
  fixedIncome: number;
}

export function FixedCostCard({ fixedCosts, fixedIncome }: FixedCostCardProps) {
  // Evitar divisão por zero
  const percentage = fixedIncome > 0 ? (fixedCosts / fixedIncome) * 100 : 0;

  // Definir cor com base na porcentagem de comprometimento
  // Verde: < 50% (Saudável - considerando que é apenas renda fixa)
  // Amarelo: 50% - 70% (Atenção)
  // Vermelho: > 70% (Crítico)
  // Ajustei as faixas pois comprometer 30% da renda fixa pode ser muito restritivo, 
  // mas podemos ajustar conforme necessidade. Vou manter conservador.
  // Voltando para o padrão anterior mas aplicado a Renda Fixa:
  // < 50% ideal, 50-80 atenção, > 80 critico? 
  // O usuário pediu "Custo Fixo X Receita Fixa".

  let statusColor = "text-green-600";
  let progressColor = "bg-green-500";
  let bgColor = "bg-green-50";
  let statusText = "Saudável";

  if (percentage >= 80) {
    statusColor = "text-red-600";
    progressColor = "bg-red-500";
    bgColor = "bg-red-50";
    statusText = "Crítico";
  } else if (percentage >= 50) {
    statusColor = "text-yellow-600";
    progressColor = "bg-yellow-500";
    bgColor = "bg-yellow-50";
    statusText = "Atenção";
  }

  return (
    <div className={`card p-6 ${bgColor} animate-fade-in`}>
      <h3 className="text-lg font-semibold mb-4">Comprometimento da Renda Fixa</h3>
      <div className="flex justify-between items-center mb-2">
        <div>
          <p className="text-sm text-muted-foreground">Custos Fixos</p>
          <p className={`text-2xl font-bold ${statusColor}`}>
            {formatCurrency(fixedCosts)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-muted-foreground">Receita Fixa</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(fixedIncome)}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-1 text-sm">
        <span className="text-muted-foreground">Comprometimento:</span>
        <span className={`font-bold ${statusColor}`}>{percentage.toFixed(1)}%</span>
      </div>

      <div className="w-full bg-black/10 rounded-full h-3 mb-2">
        <div
          className={`${progressColor} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Status: <span className={`font-medium ${statusColor}`}>{statusText}</span>
      </p>
    </div>
  );
}
