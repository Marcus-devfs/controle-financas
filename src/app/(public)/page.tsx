"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="font-bold text-2xl text-gray-800">Finanças Pro</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-800 transition-colors">Recursos</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-800 transition-colors">Preços</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-800 transition-colors">Depoimentos</a>
            </nav>

            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link 
                  href="/dashboard"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    href="/login"
                    className="text-gray-600 hover:text-gray-800 transition-colors font-medium"
                  >
                    Entrar
                  </Link>
                  <Link 
                    href="/register"
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold"
                  >
                    Começar Grátis
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
            Transforme sua{' '}
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              vida financeira
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            O painel financeiro mais completo e intuitivo do Brasil. 
            Organize receitas, despesas, cartões e investimentos em um só lugar.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link 
              href={isAuthenticated ? "/dashboard" : "/register"}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              {isAuthenticated ? "Ir para Dashboard" : "Começar Grátis"}
            </Link>
            <Link 
              href="/onboarding"
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-all font-semibold text-lg"
            >
              Ver Demonstração
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-gray-600">Usuários ativos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">R$ 2M+</div>
              <div className="text-gray-600">Dinheiro gerenciado</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">4.9★</div>
              <div className="text-gray-600">Avaliação média</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Tudo que você precisa para suas finanças
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Recursos poderosos para organizar, analisar e otimizar sua vida financeira
            </p>
          </div>

          {/* Consultor IA - Destaque Especial */}
          <div className="col-span-full mb-8">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl">🤖</span>
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm font-medium mb-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      DIFERENCIAL EXCLUSIVO
                    </div>
                    <h3 className="text-2xl font-bold">Consultor IA Financeiro</h3>
                  </div>
                </div>
                
                <p className="text-lg text-white/90 mb-6 max-w-2xl">
                  <strong>Análise financeira inteligente que você não encontra em outros apps.</strong> 
                  Nossa IA identifica problemas ocultos, sugere soluções personalizadas e oferece insights 
                  que transformam sua relação com o dinheiro.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="text-2xl font-bold mb-1">85%</div>
                    <div className="text-sm text-white/80">Redução média de gastos desnecessários</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="text-2xl font-bold mb-1">R$ 1.2K</div>
                    <div className="text-sm text-white/80">Economia média mensal identificada</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="text-2xl font-bold mb-1">92%</div>
                    <div className="text-sm text-white/80">Usuários melhoraram sua saúde financeira</div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link 
                    href={isAuthenticated ? "/dashboard" : "/register"}
                    className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-white/90 transition-all shadow-lg"
                  >
                    {isAuthenticated ? "Experimentar Consultor IA" : "Começar Grátis"}
                  </Link>
                  <Link 
                    href="/onboarding"
                    className="px-6 py-3 border-2 border-white/30 text-white rounded-lg font-semibold hover:bg-white/10 transition-all"
                  >
                    Ver Demonstração
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Dashboard Inteligente</h3>
              <p className="text-gray-600">
                Visualize todas as suas finanças em um painel completo com métricas e insights em tempo real.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">💳</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Controle de Cartões</h3>
              <p className="text-gray-600">
                Gerencie gastos, faturas e limites de cartão de crédito com alertas inteligentes.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Relatórios Avançados</h3>
              <p className="text-gray-600">
                Análise detalhada com gráficos interativos e relatórios exportáveis.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Gestão de Investimentos</h3>
              <p className="text-gray-600">
                Acompanhe seus investimentos e calcule rendimentos com precisão.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Segurança Total</h3>
              <p className="text-gray-600">
                Seus dados protegidos com criptografia de ponta a ponta e backup automático.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Multi-dispositivo</h3>
              <p className="text-gray-600">
                Acesse suas finanças de qualquer lugar, em qualquer dispositivo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Foco no Consultor IA */}
      <section id="testimonials" className="py-20 px-6 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              O que nossos usuários dizem sobre o Consultor IA
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Histórias reais de como nossa IA transformou a vida financeira de pessoas como você
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">⭐</span>
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">
                "O Consultor IA identificou que eu estava gastando R$ 800/mês com delivery sem perceber. 
                Agora economizo esse valor e invisto em coisas que realmente importam."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  M
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Maria Silva</div>
                  <div className="text-sm text-gray-600">Empresária, São Paulo</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">⭐</span>
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">
                "A análise da IA me mostrou padrões que eu nunca tinha notado. 
                Descobri que 40% dos meus gastos eram em categorias que eu nem sabia que existiam!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  J
                </div>
                <div>
                  <div className="font-semibold text-gray-800">João Santos</div>
                  <div className="text-sm text-gray-600">Engenheiro, Rio de Janeiro</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">⭐</span>
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">
                "O melhor investimento que fiz! A IA me ajudou a criar um plano de pagamento de dívidas 
                que eu nunca teria conseguido sozinha. Em 6 meses já paguei 60% das minhas dívidas."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Ana Costa</div>
                  <div className="text-sm text-gray-600">Professora, Belo Horizonte</div>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas de Impacto */}
          <div className="mt-16 bg-white rounded-3xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Impacto Real do Consultor IA
              </h3>
              <p className="text-gray-600">
                Dados baseados em análises de mais de 10.000 usuários
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">R$ 1.247</div>
                <div className="text-gray-600">Economia média mensal</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">73%</div>
                <div className="text-gray-600">Redução de gastos desnecessários</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">89%</div>
                <div className="text-gray-600">Melhoria na saúde financeira</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">4.2x</div>
                <div className="text-gray-600">Aumento na taxa de poupança</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Pronto para ter seu Consultor IA Financeiro?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Junte-se a milhares de pessoas que já transformaram suas finanças com nossa IA
          </p>
          <Link 
            href={isAuthenticated ? "/dashboard" : "/register"}
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold text-lg shadow-lg hover:shadow-xl"
          >
            {isAuthenticated ? "Experimentar Consultor IA" : "Começar Grátis Agora"}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className="font-bold text-xl">Finanças Pro</span>
              </div>
              <p className="text-gray-400">
                O painel financeiro mais completo e intuitivo do Brasil.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Finanças Pro. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}