"use client";

import { useState, useRef, useEffect } from "react";
import { useScroll } from "framer-motion";

import Hero from "../components/landing/hero/Hero";
import Footer from "../components/landing/Footer";
import Tracks from "../components/landing/Track";
import Coc from "../components/landing/coc.jsx";
import Rules from "../components/landing/rules.jsx";
import Border from "../components/landing/Border";
import { ruigslay, nostromoLight, nostromoMedium } from "./fonts";
import WhyUs from "../components/landing/about/WhyUs";
import AboutBookSeat from "../components/landing/about/AboutBookSeat";
import { GridPlusBackground } from "../components/landing/Grid";
import Marquee from "../components/landing/Marquee";

function MainContent({ fontClassNames }: { fontClassNames?: any }) {
	const [isFlipping, setIsFlipping] = useState(false);
	const [isMounted, setIsMounted] = useState(false);

	const containerRef = useRef(null);

	const assetPaths = [
		"/assets/p1.svg",
		"/assets/bookseat_pic.jpg",
		"/assets/bookseat_logo.jpg",
		"/assets/why_us_pic.jpg",
		"/assets/why_us_logo.jpg",
		"/assets/X.svg",
	];

	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ["start start", "end end"],
	});

	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		if (!isMounted) return;
		return scrollYProgress.onChange((latest: number) => {
			setIsFlipping(latest > 0.5);
		});
	}, [scrollYProgress, isMounted]);

	return (
		<Border {...fontClassNames} isTimelineVisible={false}>
			<Hero {...fontClassNames} isVisible={true} />
			<Marquee />

			<GridPlusBackground>
				{/* Scroll container for flipping effect */}
				<div ref={containerRef} className="overflow-x-hidden">
					<div className="h-[15vh] md:h-[25vh]" />
					<AboutBookSeat isFlipping={isFlipping} />
					<div className="h-[15vh] md:h-[25vh]" />
					<WhyUs isFlipping={isFlipping} />
					<div className="h-[15vh] md:h-[25vh]" />
				</div>

				<Tracks />

				<>
					<Coc />
					<Rules />
					<Footer />
				</>
			</GridPlusBackground>
		</Border>
	);
}

export default function Home() {
	const fontClassNames = {
		ruigslayClassName: ruigslay.className,
		nostromoLightClassName: nostromoLight.className,
		nostromoMediumClassName: nostromoMedium.className,
	};

	return (
		<main className="relative bg-[#D5D1BE] text-white">
			<MainContent fontClassNames={fontClassNames} />
		</main>
	);
}
