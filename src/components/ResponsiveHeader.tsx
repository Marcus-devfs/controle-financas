"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function ResponsiveHeader() {
  const { isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm sm:text-lg">F</span>
            </div>
            <span className="font-bold text-lg sm:text-2xl text-gray-800">Finanças Pro</span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-800 transition-colors font-medium">
              Recursos
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-800 transition-colors font-medium">
              Preços
            </a>
            <a href="#testimonials" className="text-gray-600 hover:text-gray-800 transition-colors font-medium">
              Depoimentos
            </a>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            {isAuthenticated ? (
              <Link 
                href="/dashboard"
                className="px-4 lg:px-6 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold text-sm lg:text-base"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  href="/login"
                  className="text-gray-600 hover:text-gray-800 transition-colors font-medium text-sm lg:text-base"
                >
                  Entrar
                </Link>
                <Link 
                  href="/register"
                  className="px-4 lg:px-6 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold text-sm lg:text-base"
                >
                  Começar Grátis
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <div className="w-6 h-6 flex flex-col justify-center gap-1">
              <div className={`w-full h-0.5 bg-gray-600 transition-all duration-200 ${
                isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
              }`}></div>
              <div className={`w-full h-0.5 bg-gray-600 transition-all duration-200 ${
                isMenuOpen ? 'opacity-0' : ''
              }`}></div>
              <div className={`w-full h-0.5 bg-gray-600 transition-all duration-200 ${
                isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
              }`}></div>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-4">
              {/* Mobile Navigation Links */}
              <div className="space-y-3">
                <a 
                  href="#features" 
                  className="block text-gray-600 hover:text-gray-800 transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Recursos
                </a>
                <a 
                  href="#pricing" 
                  className="block text-gray-600 hover:text-gray-800 transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Preços
                </a>
                <a 
                  href="#testimonials" 
                  className="block text-gray-600 hover:text-gray-800 transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Depoimentos
                </a>
              </div>

              {/* Mobile Auth Buttons */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                {isAuthenticated ? (
                  <Link 
                    href="/dashboard"
                    className="block w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link 
                      href="/login"
                      className="block w-full px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Entrar
                    </Link>
                    <Link 
                      href="/register"
                      className="block w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Começar Grátis
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
