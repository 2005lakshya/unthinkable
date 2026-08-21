"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { orbitron, poppins, t012 } from "@/app/fonts";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1,
    },
  },
};

const titleVariants = {
  hidden: {
    opacity: 0,
    y: -30,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const sectionVariants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const faqItemVariants = {
  hidden: {
    opacity: 0,
    x: -20,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

export default function FaqSection() {
  return (
    <section id="faq" className="relative w-full">
      <motion.div
        className="relative max-w-6xl w-full mx-auto px-6 z-10"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* Title */}
        <motion.h2
          className={`text-6xl sm:text-7xl lg:text-9xl text-center font-black tracking-widest text-black mb-12 ${t012.className}`}
          variants={titleVariants}
        >
          FAQ
        </motion.h2>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Side */}
          <div className="space-y-10">
            {/* General Information */}
            <motion.div variants={sectionVariants}>
              <motion.h2
                className={`text-center text-[28px] font-bold text-black mb-6 ${orbitron.className}`}
                variants={faqItemVariants}
              >
                GENERAL INFORMATION
              </motion.h2>
              <motion.div className="space-y-4" variants={containerVariants}>
                <FaqItem question="What is the maximum team size?" answer="Each team can have up to 4 members. Cross-domain and cross-expertise teams are highly encouraged." />
                <FaqItem question="What is BookSeat?" answer="BookSeat is a modern ticket booking platform with a real-time visual seat map." />
                <FaqItem question="How does the 10-minute hold work?" answer="When you select a seat, it is locked for 10 minutes to prevent double bookings while you check out." />
              </motion.div>
            </motion.div>

            {/* Participation & Teams */}
            <motion.div variants={sectionVariants}>
              <motion.h2
                className={`text-center text-[28px] font-bold text-black mb-6 ${orbitron.className}`}
                variants={faqItemVariants}
              >
                PARTICIPATION & TEAMS
              </motion.h2>
              <motion.div className="space-y-4" variants={containerVariants}>
                <FaqItem question="What is the Smart Waitlist?" answer="If a show is sold out, you can join the waitlist. When someone cancels, seats are automatically assigned to waitlisted users." />
                <FaqItem question="Are tickets refundable?" answer="Yes, you can cancel tickets up to 24 hours before the show." />
                <FaqItem question="Is there customer support?" answer="Yes. We have 24/7 customer support available to guide you." />
              </motion.div>
            </motion.div>
          </div>

          {/* Right Side */}
          <div className="space-y-10">
            {/* Logistics & Requirements */}
            <motion.div variants={sectionVariants}>
              <motion.h2
                className={`text-center text-[28px] font-bold text-black mb-6 ${orbitron.className}`}
                variants={faqItemVariants}
              >
                LOGISTICS & REQUIREMENTS
              </motion.h2>
              <motion.div className="space-y-4" variants={containerVariants}>
                <FaqItem question="What kind of projects are expected?" answer="Projects can be software or hardware-based, aligned with the theme. They should aim to solve real-world problems and will be judged on creativity, usability, technical execution, and impact." />
                <FaqItem question="Will you provide any hardware components?" answer="No. Participants must bring their own hardware components if required. Basic facilities like power and Wi-Fi will be provided." />
                <FaqItem question="What should I bring with me?" answer="Laptop and charger, mobile phone and accessories, any additional hardware/sensors needed for your project, extension cords, adapters, and personal essentials." />
                <FaqItem question="Is travel reimbursement provided?" answer="No. Participants must cover their own travel and accommodation costs." />
                <FaqItem question="Do I need to install any tools beforehand?" answer="Not mandatory, but we recommend setting up your preferred development tools and environments beforehand to save time." />
                <FaqItem question="Is internet/Wi-Fi provided?" answer="Yes. Stable Wi-Fi will be available throughout the venue. However, we recommend carrying a mobile hotspot as a backup." />
              </motion.div>
            </motion.div>

            {/* External Participants */}
            <motion.div variants={sectionVariants}>
              <motion.h2
                className={`text-center text-[28px] font-bold text-black mb-6 ${orbitron.className}`}
                variants={faqItemVariants}
              >
                EXTERNAL PARTICIPANTS
              </motion.h2>
              <motion.div className="space-y-4" variants={containerVariants}>
                <FaqItem question="Do I need to carry my college ID card?" answer="Yes. A valid college ID card is mandatory for verification at check-in. Without it, entry will not be permitted." />
                <FaqItem question="Can I book for a large group?" answer="Yes. You can select up to 10 adjacent seats in one transaction." />
                <FaqItem question="How do I get my ticket?" answer="You will receive an email with a QR code ticket instantly after checkout." />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
      <div className="h-20"></div>
    </section>
  );
}

function FaqItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef(null);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <motion.div
      className="border border-gray-700 rounded-lg overflow-hidden"
      variants={faqItemVariants}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.button
        onClick={toggleOpen}
        className={`w-full text-left ${
          poppins.className
        } cursor-pointer px-3 py-2 text-base font-medium faq-no-arrow focus:outline-none transition-colors duration-300 ${
          isOpen ? "bg-[#D5D1BE] text-black" : "bg-[#2B1E1E] text-white"
        }`}
        style={{ listStyle: "none" }}
        aria-expanded={isOpen}
        whileHover={{
          backgroundColor: isOpen ? "#C8C4B1" : "#3A2A2A",
          color: isOpen ? "#000000" : "#ffffff",
        }}
      >
        {question}
      </motion.button>
      <motion.div
        ref={contentRef}
        className={`overflow-hidden ${
          isOpen ? "bg-[#332015] text-white" : "bg-[#f5f5f5] text-black"
        }`}
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
      >
        <motion.div
          className={`px-4 py-3 ${poppins.className} text-sm`}
          initial={{ y: -10 }}
          animate={{ y: isOpen ? 0 : -10 }}
          transition={{ duration: 0.2, delay: isOpen ? 0.1 : 0 }}
        >
          {answer}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
