"use client";

import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";
import GlowButton from "../GlowButton.jsx";
import { orbitron, nostromoMedium } from "@/app/fonts";

const HeroContent = ({ ruigslayClassName, handVariants, leftHandVariants }) => {
  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center">
      {/* Sponsor presents text */}
      <div
        className={`flex items-center justify-center px-8 text-center
              gap-x-[clamp(0.6rem,1.8vw,0.9rem)] 
              text-[clamp(1.05rem,3vw,1.5rem)] 
              mb-4 ${orbitron.className} text-black`}
      >
        <span>Never miss a seat. Book it before it's gone.</span>
      </div>

      <h1
        className={`text-[clamp(3.5rem,10vw,10rem)] leading-none relative z-20 mx-auto text-black ${ruigslayClassName}`}
      >
        BookSeat
      </h1>

      {/* Register Button */}
      <a
        href="/auth/choose-role"
        rel="noopener noreferrer"
        className=" inline-block pt-3 z-20 group"
      >
        <GlowButton className={` ${nostromoMedium.className}`}>
          <span className="text-[clamp(1rem,2.5vw,1.125rem)] leading-none">
            SIGN IN / SIGN UP
          </span>
        </GlowButton>
      </a>

      {/* Illustrations */}
      <motion.div
        className="absolute -top-10 right-0 w-48 h-48 md:-top-16 md:-right-12 md:w-[28rem] md:h-[28rem] z-50 pointer-events-none"
        variants={handVariants}
      >
        <Image
          src="/assets/hero/top_right_hand.svg"
          alt="Illustration of a hand reaching down"
          width={720}
          height={360}
          className="w-full h-full"
        />
      </motion.div>

      <motion.div
        className="absolute -bottom-10 left-0 w-48 h-48 md:-bottom-16 md:-left-20 md:w-[28rem] md:h-[28rem] z-50 pointer-events-none overflow-clip"
        variants={leftHandVariants}
      >
        <Image
          src="/assets/hero/bottom_left_hand.svg"
          alt="Illustration of a hand reaching up"
          width={720}
          height={360}
          className="w-full h-full"
        />
      </motion.div>
    </div>
  );
};

export default HeroContent;
