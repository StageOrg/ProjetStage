"use client";
import { ChevronRight } from "lucide-react";

export default function CardItem({ title, count, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex justify-between items-center p-4 bg-white shadow-md hover:shadow-lg transition-shadow rounded-2xl cursor-pointer mb-3"
    >
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-gray-500 text-sm">{count} élément(s)</p>
      </div>
      <ChevronRight size={22} className="text-gray-600" />
    </div>
  );
}
