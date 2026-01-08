"use client";

import { Search } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Rechercher...",
  className = "",
}) {
  return (
    <div
      className={`flex items-center border rounded px-3 py-2 bg-white ${className}`}
    >
      <Search className="w-4 h-4 text-gray-500 mr-2" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="outline-none bg-transparent flex-grow text-sm"
      />
    </div>
  );
}
