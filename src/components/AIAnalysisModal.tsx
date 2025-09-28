"use client";

import { useState } from 'react';
import { AIAnalysis, AISuggestion } from '@/lib/aiService';
import { formatCurrency } from '@/lib/data';

interface AIAnalysisModalProps {
  analysis: AIAnalysis | null;
  isOpen: boolean;
  onClose: () => void;
  loading?: boolean;
}

export function AIAnalysisModal({ analysis, isOpen, onClose, loading = false }: AIAnalysisModalProps) {
  if (!isOpen) return null;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
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
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🤖</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Análise Financeira com IA</h2>
              <p className="text-sm text-gray-500">Insights e recomendações personalizadas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Analisando seus dados financeiros...</p>
              <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos</p>
            </div>
          ) : analysis ? (
            <div className="p-6 space-y-6">
              {/* Score e Risk Level */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Score Financeiro</span>
                    <span className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
                      {analysis.score}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        analysis.score >= 80 ? 'bg-green-500' : 
                        analysis.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${analysis.score}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Nível de Risco</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(analysis.riskLevel)}`}>
                      {analysis.riskLevel === 'low' ? 'Baixo' : 
                       analysis.riskLevel === 'medium' ? 'Médio' : 'Alto'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">📊 Resumo da Situação</h3>
                <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
              </div>

              {/* Insights */}
              {analysis.insights && analysis.insights.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">💡 Insights Principais</h3>
                  <div className="space-y-2">
                    {analysis.insights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {index + 1}
                        </div>
                        <p className="text-gray-700">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {analysis.suggestions && analysis.suggestions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">🎯 Recomendações</h3>
                  <div className="space-y-3">
                    {analysis.suggestions.map((suggestion, index) => (
                      <SuggestionCard key={index} suggestion={suggestion} index={index} />
                    ))}
                  </div>
                </div>
              )}

              {/* Budget Analysis */}
              {analysis.budgetAnalysis && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">📈 Análise de Orçamento</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{analysis.budgetAnalysis.currentNeeds}%</div>
                      <div className="text-sm text-gray-600">Necessidades Atuais</div>
                      <div className="text-xs text-gray-500">Ideal: {analysis.budgetAnalysis.idealNeeds}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{analysis.budgetAnalysis.currentWants}%</div>
                      <div className="text-sm text-gray-600">Desejos Atuais</div>
                      <div className="text-xs text-gray-500">Ideal: {analysis.budgetAnalysis.idealWants}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{analysis.budgetAnalysis.idealSavings}%</div>
                      <div className="text-sm text-gray-600">Poupança Ideal</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">📋 Próximos Passos</h3>
                  <div className="space-y-2">
                    {analysis.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                          ✓
                        </div>
                        <p className="text-gray-700">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">❌</span>
              </div>
              <p className="text-gray-600">Erro ao carregar análise</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Análise gerada por IA • Dados atualizados em tempo real
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuggestionCard({ suggestion, index }: { suggestion: AISuggestion; index: number }) {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'expense_reduction': return '💰';
      case 'income_increase': return '📈';
      case 'investment_optimization': return '📊';
      case 'budget_adjustment': return '⚖️';
      default: return '💡';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="text-2xl">{getTypeIcon(suggestion.type)}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactColor(suggestion.impact)}`}>
              {suggestion.impact === 'high' ? 'Alto Impacto' : 
               suggestion.impact === 'medium' ? 'Médio Impacto' : 'Baixo Impacto'}
            </span>
          </div>
          <p className="text-gray-700 mb-3">{suggestion.description}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {suggestion.estimatedSavings && (
              <span className="flex items-center gap-1">
                <span>💵</span>
                Economia estimada: {formatCurrency(suggestion.estimatedSavings)}
              </span>
            )}
            {suggestion.timeline && (
              <span className="flex items-center gap-1">
                <span>⏰</span>
                {suggestion.timeline}
              </span>
            )}
            {suggestion.category && (
              <span className="flex items-center gap-1">
                <span>📂</span>
                {suggestion.category}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
            {suggestion.priority}
          </div>
          <div className="text-xs text-gray-500 mt-1">Prioridade</div>
        </div>
      </div>
    </div>
  );
}
