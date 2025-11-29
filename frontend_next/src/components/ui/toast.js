"use client";

import React, { createContext, useContext, useState } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const show = (type, message, title = "", duration = 5000) => {
    setToast({ type, message, title, duration });
    if (duration > 0) setTimeout(() => setToast(null), duration);
  };

  const value = {
    success: (msg, title = "Succès") => show("success", msg, title),
    error: (msg, title = "Erreur") => show("error", msg, title, 7000),
    warning: (msg, title = "Attention") => show("warning", msg, title),
    info: (msg, title = "Info") => show("info", msg, title),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* TOAST AU MILIEU – SUPERBE */}
      {toast && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
          <div className="animate-in fade-in zoom-in-95 duration-300 pointer-events-auto">
            <div className={`flex items-center gap-4 px-8 py-5 rounded-2xl shadow-2xl text-white min-w-[380px] max-w-lg backdrop-blur-lg border border-white/20
              ${toast.type === "success" ? "bg-gradient-to-r from-green-600 to-emerald-600" : ""}
              ${toast.type === "error" ? "bg-gradient-to-r from-red-600 to-rose-600" : ""}
              ${toast.type === "warning" ? "bg-gradient-to-r from-orange-500 to-amber-600" : ""}
              ${toast.type === "info" ? "bg-gradient-to-r from-blue-600 to-cyan-600" : ""}
            `}>
              <span className="text-3xl">
                {toast.type === "success" && "✓"}
                {toast.type === "error" && "✕"}
                {toast.type === "warning" && "⚠"}
                {toast.type === "info" && "ℹ"}
              </span>
              <div className="flex-1">
                {toast.title && <div className="font-bold text-lg">{toast.title}</div>}
                <div className="text-sm opacity-95">{toast.message}</div>
              </div>
              <button onClick={() => setToast(null)} className="ml-4 text-white/70 hover:text-white text-xl">
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast doit être dans ToastProvider");
  return context;
};