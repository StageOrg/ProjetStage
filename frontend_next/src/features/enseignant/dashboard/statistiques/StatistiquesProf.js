"use client";
import React from "react";
import { FaChartBar } from "react-icons/fa";

export default function StatistiquesProf() {
  return (
    <div className="bg-transparent backdrop-blur-md  px-8 py-10 w-full animate-fade-in">
      <h2 className="flex items-center gap-3 text-2xl font-bold text-orange-900 mb-6">
        <FaChartBar className="text-orange-700" /> Statistiques
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10">
        <div className="flex flex-col items-center">
          <span className="text-4xl font-extrabold text-orange-700">4</span>
          <span className="text-gray-500">Cours</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-4xl font-extrabold text-green-700">2</span>
          <span className="text-gray-500">Projets encadrés</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-4xl font-extrabold text-blue-500">3</span>
          <span className="text-gray-500">Articles publiés</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-4xl font-extrabold text-purple-700">5</span>
          <span className="text-gray-500">Étudiants encadrés</span>
        </div>
      </div>
      <div className="mt-10">
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div className="bg-orange-600 h-4 rounded-full" style={{ width: "70%" }}></div>
        </div>
        <div className="text-right text-sm text-gray-500 mt-1">Progression : 70%</div>
      </div>
    </div>
  );
} 