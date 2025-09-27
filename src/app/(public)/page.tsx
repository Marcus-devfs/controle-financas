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

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Pronto para transformar suas finanças?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Junte-se a milhares de pessoas que já organizaram sua vida financeira
          </p>
          <Link 
            href={isAuthenticated ? "/dashboard" : "/register"}
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold text-lg shadow-lg hover:shadow-xl"
          >
            {isAuthenticated ? "Acessar Dashboard" : "Começar Grátis Agora"}
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