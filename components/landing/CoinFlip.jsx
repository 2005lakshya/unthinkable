"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const CoinFlip = ({ frontImg, backImg }) => {
	const [isFlipping, setIsFlipping] = useState(false);

	const handleFlip = () => {
		setIsFlipping(prev => !prev);
	};

	const handleMouseMove = (e) => {
		// Only trigger on significant mouse movement to avoid excessive flipping
		const rect = e.currentTarget.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const mouseX = e.clientX;
		
		// Flip when mouse crosses the center point
		if (Math.abs(mouseX - centerX) < 20) {
			setIsFlipping(prev => !prev);
		}
	};

	return (
		<div 
			className="w-full h-full cursor-pointer" 
			style={{ perspective: 1000 }}
			onClick={handleFlip}
			onMouseMove={handleMouseMove}
		>
			<motion.div
				className="relative w-full h-full"
				style={{ transformStyle: "preserve-3d" }}
				animate={{ rotateY: isFlipping ? 180 : 0 }}
				transition={{ duration: 0.9, ease: "easeInOut" }}
			>
				{/* Front Face */}
				<div
					className="absolute w-full h-full bg-[#DAB89D] rounded-full border-4 lg:border-6 xl:border-8 border-black flex items-center justify-center overflow-hidden"
					style={{ backfaceVisibility: "hidden" }}
				>
					<Image
						src={frontImg}
						alt="Front Image"
						fill
						className="object-cover"
					/>
				</div>

				{/* Back Face */}
				<div
					className="absolute w-full h-full bg-[#DAB89D] rounded-full border-4 lg:border-6 xl:border-8 border-black flex items-center justify-center overflow-hidden"
					style={{
						backfaceVisibility: "hidden",
						transform: "rotateY(180deg)",
					}}
				>
					  <Image 
  src={backImg} 
  alt="Back Image" 
  width={500} 
  height={100} 
/>
				</div>
			</motion.div>
		</div>
	);
};

export default CoinFlip;
