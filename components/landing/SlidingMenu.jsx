"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useBorder } from "./Border";
import DecryptingText from "./DecryptingText";
import UserButton from "./UserButton";

import { orbitron, nostromoMedium, nostromoLight, gulimche } from "@/app/fonts";

const SlidingMenu = () => {
  const { isMenuOpen, setIsMenuOpen } = useBorder();
  const menuRef = useRef(null);
  const [animatingIndex, setAnimatingIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const handleMouseEnterDecrypt = (index) => {
    setAnimatingIndex(index);
    setTimeout(() => {
      setAnimatingIndex(null);
    }, 300);
  };

  const handleClose = () => {
    setIsMenuOpen(false);
  };

  // Effect to handle body scroll lock when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const menuOptions = [
    { name: "Home", href: "#hero" },
    { name: "About BookSeat", href: "#about-bookseat" },
    { name: "Who Are We?", href: "#who-are-we" },
    { name: "Tracks", href: "#tracks" },
    { name: "FAQ", href: "#faq" },
    { name: "Guidelines", href: "#coc" },
    { name: "Rules", href: "#rules" },
    { name: "Register", href: "#register" },
  ];

  return (
    <div
      ref={menuRef}
      className={`fixed inset-0 z-50 transform transition-transform duration-500 ease-in-out ${
        isMenuOpen ? "translate-x-0" : "translate-x-full"
      } bg-black/80 backdrop-blur-md`}
    >
      <div className="relative w-full h-full grid grid-cols-1 md:grid-cols-3 grid-rows-3 p-4 md:p-0">
        {/* Mobile Layout Header - Only UserButton and Close */}
        <div className="col-span-1 row-start-1 px-4 py-4 flex md:hidden justify-end items-start">
          <div className="flex top-0 items-center gap-3">
            <UserButton />
            <button
              onClick={handleClose}
              className={`${nostromoLight.className} text-[#F5B37F] text-sm hover:text-white`}
            >
              CLOSE
            </button>
          </div>
        </div>

        {/* Desktop Top Right - Only UserButton and Close */}
        <div className="col-start-3 row-start-1 px-10 py-8 hidden md:flex justify-end items-start">
          <div className="flex items-center gap-3">
            <UserButton />
            <button
              onClick={handleClose}
              className={`${nostromoLight.className} text-[#F5B37F] text-sm hover:text-white`}
            >
              CLOSE
            </button>
          </div>
        </div>

        {/* Menu Items - Center on mobile, specific position on desktop */}
        <div className="col-span-1 md:col-start-2 row-start-2 flex flex-col items-center justify-center space-y-3 h-full px-4">
          {menuOptions.map((option, index) => (
            <a
              key={index}
              href={option.href}
              className="text-[#F5B37F] hover:text-white transition-colors flex items-center w-full justify-center md:justify-start"
              style={{ fontSize: "clamp(1rem, 4vw, 2rem)" }}
              onClick={handleClose}
              onMouseEnter={() => {
                handleMouseEnterDecrypt(index);
                setHoveredIndex(index);
              }}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <motion.span
                className={`${nostromoLight.className} text-xs md:text-sm lg:text-md`}
                animate={{
                  scale: hoveredIndex === index ? 0 : 1,
                  opacity: hoveredIndex === index ? 0 : 1,
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {String(index + 1).padStart(2, "0")}.
              </motion.span>

              {animatingIndex === index ? (
                <DecryptingText
                  targetText={option.name}
                  start={true}
                  isComplete={false}
                  className={`${nostromoMedium.className} mx-2 md:mx-4 pointer-events-none`}
                />
              ) : (
                <span
                  className={`${nostromoMedium.className} mx-2 md:mx-4 text-center md:text-left`}
                >
                  {option.name}
                </span>
              )}

              <motion.span
                className={`${nostromoLight.className} text-xs md:text-sm lg:text-md`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: hoveredIndex === index ? 1 : 0,
                  opacity: hoveredIndex === index ? 1 : 0,
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                .{String(index + 1).padStart(2, "0")}
              </motion.span>
            </a>
          ))}
        </div>

        {/* Desktop Bottom Left Legal Info */}
        <div className="col-start-1 row-start-3 px-10 py-8 hidden md:flex justify-start items-end">
          <div>
            <p className={`${gulimche.className} text-[#EA8244] text-sm`}>
              LEGAL:
            </p>
            <p className={`${gulimche.className} text-[#EA8244] text-sm`}>
              ©2025-2026
            </p>
          </div>
        </div>

        {/* Mobile Footer */}
        <div className="col-span-1 row-start-3 px-4 py-4 flex md:hidden justify-center items-end">
          <div className="text-center">
            <p className={`${gulimche.className} text-[#EA8244] text-xs`}>
              LEGAL: ©2025-2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlidingMenu;
