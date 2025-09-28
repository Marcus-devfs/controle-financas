"use client";

import { AIAnalysis, AISuggestion } from '@/lib/aiService';
import { useState } from 'react';

interface AIAnalysisCardProps {
  analysis: AIAnalysis;
  onSuggestionClick?: (suggestion: AISuggestion) => void;
}

export function AIAnalysisCard({ analysis, onSuggestionClick }: AIAnalysisCardProps) {
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
          <span className="text-white text-lg">🤖</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Análise Inteligente</h3>
          <p className="text-sm text-gray-600">Insights baseados em IA</p>
        </div>
      </div>

      {/* Score e Risk */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Score Financeiro</div>
          <div className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
            {analysis.score}/100
          </div>
        </div>
        <div className={`rounded-lg p-4 border ${getRiskColor(analysis.riskLevel)}`}>
          <div className="text-sm mb-1">Nível de Risco</div>
          <div className="text-lg font-semibold capitalize">
            {analysis.riskLevel === 'low' ? 'Baixo' : 
             analysis.riskLevel === 'medium' ? 'Médio' : 'Alto'}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-2">Diagnóstico Financeiro</h4>
        <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
          {analysis.summary}
        </p>
      </div>

      {/* Budget Analysis */}
      {analysis.budgetAnalysis && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            📊 Análise de Orçamento
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analysis.budgetAnalysis.currentNeeds}%</div>
              <div className="text-sm text-gray-600">Necessidades</div>
              <div className="text-xs text-gray-500">Ideal: {analysis.budgetAnalysis.idealNeeds}%</div>
              <div className={`text-xs mt-1 ${parseFloat(analysis.budgetAnalysis.currentNeeds) > analysis.budgetAnalysis.idealNeeds ? 'text-red-600' : 'text-green-600'}`}>
                {parseFloat(analysis.budgetAnalysis.currentNeeds) > analysis.budgetAnalysis.idealNeeds ? '⚠️ Acima do ideal' : '✅ Dentro do ideal'}
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{analysis.budgetAnalysis.currentWants}%</div>
              <div className="text-sm text-gray-600">Desejos</div>
              <div className="text-xs text-gray-500">Ideal: {analysis.budgetAnalysis.idealWants}%</div>
              <div className={`text-xs mt-1 ${parseFloat(analysis.budgetAnalysis.currentWants) > analysis.budgetAnalysis.idealWants ? 'text-red-600' : 'text-green-600'}`}>
                {parseFloat(analysis.budgetAnalysis.currentWants) > analysis.budgetAnalysis.idealWants ? '⚠️ Acima do ideal' : '✅ Dentro do ideal'}
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analysis.budgetAnalysis.idealSavings}%</div>
              <div className="text-sm text-gray-600">Poupança</div>
              <div className="text-xs text-gray-500">Meta: {analysis.budgetAnalysis.idealSavings}%</div>
              <div className="text-xs mt-1 text-blue-600">🎯 Meta a alcançar</div>
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      {analysis.insights.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 mb-3">Insights Principais</h4>
          <div className="space-y-2">
            {analysis.insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700 text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sugestões */}
      {analysis.suggestions.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Sugestões Inteligentes</h4>
          <div className="space-y-3">
            {analysis.suggestions.map((suggestion, index) => (
              <div 
                key={index} 
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setExpandedSuggestion(expandedSuggestion === index ? null : index);
                  onSuggestionClick?.(suggestion);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-medium text-gray-800">{suggestion.title}</h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(suggestion.impact)}`}>
                        {suggestion.impact === 'high' ? 'Alto Impacto' :
                         suggestion.impact === 'medium' ? 'Médio Impacto' : 'Baixo Impacto'}
                      </span>
                    </div>
                    
                    {suggestion.category && (
                      <div className="text-sm text-gray-600 mb-2">
                        Categoria: <span className="font-medium">{suggestion.category}</span>
                      </div>
                    )}
                    
                    {suggestion.estimatedSavings && (
                      <div className="text-sm text-green-600 font-medium mb-2">
                        Economia estimada: R$ {suggestion.estimatedSavings.toFixed(2)}
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-600">
                      {suggestion.description}
                    </p>
                  </div>
                  
                  <div className="ml-4 flex flex-col items-center">
                    <div className="text-xs text-gray-500 mb-1">Prioridade</div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div
                          key={star}
                          className={`w-2 h-2 rounded-full ${
                            star <= suggestion.priority ? 'bg-yellow-400' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                {expandedSuggestion === index && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                        Aplicar Sugestão
                      </button>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                        Mais Detalhes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            🎯 Recomendações Estratégicas
          </h4>
          <div className="space-y-2">
            {analysis.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-100">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-gray-700 text-sm">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
