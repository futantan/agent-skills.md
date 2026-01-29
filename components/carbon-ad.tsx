"use client";

import { Card } from "@/components/ui/card";
import { useEffect, useRef } from "react";

export function CarbonAd() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adRef.current) {
      adRef.current.innerHTML = "";
      const script = document.createElement("script");
      script.id = "_carbonads_js";
      script.src =
        "//cdn.carbonads.com/carbon.js?serve=CWBDC2JU&placement=agent-skillsmd&format=cover";
      adRef.current.appendChild(script);
    }
  }, []);

  return (
    <div
      ref={adRef}
      className="print:hidden w-full flex items-center justify-center"
    />
  );
}

export function CarbonAdInCard() {
  return (
    <Card className="relative flex h-full items-center justify-center overflow-hidden border border-border/40 bg-card/50 backdrop-blur-sm transition-all hover:border-border hover:bg-card hover:shadow-lg hover:shadow-primary/5">
      <CarbonAd />
    </Card>
  );
}
