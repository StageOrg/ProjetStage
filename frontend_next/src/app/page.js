"use client";

import HeroSlider from "@/components/ui/DiaporamaImg.js"; 
import Footer from "@/components/ui/Footer.js";

export default function Home() {
  return (
    <div className=" font-sans mt-0 ">
      
      {/* HeroSlider avec les images défilantes */}
      <HeroSlider />
       {/* footer de la page*/}
      <Footer />
    </div>
   

  );
}
