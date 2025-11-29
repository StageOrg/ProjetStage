"use client";

import { useState } from "react";
import HeroSlider from "@/components/ui/DiaporamaImg.js"; 
import Footer from "@/components/ui/Footer.js";
import FenetreInformation from "@/components/ui/FenetreInformation.js";

export default function Home() {
  const [infoVisible, setInfoVisible] = useState(true);

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
