"use client";

import { useEffect, useRef } from "react";

export function CarbonAd() {
  const reference = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reference.current) {
      reference.current.innerHTML = "";
      const script = document.createElement("script");
      script.id = "_carbonads_js";
      script.src =
        "//cdn.carbonads.com/carbon.js?serve=CWBDC2JU&placement=agent-skillsmd&format=cover";
      reference.current.appendChild(script);
    }
  }, []);

  return (
    <div className="mt-10 flex justify-center">
      <div ref={reference} className="print:hidden" />
    </div>
  );
}
