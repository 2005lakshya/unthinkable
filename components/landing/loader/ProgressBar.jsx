import React, { useState, useEffect } from "react";

const ProgressBar = ({ progress, loadingText }) => {
  const [animatedProgress, setAnimatedProgress] = useState("00.00");
  const [finalProgress, setFinalProgress] = useState(0);

  useEffect(() => {
    setFinalProgress((p) => (progress > p ? progress : p));
  }, [progress]);

  useEffect(() => {
    if (finalProgress < 100) {
      const decimals = Math.floor(Math.random() * 90 + 10);
      setAnimatedProgress(
        `${Math.floor(finalProgress).toFixed(0).padStart(2, "0")}.${decimals}`
      );
    } else {
      setAnimatedProgress("100.00");
    }
  }, [finalProgress]);

  return (
    <div className="border-2 border-[#E86100] p-8 mb-8 relative bg-[#141312] bg-opacity-50 w-full">
      <div className="text-center relative bg-[#141312] px-2 mx-auto w-fit -top-5">
        <span className="text-[#E86100] font-orbitron text-sm">
          {loadingText}
        </span>
      </div>

      <div className="mb-4 relative">
        <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-[#E86100]"></div>
        <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-[#E86100]"></div>
        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-[#E86100]"></div>
        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-[#E86100]"></div>

        <div className="border border-[#E86100] h-6 relative overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#E86100] to-[#E86100] transition-all duration-100 ease-linear relative"
            style={{ width: `${finalProgress >= 100 ? 100 : finalProgress}%` }}
          >
            <div className="absolute right-0 top-0 w-2 h-full bg-[#E86100] animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <span className="text-[#E86100] text-lg tracking-widest font-orbitron">
          {animatedProgress}%
        </span>
      </div>
    </div>
  );
};

export default ProgressBar;
