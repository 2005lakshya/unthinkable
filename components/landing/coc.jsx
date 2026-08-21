"use client";
import React from "react";
import { t012,nostromoMedium } from "@/app/fonts";
import { motion } from "framer-motion";

const Coc = () => {
  const rules = [
    "BookSeat is committed to providing a safe and enjoyable experience for all attendees. We expect all guests to behave respectfully towards artists, venue staff, and fellow audience members.",
    "Prohibited items typically include outside food and beverages, professional cameras, recording devices, and large bags. Please check the specific event page for venue-specific restrictions.",
    "Re-entry is not permitted at most venues once your ticket has been scanned. Please ensure you have everything you need before entering the event.",
    "If you experience any issues, require accessibility assistance, or feel unsafe during an event, please reach out immediately to the nearest venue security or staff member.",
    "TL;DR: Be respectful, follow venue policies, and enjoy the show. Any disruptive behavior may result in removal from the venue without a refund."
  ];

  return (
    <div id="coc" className="w-full max-w-6xl mx-auto p-6 sm:p-8 md:p-12 pb-16">
      {/* CODE OF CONDUCT in Type12 */}
      <motion.h1
      initial={{ opacity: 0, y: -40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: false }} 
        className={`${t012.className} text-center text-5xl sm:text-5xl md:text-7xl tracking-widest font-bold mt-16`}
        style={{
          color: "#000",
          lineHeight: 1.25,
          letterSpacing: "0.08em",
          wordSpacing: "0.5em",
        }}
      >
        GUIDELINES
      </motion.h1>

      {/* Rules list */}
      <ul className={`${nostromoMedium.className} text-black list-none p-0 m-0 flex flex-col gap-4 md:gap-6 mt-20 pb-10 mb-24`}>
        {rules.map((rule, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: false, amount: 0.2 }}
            className="text-base sm:text-lg md:text-xl"
          >
            • {rule}
          </motion.li>
        ))}
      </ul>
    </div>
  );
};

export default Coc;
