"use client";

import { motion } from "framer-motion";
import { t012, nostromoLight, nostromoMedium } from "@/app/fonts";
import Sponsor from "./Sponsor";
import { tracksData } from "./data";

const TracksMobile = () => {
  return (
    <div>
      <div className="pt-16 pb-8 text-center">
        <h2
          className={`text-5xl font-black tracking-widest text-black ${t012.className}`}
        >
          FEATURES
        </h2>
      </div>
      <div className="w-full pt-8 pb-16">
        <div className="px-4 space-y-12">
          {tracksData.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="rounded-lg shadow-lg overflow-hidden border-4 border-black"
              style={{ backgroundColor: "#D5D1BE" }}
            >
              <div className="aspect-square w-full p-6 flex items-center justify-center">
                <img
                  src={track.imageUrl}
                  alt={track.title}
                  className="w-48 h-48 object-contain overflow-hidden rounded-full border-4 border-black"
                />
              </div>
              <div className="p-6">
                <p
                  className={`font-bold text-black text-3xl mb-2 ${nostromoMedium.className}`}
                >
                  {track.id}
                </p>
                <p
                  className={`text-black/80 text-xl mb-4 ${nostromoLight.className}`}
                >
                  {track.title}
                </p>
                <p
                  className={`leading-relaxed text-black/70 text-base ${nostromoLight.className}`}
                >
                  {track.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TracksMobile;
