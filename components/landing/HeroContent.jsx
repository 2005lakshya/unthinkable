"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { orbitron } from "@/app/fonts";
import UserButton from "./UserButton";

const HeroContent = ({
  isVisible,
  ruigslayClassName,
  nostromoLightClassName,
}) => {
  const { data: session } = useSession();

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center px-4 sm:px-6 md:px-8">
      {/* Login Button - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <UserButton />
      </div>

      {/* Sponsor presents text */}
      <div
        className={`flex items-center justify-center gap-x-2 sm:gap-x-3 text-sm sm:text-lg md:text-xl mb-2 sm:mb-4 ${orbitron.className} text-black`}
      >
        <img src="/assets/sponsor.png" alt="Sponsor" className="h-3 sm:h-4 md:h-5" />
        <span className="text-xs sm:text-base md:text-lg">presents</span>
      </div>

      <h1
        className={`text-responsive-hero leading-none relative z-20 mx-auto text-black text-center ${ruigslayClassName}`}
      >
        BookSeat
      </h1>

            {/* Register Button - Changes based on auth status */}
      {session ? (
        <a
          href="/api/auth/callback"
          className="relative inline-block w-[clamp(120px,25vw,280px)] aspect-[230/80] z-20 group mt-2 sm:mt-4"
        >
          <svg
            viewBox="0 0 286 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full transition-transform duration-150 group-hover:scale-95"
          >
            <path
              d="M7 1H278.999C282.313 1.00026 285 3.68673 285 7V92.2236C285 95.5374 282.314 98.2246 279 98.2246H7.00098C3.68724 98.2243 1.00004 95.5378 1 92.2246V7C1.00025 3.68641 3.68653 1 7 1Z"
              fill="#141312"
              stroke="#EA8244"
              strokeWidth="2"
            />
            <path
              d="M21.6797 65.0936C21.6797 64.4366 22.2034 63.9039 22.8603 63.9039C23.5173 63.9039 24.0589 64.4365 24.0589 65.0935C24.0589 67.5103 24.0589 69.9298 24.0589 72.3684C24.0589 76.2344 27.1928 79.3685 31.0588 79.3685C33.463 79.3685 35.8827 79.3685 38.3337 79.3685C38.9907 79.3685 39.5234 79.8922 39.5234 80.5492C39.5234 81.2061 38.9908 81.7477 38.3338 81.7477C35.129 81.7477 31.9205 81.7477 28.6798 81.7477C24.8138 81.7477 21.6797 78.6137 21.6797 74.7477C21.6797 71.5595 21.6797 68.3507 21.6797 65.0936Z"
              fill="#EA8244"
            />
            <path
              d="M21.6797 24.5103C21.6797 20.6443 24.8136 17.5103 28.6796 17.5103C31.8679 17.5103 35.0766 17.5103 38.3338 17.5103C38.9908 17.5103 39.5234 18.0339 39.5234 18.6909C39.5234 19.3479 38.9908 19.8894 38.3338 19.8894C35.917 19.8894 33.4975 19.8894 31.0589 19.8894C27.1929 19.8894 24.0589 23.0234 24.0589 26.8894C24.0589 29.2936 24.0589 31.7133 24.0589 34.1643C24.0589 34.8213 23.5352 35.354 22.8782 35.354C22.2212 35.354 21.6797 34.8214 21.6797 34.1644C21.6797 30.9595 21.6797 27.7511 21.6797 24.5103Z"
              fill="#EA8244"
            />
            <path
              d="M263.443 65.0936C263.443 64.4366 263.967 63.9039 264.624 63.9039C265.281 63.9039 265.822 64.4365 265.822 65.0935C265.822 68.2984 265.822 71.5068 265.822 74.7476C265.822 78.6136 262.688 81.7477 258.822 81.7477C255.634 81.7477 252.425 81.7477 249.168 81.7477C248.511 81.7477 247.979 81.224 247.979 80.567C247.979 79.91 248.511 79.3685 249.168 79.3685C251.585 79.3685 254.004 79.3685 256.443 79.3685C260.309 79.3685 263.443 76.2345 263.443 72.3685C263.443 69.9643 263.443 67.5446 263.443 65.0936Z"
              fill="#EA8244"
            />
            <path
              d="M247.979 18.7088C247.979 18.0518 248.511 17.5103 249.168 17.5103C252.373 17.5103 255.581 17.5103 258.822 17.5103C262.688 17.5103 265.822 20.6442 265.822 24.5102C265.822 27.6985 265.822 30.9072 265.822 34.1644C265.822 34.8213 265.299 35.354 264.642 35.354C263.985 35.354 263.443 34.8214 263.443 34.1644C263.443 31.7476 263.443 29.3281 263.443 26.8895C263.443 23.0235 260.309 19.8894 256.443 19.8894C254.039 19.8894 251.619 19.8894 249.168 19.8894C248.511 19.8894 247.979 19.3657 247.979 18.7088Z"
              fill="#EA8244"
            />
          </svg>
          <span
            className={`absolute inset-0 flex items-center justify-center text-[#E0D8C7] text-[clamp(0.6rem,2.2vw,1.3rem)] transition-transform duration-150 group-hover:scale-95 ${nostromoLightClassName}`}
          >
            CONTINUE
          </span>
        </a>
      ) : (
        <a
          href="https://gravitas.vit.ac.in/events/5fceeb67-a8ca-4ab9-9419-eb3f9b9d6b69"
          target="_blank"
          rel="noopener noreferrer"
          className="relative inline-block w-[clamp(120px,25vw,280px)] aspect-[230/80] z-20 group mt-2 sm:mt-4"
        >
          <svg
            viewBox="0 0 286 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full transition-transform duration-150 group-hover:scale-95"
          >
            <path
              d="M7 1H278.999C282.313 1.00026 285 3.68673 285 7V92.2236C285 95.5374 282.314 98.2246 279 98.2246H7.00098C3.68724 98.2243 1.00004 95.5378 1 92.2246V7C1.00025 3.68641 3.68653 1 7 1Z"
              fill="#141312"
              stroke="#EA8244"
              strokeWidth="2"
            />
            <path
              d="M21.6797 65.0936C21.6797 64.4366 22.2034 63.9039 22.8603 63.9039C23.5173 63.9039 24.0589 64.4365 24.0589 65.0935C24.0589 67.5103 24.0589 69.9298 24.0589 72.3684C24.0589 76.2344 27.1928 79.3685 31.0588 79.3685C33.463 79.3685 35.8827 79.3685 38.3337 79.3685C38.9907 79.3685 39.5234 79.8922 39.5234 80.5492C39.5234 81.2061 38.9908 81.7477 38.3338 81.7477C35.129 81.7477 31.9205 81.7477 28.6798 81.7477C24.8138 81.7477 21.6797 78.6137 21.6797 74.7477C21.6797 71.5595 21.6797 68.3507 21.6797 65.0936Z"
              fill="#EA8244"
            />
            <path
              d="M21.6797 24.5103C21.6797 20.6443 24.8136 17.5103 28.6796 17.5103C31.8679 17.5103 35.0766 17.5103 38.3338 17.5103C38.9908 17.5103 39.5234 18.0339 39.5234 18.6909C39.5234 19.3479 38.9908 19.8894 38.3338 19.8894C35.917 19.8894 33.4975 19.8894 31.0589 19.8894C27.1929 19.8894 24.0589 23.0234 24.0589 26.8894C24.0589 29.2936 24.0589 31.7133 24.0589 34.1643C24.0589 34.8213 23.5352 35.354 22.8782 35.354C22.2212 35.354 21.6797 34.8214 21.6797 34.1644C21.6797 30.9595 21.6797 27.7511 21.6797 24.5103Z"
              fill="#EA8244"
            />
            <path
              d="M263.443 65.0936C263.443 64.4366 263.967 63.9039 264.624 63.9039C265.281 63.9039 265.822 64.4365 265.822 65.0935C265.822 68.2984 265.822 71.5068 265.822 74.7476C265.822 78.6136 262.688 81.7477 258.822 81.7477C255.634 81.7477 252.425 81.7477 249.168 81.7477C248.511 81.7477 247.979 81.224 247.979 80.567C247.979 79.91 248.511 79.3685 249.168 79.3685C251.585 79.3685 254.004 79.3685 256.443 79.3685C260.309 79.3685 263.443 76.2345 263.443 72.3685C263.443 69.9643 263.443 67.5446 263.443 65.0936Z"
              fill="#EA8244"
            />
            <path
              d="M247.979 18.7088C247.979 18.0518 248.511 17.5103 249.168 17.5103C252.373 17.5103 255.581 17.5103 258.822 17.5103C262.688 17.5103 265.822 20.6442 265.822 24.5102C265.822 27.6985 265.822 30.9072 265.822 34.1644C265.822 34.8213 265.299 35.354 264.642 35.354C263.985 35.354 263.443 34.8214 263.443 34.1644C263.443 31.7476 263.443 29.3281 263.443 26.8895C263.443 23.0235 260.309 19.8894 256.443 19.8894C254.039 19.8894 251.619 19.8894 249.168 19.8894C248.511 19.8894 247.979 19.3657 247.979 18.7088Z"
              fill="#EA8244"
            />
          </svg>
          <span
            className={`absolute inset-0 flex items-center justify-center text-[#E0D8C7] text-[clamp(0.6rem,2.2vw,1.3rem)] transition-transform duration-150 group-hover:scale-95 ${nostromoLightClassName}`}
          >
            REGISTER NOW
          </span>
        </a>
      )}

      {/* Illustrations */}
      <div
        className={`absolute top-0 right-0 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 lg:w-128 lg:h-128 z-40 pointer-events-none transition-all duration-1000 ${
          isVisible
            ? "opacity-100 rotate-[-15deg] translate-x-6 -translate-y-6 sm:rotate-[-20deg] sm:translate-x-4 sm:-translate-y-4 md:rotate-[-30deg] md:translate-x-3 md:-translate-y-3 lg:rotate-0 lg:translate-x-0 lg:translate-y-0"
            : "opacity-0 translate-x-16 -translate-y-4 rotate-12"
        }`}
        style={{
          transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          transitionDelay: "500ms",
        }}
      >
        <img
          src="/assets/top_right_hand.svg"
          alt="Illustration of a hand reaching down"
          className="w-full h-full"
        />
      </div>

      <div
        className={`absolute bottom-0 left-0 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 lg:w-128 lg:h-128 z-40 pointer-events-none transition-all duration-1000 ${
          isVisible
            ? "opacity-100 rotate-[15deg] -translate-x-6 translate-y-6 sm:rotate-[20deg] sm:-translate-x-4 sm:translate-y-4 md:rotate-[30deg] md:-translate-x-3 md:translate-y-3 lg:rotate-0 lg:translate-x-0 lg:translate-y-0"
            : "opacity-0 -translate-x-16 translate-y-4 -rotate-12"
        }`}
        style={{
          transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          transitionDelay: "600ms",
        }}
      >
        <img
          src="/assets/bottom_left_hand.svg"
          alt="Illustration of a hand reaching up"
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default HeroContent;
