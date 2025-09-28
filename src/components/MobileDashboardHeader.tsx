"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function MobileDashboardHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo e nome do usuário */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">Finanças Pro</div>
            <div className="text-xs text-gray-500">Olá, {user?.name}</div>
          </div>
        </div>

        {/* Menu hamburger */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-5 h-5 flex flex-col justify-center gap-1">
            <div className={`w-full h-0.5 bg-gray-600 transition-all duration-200 ${
              showMenu ? 'rotate-45 translate-y-1.5' : ''
            }`}></div>
            <div className={`w-full h-0.5 bg-gray-600 transition-all duration-200 ${
              showMenu ? 'opacity-0' : ''
            }`}></div>
            <div className={`w-full h-0.5 bg-gray-600 transition-all duration-200 ${
              showMenu ? '-rotate-45 -translate-y-1.5' : ''
            }`}></div>
          </div>
        </button>
      </div>

      {/* Menu dropdown */}
      {showMenu && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
          <div className="px-4 py-2 space-y-1">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
