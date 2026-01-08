"use client";
import React from "react";
import { FaTachometerAlt } from "react-icons/fa";

export default function TableauDeBordRespNote() {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl px-8 py-10 w-full max-w-4xl animate-fade-in">
      <h2 className="flex items-center gap-3 text-2xl font-bold text-teal-900 mb-6">
        <FaTachometerAlt className="text-teal-700" /> Tableau de bord
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center">
          <span className="text-4xl font-extrabold text-teal-700">320</span>
          <span className="text-gray-500">Affectations</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-4xl font-extrabold text-orange-700">28</span>
          <span className="text-gray-500">Periodes de saisie de notes</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-4xl font-extrabold text-blue-700">15</span>
          <span className="text-gray-500">Notes</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-4xl font-extrabold text-purple-700">7</span>
          <span className="text-gray-500">Projets</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-4xl font-extrabold text-green-700">12</span>
          <span className="text-gray-500">Articles</span>
        </div>
      </div>
    </div>
  );
} 