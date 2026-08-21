import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { GridPlusBackground } from '../Grid';
import GlowButton from '../GlowButton';
import { orbitron, t012, nostromoLight, nostromoMedium} from "@/app/fonts";

const Sponsor = () => {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full"
            >
                <div className="h-full w-full">

                        <div className="h-full w-full flex flex-col items-center justify-center p-8 font-mono text-[#333]">
                            <div className="w-full max-w-6xl">
                                <header className="text-center mb-8">
                                    <h1 className={`font-sans uppercase font-extrabold text-4xl lg:text-6xl tracking-[8px] ${t012.className}`}>
                                        SPONSORS TRACK
                                    </h1>
                                    <h2 className={`font-sans font-medium text-xl lg:text-2xl tracking-[2px] mt-2 ${orbitron.className}`}>
                                        AI-Based Claims Image Assessment
                                    </h2>
                                </header>
                                <main className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
                                    <div className="lg:flex-1 flex justify-center">
                                        <div className="relative h-[300px] w-[300px] md:h-[350px] md:w-[350px] overflow-hidden rounded-full border-4 border-black bg-white">
                                            <Image
                                                src="/assets/sponsor_track2.png"
                                                alt="Robot and human collaborating over a brain diagram"
                                                layout="fill"
                                                objectFit="cover"
                                            />
                                        </div>
                                    </div>
                                    <div className="lg:flex-1 space-y-6 text-base md:text-lg">
                                        <p className={`${nostromoLight.className}`}>
                                            Develop an AI-based system to revolutionize insurance claims processing by automatically analyzing damage images for severity classification, cost estimation, and fraud detection.
                                        </p>
                                        <GlowButton 
                                            onClick={() => setShowModal(true)}
                                            className={`${nostromoMedium.className}`}
                                        >
                                            <span className="text-[clamp(0.875rem,2vw,1rem)] leading-none">
                                                KNOW MORE
                                            </span>
                                        </GlowButton>
                                    </div>
                                </main>
                            </div>
                        </div>
    
                </div>
            </motion.div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <GridPlusBackground>
                        <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
                        onClick={() => setShowModal(false)}
                    >
                        <GridPlusBackground>
                            <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto p-8 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                            >
                                ×
                            </button>
                            
                            <h2 className={`text-orange-500 font-sans font-bold text-2xl lg:text-3xl mb-6 ${orbitron.className}`}>
                                AI-Based Claims Image Assessment
                            </h2>
                            
                            <div className={`space-y-6 text-base md:text-lg text-gray-800 ${nostromoLight.className}`}>
                                <p>
                                    Insurance companies often rely on manual inspections of damage images—such as those from car accidents or property incidents—to assess claim validity and determine repair costs. This process can be slow, inconsistent, and prone to human error.
                                </p>
                                <p>
                                    Your task is to develop an AI-based system capable of analyzing uploaded damage images to:
                                </p>
                                <div className="space-y-3 pl-4">
                                    <p className="flex items-start">
                                        <span className="font-bold mr-3 text-black">&gt;</span>
                                        Classify the severity of the damages (e.g., minor, moderate, severe)
                                    </p>
                                    <p className="flex items-start">
                                        <span className="font-bold mr-3 text-black">&gt;</span>
                                        Estimate the corresponding repair costs based on visual damage features
                                    </p>
                                    <p className="flex items-start">
                                        <span className="font-bold mr-3 text-black">&gt;</span>
                                        Detect fraudulent or tampered images to prevent fraudulent claims
                                    </p>
                                </div>
                                <p>
                                    A significant challenge is to achieve these objectives with limited available training data, ensuring the system's accuracy and reliability. Your solution should aim to enhance the speed, consistency, and integrity of the damage assessment process in insurance claims.
                                </p>
                            </div>
                        </motion.div>
                        </GridPlusBackground>
                        
                    </motion.div>
                    </GridPlusBackground>
                    
                )}
            </AnimatePresence>
        </>
    );
};

export default Sponsor;
