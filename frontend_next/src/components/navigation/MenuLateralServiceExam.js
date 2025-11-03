"use client";
import PeriodeActive from "@/features/service-examen/cours/periodeActive";

import { CheckCircle, AlertTriangle } from "lucide-react";

export default function MenuLateralServiceExam() {
  const periodeActive = PeriodeActive();

  return (
    <div className="w-64 h-full bg-gradient-to-b from-white to-gray-50 shadow-lg rounded-xl p-6 mt-30">
      <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
        📌 Statut de la période de saisie
      </h2>

      {periodeActive ? (
        <div className="flex flex-col items-center text-green-600">
          <CheckCircle className="w-10 h-10 mb-2" />
          <p className="text-base font-semibold">Période active</p>
          <p className="text-sm text-gray-600 mt-1">
            Vous pouvez saisir ou modifier les notes actuellement.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center text-yellow-600">
          <AlertTriangle className="w-10 h-10 mb-2" />
          <p className="text-base font-semibold">Aucune période active</p>
          <p className="text-sm text-gray-600 mt-1">
            La saisie n’est pas autorisée pour le moment. Veuillez réessayer plus tard.
          </p>
        </div>
      )}
    </div>
  );
}
