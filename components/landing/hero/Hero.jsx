"use client";

import React from "react";
import { motion } from "framer-motion";
import HeroContent from "./HeroContent";

const Hero = ({
  ruigslayClassName,
  nostromoLightClassName,
  orbitronClassName,
  nostromoMediumClassName,
}) => {
  // Animation variants for the hands
  const handVariants = {
    hidden: {
      opacity: 0,
      rotate: 12,
      x: "20%",
      y: "-5%",
    },
    visible: {
      opacity: 1,
      rotate: -30,
      x: "2.5%",
      y: "-0.75%",
      transition: {
        duration: 1,
        ease: [0.34, 1.56, 0.64, 1],
        delay: 0.5,
      },
    },
  };

  const leftHandVariants = {
    hidden: {
      opacity: 0,
      rotate: -12,
      x: "-20%",
      y: "5%",
    },
    visible: {
      opacity: 1,
      rotate: -30,
      x: "-2.5%",
      y: "0.75%",
      transition: {
        duration: 1,
        ease: [0.34, 1.56, 0.64, 1],
        delay: 0.6,
      },
    },
  };

  return (
    <motion.section
      id="hero"
      className="relative w-full h-screen mx-auto flex items-center justify-center overflow-hidden"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.3 }}
    >
      <HeroContent
        ruigslayClassName={ruigslayClassName}
        nostromoLightClassName={nostromoLightClassName}
        orbitronClassName={orbitronClassName}
        nostromoMediumClassName={nostromoMediumClassName}
        handVariants={handVariants}
        leftHandVariants={leftHandVariants}
      />
    </motion.section>
  );
};

export default Hero;
