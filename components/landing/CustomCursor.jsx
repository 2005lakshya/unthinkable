"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function CustomCursor() {
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [isHovering, setIsHovering] = useState(false);
	const [isTouchDevice, setIsTouchDevice] = useState(false);

	useEffect(() => {
		// Detect touch devices and skip rendering the custom cursor there
		const touchDetected = () => {
			return (
				typeof window !== "undefined" &&
				("ontouchstart" in window ||
					navigator.maxTouchPoints > 0 ||
					window.matchMedia("(hover: none)").matches)
			);
		};
		// Initial hint from capability checks
		setIsTouchDevice(touchDetected());

		// Confirm at runtime: if the user actually touches, mark as touch device.
		// Conversely, if we see a real mousemove first on hybrids, keep cursor enabled.
		const onFirstTouch = () => {
			setIsTouchDevice(true);
			window.removeEventListener("touchstart", onFirstTouch);
			window.removeEventListener("mousemove", onFirstMouseMove);
		};

		const onFirstMouseMove = () => {
			// user used a mouse — treat as non-touch for now
			setIsTouchDevice(false);
			window.removeEventListener("mousemove", onFirstMouseMove);
			window.removeEventListener("touchstart", onFirstTouch);
		};

		window.addEventListener("touchstart", onFirstTouch, { passive: true });
		window.addEventListener("mousemove", onFirstMouseMove, { passive: true });

		const moveHandler = (e) => {
			setPosition({ x: e.clientX, y: e.clientY });
		};

		const hoverHandler = (e) => {
			const target = e.target;
			if (
				target.tagName === "A" ||
				target.tagName === "BUTTON" ||
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.getAttribute("role") === "button"
			) {
				setIsHovering(true);
			} else {
				setIsHovering(false);
			}
		};

		window.addEventListener("mousemove", moveHandler);
		window.addEventListener("mouseover", hoverHandler);

		// also update detection on resize/orientation change
		const resizeHandler = () => setIsTouchDevice(touchDetected());
		window.addEventListener("resize", resizeHandler);

		return () => {
			window.removeEventListener("mousemove", moveHandler);
			window.removeEventListener("mouseover", hoverHandler);
			window.removeEventListener("resize", resizeHandler);
			window.removeEventListener("touchstart", onFirstTouch);
			window.removeEventListener("mousemove", onFirstMouseMove);
		};
	}, []);

	if (isTouchDevice) return null;

	return (
		<motion.div
			className="fixed top-0 left-0 rounded-full pointer-events-none z-[9999]"
			animate={{
				x: position.x - (isHovering ? 18 : 12),
				y: position.y - (isHovering ? 18 : 12),
				width: isHovering ? 40 : 24,
				height: isHovering ? 40 : 24,
				backgroundColor: isHovering ? "transparent" : "#f97316", // orange-500
				border: isHovering ? "2px solid black" : "none",
			}}
			transition={{ type: "tween", duration: 0, ease: "linear" }}
		/>
	);
}
