"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import ProgressBar from "./ProgressBar";
import AnimatedLines from "./AnimatedLines";
import { orbitron, nostromoMedium, gulimche } from "@/app/fonts";

const LoadingScreen = ({ onCompletion, assetPaths, isFadingOut }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("// SYSTEM LOADING");
  const [showDate, setShowDate] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    const progressDuration = 1500;
    const totalDuration = 3000;
    let progressInterval;

    const startTime = Date.now();
    progressInterval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const currentProgress = (elapsedTime / progressDuration) * 100;

      if (currentProgress >= 100) {
        setProgress(100);
        clearInterval(progressInterval);
      } else {
        setProgress(currentProgress);
      }
    }, 50);

    const assetsLoadedPromise = new Promise((resolve) => {
      if (assetPaths.length === 0) {
        resolve();
        return;
      }
      const imagePromises = assetPaths.map((src) => {
        return new Promise((resolveImage) => {
          const img = new window.Image();
          img.src = src;
          img.onload = () => {
            resolveImage();
          };
          img.onerror = () => {
            console.warn(`Could not load asset: ${src}`);
            resolveImage();
          };
        });
      });
      Promise.all(imagePromises).then(resolve);
    });

    const minTimePromise = new Promise((resolve) => {
      setTimeout(resolve, totalDuration);
    });

    Promise.all([assetsLoadedPromise, minTimePromise]).then(() => {
      clearInterval(progressInterval);
      setProgress(100);
      setLoadingText("ACCESS GRANTED");
      setLoadingComplete(true);
      onCompletion();
    });

    return () => {
      clearInterval(progressInterval);
    };
  }, [onCompletion, assetPaths]);

  useEffect(() => {
    if (progress >= 10) {
      setShowDate(true);
    }
  }, [progress]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div
      className={`min-h-screen bg-black flex items-center justify-center fixed inset-0 z-60 overflow-hidden transition-opacity duration-1000 ${
        orbitron.className
      } ${
        isFadingOut ? "opacity-0 bg-black pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Top Section: Texts and Images */}
      <div className="absolute top-0 left-0 w-full h-full z-10">
        {/* VINNOVATEIT SYS VER. text */}
        <div className="absolute top-2 left-0 w-full pt-2 pl-4 text-left">
          {" "}
          {/* Adjusted top and pt */}
          <p className={`${gulimche.className} text-sm text-[#EA8244]`}>
            {" "}
            {/* Changed color to EA8244 */}
            TICKET BOOKING SYS VER. 22::23.09.2025 ♪
          </p>
        </div>

        {/* Topmost Image */}
        <div className="hidden md:block absolute top-10 left-1/2 transform -translate-x-1/2 w-full z-0">
          {" "}
          {/* Adjusted top */}
          <Image
            src="/assets/loader/loading-topmost.png"
            alt="Topmost Decoration"
            width={1920}
            height={400}
            className="w-full object-cover"
          />
        </div>

        {/* STATUS CHECK text */}
        <div className="absolute top-10 left-0 w-full pl-4 text-left">
          {" "}
          {/* Adjusted top, removed pt-4 */}
          <p className={`${gulimche.className} text-sm text-[#EA8244] mt-2`}>
            {" "}
            {/* Changed color to EA8244 */}
            STATUS CHECK.................OK ♪
          </p>
        </div>

        {/* Top Image */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-full flex justify-center z-0">
          {" "}
          {/* Adjusted top */}
          <div className="w-full md:w-3/4">
            <Image
              src="/assets/loader/loading-top.png"
              alt="Top Decoration"
              width={1440}
              height={300}
              className="w-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-2xl w-full px-8 flex flex-col items-center justify-center">
        {/* WARNING text */}
        <p
          className={`${nostromoMedium.className} text-2xl text-[#E86100] mb-2 py-2 px-4`}
        >
          WARNING
        </p>
        <ProgressBar progress={progress} loadingText={loadingText} />

        {/* New central text */}
        <div className="text-center bottom-0 h-14 flex flex-col items-center justify-center">
          <p className={`${gulimche.className} text-2xl text-[#E86100]`}>
            ♪ &lt;BOOKSEAT INITIATED&gt;
          </p>
          <p className={`${gulimche.className} text-lg text-[#E86100]`}>
            MISSION: BUILD THE FUTURE IN 36 HOURS ♪
          </p>
        </div>
      </div>

      {/* Bottom Section: Flipped Images and Wave */}
      <div className="absolute bottom-0 left-0 w-full h-full z-0">
        {/* Flipped Topmost Image (now bottom-most) */}
        <div className="hidden md:block absolute bottom-0 left-1/2 transform -translate-x-1/2 scale-y-[-1] w-full">
          {" "}
          {/* Adjusted bottom */}
          <Image
            src="/assets/loader/loading-topmost.png"
            alt="Flipped Topmost Decoration"
            width={1920}
            height={400}
            className="w-full object-cover"
          />
        </div>

        {/* Animated Lines between images */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
          {" "}
          {/* Adjusted bottom */}
          <AnimatedLines />
        </div>

        {/* Flipped Top Image (now above topmost) */}
        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 scale-y-[-1] w-full flex justify-center">
          {" "}
          {/* Adjusted bottom */}
          <div className="w-full md:w-3/4">
            <Image
              src="/assets/loader/loading-top.png"
              alt="Flipped Top Decoration"
              width={1440}
              height={300}
              className="w-full object-cover"
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .fade-in {
          animation: fadeIn 1s ease-in-out forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
