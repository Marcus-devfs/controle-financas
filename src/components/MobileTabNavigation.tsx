"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
// Removed unused useAuth import

interface TabItem {
  href: string;
  label: string;
  icon: string;
  activeIcon: string;
}

const tabs: TabItem[] = [
  {
    href: "/dashboard",
    label: "Início",
    icon: "🏠",
    activeIcon: "🏠"
  },
  {
    href: "/dashboard/transacoes",
    label: "Transações",
    icon: "💳",
    activeIcon: "💳"
  },
  {
    href: "/dashboard/cartoes",
    label: "Cartões",
    icon: "💳",
    activeIcon: "💳"
  },
  {
    href: "/dashboard/investimentos",
    label: "Investimentos",
    icon: "📈",
    activeIcon: "📈"
  },
  {
    href: "/dashboard/relatorios",
    label: "Relatórios",
    icon: "📊",
    activeIcon: "📊"
  },
  {
    href: "/dashboard/importar",
    label: "Importar",
    icon: "📥",
    activeIcon: "📥"
  },
  {
    href: "/dashboard/planejamento-compras",
    label: "Compras",
    icon: "🛒",
    activeIcon: "🛒"
  }
];

export default function MobileTabNavigation() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex items-center gap-1 overflow-x-auto py-2 px-1">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-shrink-0 flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg mb-1">
                {isActive ? tab.activeIcon : tab.icon}
              </span>
              <span className="text-xs font-medium whitespace-nowrap">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
      
      {/* Safe area para dispositivos com notch */}
      <div className="h-safe-area-inset-bottom bg-white"></div>
    </div>
  );
}
