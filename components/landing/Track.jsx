"use client";

import { useEffect, useState } from "react";
import TracksMobile from "./tracks/TracksMobile";
import TracksDesktop from "./tracks/TracksDesktop";

const Tracks = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile ? <TracksMobile /> : <TracksDesktop />;
};

export default Tracks;
