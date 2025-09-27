"use client";

import { AISuggestion } from '@/lib/aiService';
import { useState } from 'react';

interface AIQuickSuggestionsProps {
  suggestions: AISuggestion[];
  loading?: boolean;
  onSuggestionClick?: (suggestion: AISuggestion) => void;
}

export function AIQuickSuggestions({ suggestions, loading, onSuggestionClick }: AIQuickSuggestionsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'expense_reduction': return '💰';
      case 'income_increase': return '📈';
      case 'investment_optimization': return '🎯';
      case 'budget_adjustment': return '📊';
      default: return '💡';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">🤖</span>
          </div>
          <h3 className="font-semibold text-gray-800">Sugestões da IA</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">✅</span>
          </div>
          <h3 className="font-semibold text-gray-800">Sugestões da IA</h3>
        </div>
        <p className="text-gray-600 text-sm">
          Suas finanças estão em boa forma! Continue assim.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm">🤖</span>
        </div>
        <h3 className="font-semibold text-gray-800">Sugestões da IA</h3>
      </div>
      
      <div className="space-y-3">
        {suggestions.slice(0, 3).map((suggestion, index) => (
          <div 
            key={index}
            className="border border-gray-100 rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer"
            onClick={() => {
              setExpandedIndex(expandedIndex === index ? null : index);
              onSuggestionClick?.(suggestion);
            }}
          >
            <div className="flex items-start gap-3">
              <div className="text-lg">{getTypeIcon(suggestion.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-800 text-sm truncate">
                    {suggestion.title}
                  </h4>
                  <span className="text-xs">{getImpactIcon(suggestion.impact)}</span>
                </div>
                
                <p className="text-xs text-gray-600 line-clamp-2">
                  {suggestion.description}
                </p>
                
                {suggestion.estimatedSavings && (
                  <div className="text-xs text-green-600 font-medium mt-1">
                    +R$ {suggestion.estimatedSavings.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
            
            {expandedIndex === index && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors">
                    Aplicar
                  </button>
                  <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 transition-colors">
                    Detalhes
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {suggestions.length > 3 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            Ver todas as sugestões ({suggestions.length})
          </button>
        </div>
      )}
    </div>
  );
}
