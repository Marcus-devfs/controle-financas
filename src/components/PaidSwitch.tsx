"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export function PaidSwitch({
  isPaid,
  onChange,
  ariaLabel = 'Pago'
}: {
  isPaid: boolean;
  onChange: (next: boolean) => Promise<void> | void;
  ariaLabel?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      await onChange(!isPaid);
    } finally {
      setLoading(false);
    }
  };

  return (
    // 1. Mantemos o padding (p-2) para aumentar o alvo de clique, mas removemos a cor de fundo e bordas do botão.
    // 2. Usamos 'p-2' para adicionar a área de toque invisível.
    <button
      type="button"
      role="switch"
      aria-checked={isPaid}
      aria-label={ariaLabel}
      onClick={handleClick}
      disabled={loading}
      // CLASSES DO BOTÃO PRINCIPAL (Alvo de Toque):
      className={`relative inline-flex items-center rounded-full transition-colors p-2 
        bg-transparent hover:bg-gray-100/50 disabled:opacity-60 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:rounded-full
        ${isPaid ? 'focus:ring-green-500' : 'focus:ring-gray-500'} group`}
    >
      
      {/* CONTAINER DO SWITCH VISUAL: É o que realmente aparece e tem a cor */}
      <span className={`inline-flex h-6 w-11 items-center rounded-full transition-colors 
        ${isPaid ? 'bg-green-500' : 'bg-gray-300'}`}>
        
        {loading ? (
          // Ocupa todo o espaço do switch para centralizar o spinner
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="h-4 w-4 border-2 border-white/70 border-t-white rounded-full animate-spin"></span>
          </span>
        ) : null}
        
        {/* Thumb (o círculo) */}
        <motion.span
          className="inline-block h-5 w-5 rounded-full bg-white shadow-md"
          animate={{ x: isPaid ? 20 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </span>
    </button>
  );
}