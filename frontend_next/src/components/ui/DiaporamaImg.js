"use client";

import { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

const slides = [
  {
    image: "/images/epl.jpg",
    title: "Bienvenue à l'EPL ! \n École d'ingénieurs au service de l'excellence",
    description: "",
    link: "/en-savoir-plus",
  },
  {
    image: "/images/epl.jpg",
    title: "L'avenir de l'ingénierie Togolaise commence ici",
    description: "",
    link: "/en-savoir-plus",
  },
  {
    image: "/images/epl.jpg",
    title: "L'EPL, un tremplin vers l'avenir",
    description: "",
    link: "/en-savoir-plus",
  },
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[700px] w-full overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
                      <Image
                    src={slide.image}
              alt={slide.title}
              fill
              style={{ objectFit: "cover" }}
              className="rounded-none"
              priority={index === 0}
            />

          {/* Couche bleu foncé en overlay */}
          <div className="absolute inset-0 bg-black/60"></div>

          {/* SVG bulles décoratives */}
          <div className="absolute inset-0 z-20 pointer-events-none opacity-30">
            <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10%" cy="20%" r="30" fill="white" opacity="0.5" />
              <circle cx="80%" cy="30%" r="40" fill="white" opacity="0.5" />
              <circle cx="50%" cy="80%" r="100" fill="white" opacity="0.5" />
              <circle cx="70%" cy="60%" r="100" fill="white" opacity="0.75" />
              <circle cx="25%" cy="75%" r="100" fill="white" opacity="0.5" />
            </svg>
          </div>

          {/* Contenu centré */}
          <div className="absolute inset-0 flex items-center justify-center text-white px-6 z-30">
            <div className="flex items-center gap-10 bg-transparent p-6">
              {/* Colonne gauche */}
              <div className="text-right">
                <h2 className="text-3xl lg:text-4xl font-bold max-w-md">
                  {slide.title}
                </h2>
              </div>

              {/* Barre verticale */}
              <div className="w-[3px] h-50 bg-white opacity-100"></div>

              {/* Colonne droite */}
              <div className="text-left">
                <Link href={slide.link}>
                  <span className="inline-block bg-orange-600 px-5 py-2 rounded hover:bg-blue-600 transition font-semibold">
                    En savoir plus
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Boutons de navigation */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-transparent text-white p-3 rounded-full shadow-lg hover:bg-blue-900 transition z-40 border border-white"
      >
        <FaChevronLeft className="text-4xl" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-transparent text-white p-3 rounded-full shadow-lg hover:bg-blue-900 transition z-40 border border-white"
      >
        <FaChevronRight className="text-4xl" />
      </button>
    </div>
  );
}
