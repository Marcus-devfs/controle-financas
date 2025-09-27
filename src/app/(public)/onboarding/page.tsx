"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const steps = [
    {
      title: "Controle Total das Suas Finanças",
      subtitle: "Organize sua vida financeira de forma simples e inteligente",
      description: "Gerencie receitas, despesas e investimentos em um só lugar. Tenha visão completa do seu dinheiro.",
      icon: "💰",
      features: [
        "📊 Dashboard completo com métricas",
        "💳 Controle de cartões de crédito",
        "📈 Acompanhamento de investimentos",
        "📱 Interface intuitiva e responsiva"
      ]
    },
    {
      title: "Relatórios Inteligentes",
      subtitle: "Entenda seus gastos e otimize seus investimentos",
      description: "Visualize seus dados com gráficos interativos e relatórios detalhados para tomar melhores decisões.",
      icon: "📊",
      features: [
        "📈 Gráficos de tendências mensais",
        "🥧 Análise por categorias",
        "💹 Comparativo de receitas vs despesas",
        "📋 Relatórios exportáveis"
      ]
    },
    {
      title: "Segurança e Privacidade",
      subtitle: "Seus dados financeiros protegidos com tecnologia de ponta",
      description: "Utilizamos criptografia avançada e seguimos as melhores práticas de segurança para proteger suas informações.",
      icon: "🔒",
      features: [
        "🔐 Criptografia de ponta a ponta",
        "🛡️ Dados armazenados com segurança",
        "👤 Controle total da sua privacidade",
        "⚡ Backup automático dos dados"
      ]
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push('/register');
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = () => {
    router.push('/register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <span className="font-bold text-xl text-gray-800">Finanças Pro</span>
        </div>
        <button
          onClick={skipOnboarding}
          className="text-gray-600 hover:text-gray-800 transition-colors"
        >
          Pular
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-4xl w-full">
          {/* Step Indicator */}
          <div className="flex justify-center mb-12">
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'bg-blue-600 scale-125'
                      : index < currentStep
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="text-center mb-12">
            <div className="text-6xl mb-6">{steps[currentStep].icon}</div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              {steps[currentStep].title}
            </h1>
            <h2 className="text-xl md:text-2xl text-gray-600 mb-6">
              {steps[currentStep].subtitle}
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
              {steps[currentStep].description}
            </p>

            {/* Features List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {steps[currentStep].features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-white/70 rounded-lg shadow-sm"
                >
                  <span className="text-2xl">{feature.split(' ')[0]}</span>
                  <span className="text-gray-700">{feature.substring(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>

            <div className="flex gap-4">
              <Link
                href="/login"
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-full hover:border-gray-400 transition-colors"
              >
                Já tenho conta
              </Link>
              <button
                onClick={nextStep}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-full hover:from-blue-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {currentStep === steps.length - 1 ? 'Começar Agora' : 'Próximo →'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="bg-white/50 backdrop-blur-sm border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-gray-600">Usuários ativos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">R$ 2M+</div>
              <div className="text-gray-600">Dinheiro gerenciado</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">4.9★</div>
              <div className="text-gray-600">Avaliação média</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
