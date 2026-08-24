"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ruigslay, nostromoMedium, t012 } from "@/app/fonts";
import { GridPlusBackground } from "@/components/landing/Grid";

export default function ChooseRolePage() {
  return (
    <main className="min-h-screen w-full bg-[#D5D1BE] relative overflow-hidden">
      <GridPlusBackground>
        <div className="flex flex-col items-center justify-center min-h-screen w-full px-4 z-10 relative">
          
          <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-20">
            <Link href="/" className="flex items-center gap-2 text-black hover:text-[#EF6400] font-bold transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
              <span>Home</span>
            </Link>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-4xl md:text-6xl text-black font-black mb-12 text-center ${t012.className}`}
          >
            SELECT YOUR ROLE
          </motion.h1>

          <div className="flex flex-col sm:flex-row gap-8 w-full max-w-2xl justify-center items-center">
            {/* Customer Option */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="w-full sm:w-1/2"
            >
              <Link href="/auth/sign-in?role=customer" className="w-full block group">
                <div className="border-4 border-black bg-[#D5D1BE] hover:bg-[#EF6400] transition-colors duration-300 p-8 flex flex-col items-center text-center cursor-pointer">
                  <h2 className={`text-3xl text-black group-hover:text-[#D5D1BE] mb-4 ${ruigslay.className}`}>Customer</h2>
                  <p className={`text-black/70 group-hover:text-[#D5D1BE]/80 ${nostromoMedium.className} text-sm`}>
                    Book tickets, manage your seats, and enjoy exclusive events.
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* Organiser Option */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full sm:w-1/2"
            >
              <Link href="/auth/sign-in?role=organiser" className="w-full block group">
                <div className="border-4 border-black bg-[#D5D1BE] hover:bg-[#EF6400] transition-colors duration-300 p-8 flex flex-col items-center text-center cursor-pointer">
                  <h2 className={`text-3xl text-black group-hover:text-[#D5D1BE] mb-4 ${ruigslay.className}`}>Organiser</h2>
                  <p className={`text-black/70 group-hover:text-[#D5D1BE]/80 ${nostromoMedium.className} text-sm`}>
                    Create events, manage seating, and track ticket sales.
                  </p>
                </div>
              </Link>
            </motion.div>
          </div>

          {/* Admin Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16"
          >
            <Link 
              href="/auth/sign-in?role=admin" 
              className={`text-black/60 hover:text-[#EF6400] transition-colors text-sm underline-offset-4 hover:underline cursor-pointer ${nostromoMedium.className}`}
            >
              For admin, click here
            </Link>
          </motion.div>
        </div>
      </GridPlusBackground>
    </main>
  );
}
