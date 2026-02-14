"use client";

import { Menu, X } from "lucide-react";

export default function MobileMenuToggle({ isOpen, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="md:hidden fixed top-4 left-4 z-50 bg-blue-900 text-white p-3 rounded-lg shadow-lg hover:bg-blue-800 transition-all"
      aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
    >
      {isOpen ? <X size={24} /> : <Menu size={24} />}
    </button>
  );
}