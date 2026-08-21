"use client";

import React, { useState } from "react";
import LoadingScreen from "./loader/Loading";
import Hero from "./Hero";

export default function HeroLayout() {
  // `isAppLoading` controls the visibility and mounting of the LoadingScreen's content.
  const [isAppLoading, setIsAppLoading] = useState(true);

  // `isHeroVisible` mounts the Hero component once loading is done.
  const [isHeroVisible, setIsHeroVisible] = useState(false);

  const handleLoadingComplete = () => {
    // 1. Loading is done. Mount the Hero component immediately.
    // It will be rendered underneath the still-visible loading screen.
    setIsHeroVisible(true);

    // 2. Wait a brief moment for React to render the Hero,
    // then trigger the fade-out of the loading screen.
    setTimeout(() => {
      setIsAppLoading(false);
    }, 100); // 100ms is enough time for the Hero to be ready.
  };

  return (
    <div>
      {/* The Hero component is only mounted after loading is complete */}
      {isHeroVisible && <Hero isVisible={true} />}

      {/* This container controls the fade-out transition */}
      <div
        className={`
          fixed top-0 left-0 w-full h-full z-50 
          transition-opacity duration-1000 ease-in-out
          ${isAppLoading ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
      >
        {/* The content of the loading screen is only present while loading */}
        {isAppLoading && (
          <LoadingScreen
            onCompletion={handleLoadingComplete}
            assetPaths={[]} // Pass your asset paths here
          />
        )}
      </div>
    </div>
  );
}
