"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import GlowButton from "./GlowButton.jsx";
import ScrambleText from "./ScrambleText.jsx";
import { ruigslay, nostromoMedium, poppins } from "@/app/fonts";
import {
  FaInstagram,
  FaGithub,
  FaLinkedin,
  FaYoutube,
  FaFacebook,
  FaEnvelope
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { motion } from "framer-motion";

const formatNum = (num) => num.toString().padStart(4, "0").split("");

export default function Footer() {
  const [soundOn, setSoundOn] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [footerVisible, setFooterVisible] = useState(false);
  const footerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCoords({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        setFooterVisible(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );
    if (footerRef.current) {
      observer.observe(footerRef.current);
    }
    return () => {
      if (footerRef.current) observer.unobserve(footerRef.current);
    };
  }, []);

  const handleToggleSound = () => setSoundOn(!soundOn);
  const handleToggleMenu = () => setMenuOpen(!menuOpen);

  const tokenizeCoords = (x, y) => {
    return ["X.", ...formatNum(x), "//", "Y.", ...formatNum(y)];
  };

  const animationStyles = `
    @keyframes fadeInFromBack {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-main-content {
      animation: fadeInFromBack 1.2s ease-out forwards;
      opacity: 0;
    }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `;

  return (
    <section
      id="register"
      className="relative bg-black text-white font-sans"
      // --- STYLE RESTORED HERE ---

      ref={footerRef}
    >
      <style>{animationStyles}</style>
      <div className="absolute inset-0 grid grid-cols-12 gap-8 p-8 opacity-50">
        {Array.from({ length: 96 }, (_, index) => (
          <div key={index} className="flex items-center justify-center">
            <motion.div
              className="text-sm font-light select-none"
              style={{ color: "#ea8244" }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 8 + (index % 3) * 2,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              +
            </motion.div>
          </div>
        ))}
      </div>
      <div className="relative w-full min-h-screen p-4">
        {/* Your original border and notch structure */}
        <div
          className="absolute inset-0"
          style={{
            clipPath:
              "polygon(0% 30px, 30px 0%, calc(100% - 30px) 0%, 100% 30px, 100% calc(100% - 30px), calc(100% - 30px) 100%, 30px 100%, 0% calc(100% - 30px))",
          }}
        ></div>
        <div className="absolute top-0 left-0 w-[30px] h-[30px] bg-black"></div>
        <div className="absolute top-0 right-0 w-[30px] h-[30px] bg-black"></div>
        <div className="absolute bottom-0 left-0 w-[30px] h-[30px] bg-black"></div>
        <div className="absolute bottom-0 right-0 w-[30px] h-[30px] bg-black"></div>

        <div
          className="relative w-full h-full flex flex-col items-center justify-start pt-16 hide-scrollbar overflow-y-auto"
          style={{
            minHeight: "calc(100vh - 2rem)",
            clipPath:
              "polygon(0% 30px, 30px 0%, calc(100% - 30px) 0%, 100% 30px, 100% calc(100% - 30px), calc(100% - 30px) 100%, 30px 100%, 0% calc(100% - 30px))",
          }}
        >
          <div
            className={footerVisible ? "animate-main-content w-full" : "w-full"}
          >
            <main className="flex flex-col items-center justify-center text-center px-4 sm:px-6 py-20">
              <ScrambleText
                key={footerVisible ? "visible" : "hidden"}
                as="h1"
                text="BookSeat"
                className={`text-7xl sm:text-8xl md:text-[11rem] text-orange-500 ${ruigslay.className}`}
              />
              <h2 className={`text-2xl md:text-4xl font-bold mt-6 text-orange-500 ${nostromoMedium.className}`}>
                HAVEN’T REGISTERED YET?
              </h2>
              <p className={`mt-4 text-xl md:text-3xl text-[#D5D1BE] ${poppins.className}`}>
                What are you waiting for?
              </p>

              <div className="mt-10 mb-8">
                <a
                  href="/auth/choose-role"
                  rel="noopener noreferrer"
                >
                  <GlowButton className={nostromoMedium.className}>
                    SIGN IN / SIGN UP
                  </GlowButton>
                </a>
              </div>
            </main>

            <footer className="bg-[#d6d1c4] text-black py-8 md:py-12 px-6 md:px-20 relative rounded-t-3xl">
              <div className="w-full mx-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left">
                <div className="flex flex-col items-center md:items-start">
                  <Image
                    src="/assets/bookseat_logo.jpg"
                    alt="BookSeat Logo"
                    width={100}
                    height={100}
                  />
                  <p
                    className={`mt-4 text-sm md:text-base leading-relaxed ${poppins.className}`}
                  >
                    VIT, VELLORE CAMPUS <br /> VELLORE - 632014 <br />{" "}
                    TAMILNADU, INDIA
                  </p>
                  <p className={`mt-4 text-xs ${poppins.className}`}>
                    © 2025 BookSeat Platform
                  </p>
                </div>
                <div className="mt-8 md:mt-0 flex flex-col items-center">
                  <div className="flex space-x-4 mb-10">
                    <a
                      href="#"
                      className="w-9 h-9 bg-black flex items-center justify-center text-white text-xl transition-all duration-300 hover:text-orange-400 hover:shadow-[0_0_15px_rgba(245,179,127,0.8)]"
                    >
                      <FaInstagram />
                    </a>
                    <a
                      href="#"
                      className="w-9 h-9 bg-black flex items-center justify-center text-white text-xl transition-all duration-300 hover:text-orange-400 hover:shadow-[0_0_15px_rgba(245,179,127,0.8)]"
                    >
                      <FaXTwitter />
                    </a>
                    <a
                      href="#"
                      className="w-9 h-9 bg-black flex items-center justify-center text-white text-xl transition-all duration-300 hover:text-orange-400 hover:shadow-[0_0_15px_rgba(245,179,127,0.8)]"
                    >
                      <FaGithub />
                    </a>
                    <a
                      href="#"
                      className="w-9 h-9 bg-black flex items-center justify-center text-white text-xl transition-all duration-300 hover:text-orange-400 hover:shadow-[0_0_15px_rgba(245,179,127,0.8)]"
                    >
                      <FaLinkedin />
                    </a>
                    <a
                      href="#"
                      className="w-9 h-9 bg-black flex items-center justify-center text-white text-xl transition-all duration-300 hover:text-orange-400 hover:shadow-[0_0_15px_rgba(245,179,127,0.8)]"
                    >
                      <FaYoutube />
                    </a>
                    <a
                      href="#"
                      className="w-9 h-9 bg-black flex items-center justify-center text-white text-xl transition-all duration-300 hover:text-orange-400 hover:shadow-[0_0_15px_rgba(245,179,127,0.8)]"
                    >
                      <FaEnvelope />
                    </a>
                    <a
                      href="#"
                      className="w-9 h-9 bg-black flex items-center justify-center text-white text-xl transition-all duration-300 hover:text-orange-400 hover:shadow-[0_0_15px_rgba(245,179,127,0.8)]"
                    >
                      <FaFacebook />
                    </a>
                  </div>

                  <a href="#">
                    <GlowButton className={nostromoMedium.className}>
                      LET’S CONNECT!
                    </GlowButton>
                  </a>
                </div>

              </div>
            </footer>
          </div>
        </div>
      </div>
    </section>
  );
}
