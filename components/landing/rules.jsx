"use client";
import React from "react";
import { t012,nostromoMedium } from "@/app/fonts";
import { motion } from "framer-motion";

const Rules = () => {
  const rules = [
    "Tickets must be presented at the venue entrance via the BookSeat mobile app or a printed confirmation.",
    "All sales are final. Refunds or exchanges are only provided in the event of cancellation or rescheduling by the organizer.",
    "Age restrictions vary by event. Please bring valid government-issued ID if an event is age-restricted (e.g., 18+ or 21+).",
    "Latecomers may not be admitted until a suitable break in the performance, subject to venue management.",
    "The resale of tickets above face value is strictly prohibited and may result in immediate ticket cancellation.",
    "By purchasing a ticket, you agree to abide by the rules and regulations of the specific event venue.",
    "BookSeat is not responsible for lost, stolen, or damaged personal property at the venue.",
    "In the event of a cancellation, refunds will be processed automatically to the original payment method within 7-10 business days."
  ];

  return (
    <section id="rules">
      {/* Added pb-16 for extra padding at the bottom */}
      <div className="w-full max-w-6xl mx-auto p-6 sm:p-8 md:p-12 pb-12">
        {/* RULES in Type12 */}
        <motion.h1
          className={`${t012.className} text-center text-4xl sm:text-5xl md:text-7xl tracking-widest font-bold mt-12`}
          style={{ color: "#000" }}
          initial={{ opacity: 0, y: -40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: false }} 
        >
          RULES
        </motion.h1>

        <ul className={`${nostromoMedium.className} text-black list-none p-0 m-0 flex flex-col gap-4 md:gap-6 mt-20 pb-10 mb-24`}>
          {rules.map((rule, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: false, amount: 0.2 }} // 👈 replay on revisit/scroll
              className="text-base sm:text-lg md:text-xl"
            >
              • {rule}
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Rules;
