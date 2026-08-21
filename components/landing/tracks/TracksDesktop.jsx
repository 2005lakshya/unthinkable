"use client";

import { useState, useRef, useEffect } from "react";
import {
	motion,
	useScroll,
	useTransform,
	AnimatePresence,
} from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { t012, nostromoLight, nostromoMedium } from "@/app/fonts";
import Sponsor from "./Sponsor";
import { tracksData } from "./data";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const TracksDesktop = () => {
	const titleRef = useRef(null);
	const tracksContainerRef = useRef(null);

	useEffect(() => {
		// Animate title on load
		gsap.fromTo(
			titleRef.current,
			{
				opacity: 0,
				y: 50,
			},
			{
				opacity: 1,
				y: 0,
				duration: 1,
				ease: "power2.out",
			}
		);

		// Animate each track card on scroll
		const trackCards =
			tracksContainerRef.current.querySelectorAll(".track-card");
		const createdTriggers = [];

		trackCards.forEach((card, index) => {
			const isEven = index % 2 === 0;

			const anim = gsap.fromTo(
				card,
				{
					opacity: 0,
					x: isEven ? -100 : 100,
					y: 50,
				},
				{
					opacity: 1,
					x: 0,
					y: 0,
					duration: 0.8,
					ease: "power2.out",
					scrollTrigger: {
						trigger: card,
						start: "top 80%",
						end: "bottom 20%",
						toggleActions: "play none none reverse",
					},
				}
			);
			if (anim && anim.scrollTrigger) createdTriggers.push(anim.scrollTrigger);

			// Animate image circle with a slight delay
			const imageCircle = card.querySelector(".image-circle");
			const animImg = gsap.fromTo(
				imageCircle,
				{
					scale: 0.8,
					opacity: 0,
				},
				{
					scale: 1,
					opacity: 1,
					duration: 0.6,
					delay: 0.2,
					ease: "back.out(1.7)",
					scrollTrigger: {
						trigger: card,
						start: "top 80%",
						end: "bottom 20%",
						toggleActions: "play none none reverse",
					},
				}
			);
			if (animImg && animImg.scrollTrigger)
				createdTriggers.push(animImg.scrollTrigger);

			// Animate content with stagger effect
			const contentElements = card.querySelectorAll(".content-element");
			const animContent = gsap.fromTo(
				contentElements,
				{
					opacity: 0,
					y: 30,
				},
				{
					opacity: 1,
					y: 0,
					duration: 0.6,
					stagger: 0.1,
					delay: 0.3,
					ease: "power2.out",
					scrollTrigger: {
						trigger: card,
						start: "top 80%",
						end: "bottom 20%",
						toggleActions: "play none none reverse",
					},
				}
			);
			if (animContent && animContent.scrollTrigger)
				createdTriggers.push(animContent.scrollTrigger);
		});

		// Cleanup function - only kill triggers created by this component
		return () => {
			createdTriggers.forEach((t) => t && t.kill && t.kill());
		};
	}, []);

	return (
		<div>
			<div className="pt-16 sm:pt-20 text-center">
				<h2
					ref={titleRef}
					className={`text-5xl sm:text-6xl lg:text-8xl font-black tracking-widest text-black ${t012.className}`}
				>
					FEATURES
				</h2>
			</div>

			<div className="w-full py-16">
				<div
					ref={tracksContainerRef}
					className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12"
				>
					{tracksData.map((track, index) => {
						const isCardEven = index % 2 === 0;

						return (
							<div
								key={track.id}
								className={`track-card flex items-center gap-8 lg:gap-16 mb-16 lg:mb-24 ${
									isCardEven ? "flex-row" : "flex-row-reverse"
								}`}
							>
								{/* Image Circle */}
								<div className="flex-shrink-0">
									<div
										className="image-circle w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-full border-4 border-black"
										style={{
											backgroundImage: `url(${track.imageUrl})`,
											backgroundSize: "contain",
											backgroundPosition: "center",
											backgroundColor: "rgb(218,184,157)",
											backgroundRepeat: "no-repeat",
										}}
									/>
								</div>

								{/* Content */}
								<div
									className={`flex-1 ${
										isCardEven ? "text-left" : "text-right"
									}`}
								>
									<p
										className={`content-element font-bold text-black text-4xl lg:text-6xl xl:text-7xl ${nostromoMedium.className}`}
									>
										{track.id}
									</p>

									<p
										className={`content-element text-black/70 mt-2 text-base lg:text-xl xl:text-2xl ${nostromoMedium.className}`}
									>
										{track.title}
									</p>

									<p
										className={`content-element leading-relaxed text-black/60 mt-4 text-sm lg:text-base xl:text-lg ${nostromoLight.className}`}
									>
										{track.description}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default TracksDesktop;
