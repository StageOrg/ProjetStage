"use client";

import { useEffect, useState } from "react";
import HeroSlider from "@/components/ui/DiaporamaImg.js"; 
import Footer from "@/components/ui/Footer.js";
import FenetreInformation from "@/components/ui/FenetreInformation.js";

export default function Home() {
  const [infoVisible, setInfoVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="font-sans mt-0 relative">
      <HeroSlider />

      {/* Fenêtre d'information */}
      <FenetreInformation
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
      />

      <Footer />
    </div>
  );
}
