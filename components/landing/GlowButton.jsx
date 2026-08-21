import React from "react";
import { twMerge } from "tailwind-merge";

const Corner = ({ className }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M20 4H10C6.68629 4 4 6.68629 4 10V20"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function GlowButton({ onClick, className, children, ...props }) {
  const defaultClasses = `
    relative px-10 py-3 bg-[#141312] text-gray-200 font-bold text-lg rounded-lg
    border-2 border-orange-500
    shadow-[0_0_30px_10px_rgba(249,115,22,0.9)]
    hover:bg-orange-500 hover:text-black transition duration-300
  `;

  const mergedClasses = twMerge(defaultClasses, className);

  return (
    <button
      type="button"
      onClick={onClick}
      className={mergedClasses}
      {...props}
      data-sound-hover
      data-sound-click
    >
      {children}
      <Corner className="absolute top-1 left-1 text-orange-500" />
      <Corner className="absolute top-1 right-1 text-orange-500 transform rotate-90" />
      <Corner className="absolute bottom-1 right-1 text-orange-500 transform rotate-180" />
      <Corner className="absolute bottom-1 left-1 text-orange-500 transform -rotate-90" />
    </button>
  );
}
