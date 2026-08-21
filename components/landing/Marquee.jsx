import React, { useEffect, useRef } from "react";
import { orbitron, ruigslay } from "@/app/fonts";

const NewMarquee = () => {
  const topMarqueeRef = useRef(null);
  const bottomMarqueeRef = useRef(null);

  useEffect(() => {
    const topMarquee = topMarqueeRef.current;
    const bottomMarquee = bottomMarqueeRef.current;

    if (!topMarquee || !bottomMarquee) return;

    // Clone content for seamless loop
    const topContent = topMarquee.innerHTML;
    const bottomContent = bottomMarquee.innerHTML;

    topMarquee.innerHTML = topContent + topContent;
    bottomMarquee.innerHTML = bottomContent + bottomContent;

    let topPosition = 0;
    let bottomPosition = 0;
    const speed = 1; // pixels per frame

    const animate = () => {
      // Top marquee - scroll left
      topPosition -= speed;
      if (topPosition <= -topMarquee.scrollWidth / 2) {
        topPosition = 0;
      }
      topMarquee.style.transform = `translateX(${topPosition}px)`;

      // Bottom marquee - scroll right
      bottomPosition += speed;
      if (bottomPosition >= bottomMarquee.scrollWidth / 2) {
        bottomPosition = 0;
      }
      bottomMarquee.style.transform = `translateX(-${
        bottomMarquee.scrollWidth / 2 - bottomPosition
      }px)`;

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <div className="relative w-full h-32 sm:h-48 md:h-56 lg:h-64 overflow-hidden z-10 mb-[-1rem] sm:mb-[-1.5rem] md:mb-[-2rem] lg:mb-[-4rem]">
      {/* Top marquee */}
      <div className="absolute w-[120%] h-16 sm:h-20 md:h-28 lg:h-32 bg-[#EF6400] transform -rotate-3 top-2 sm:top-3 md:top-4 lg:top-4 -left-10 flex items-center overflow-hidden z-20">
        <div ref={topMarqueeRef} className="flex whitespace-nowrap">
          <p
            className={`${orbitron.className} text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-[#D5D1BE] inline-flex items-center`}
          >
            BookSeat <span className="mx-2 sm:mx-3 md:mx-4">&middot;</span>
            BookSeat <span className="mx-2 sm:mx-3 md:mx-4">&middot;</span>
            BookSeat <span className="mx-2 sm:mx-3 md:mx-4">&middot;</span>
            BookSeat <span className="mx-2 sm:mx-3 md:mx-4">&middot;</span>
            BookSeat <span className="mx-2 sm:mx-3 md:mx-4">&middot;</span>
            BookSeat <span className="mx-2 sm:mx-3 md:mx-4">&middot;</span>
            BookSeat <span className="mx-2 sm:mx-3 md:mx-4">&middot;</span>
            BookSeat <span className="mx-2 sm:mx-3 md:mx-4">&middot;</span>
          </p>
        </div>
      </div>

      {/* Bottom marquee */}
      <div className="absolute w-[120%] h-12 sm:h-16 md:h-20 lg:h-24 bg-[#D5D1BE] transform rotate-2 bottom-2 sm:bottom-3 md:bottom-4 lg:bottom-4 -left-10 flex items-center overflow-hidden z-20 border-4 border-black">
        <div ref={bottomMarqueeRef} className="flex whitespace-nowrap">
          <p
            className={`${ruigslay.className} text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-[#EF6400] inline-flex items-center`}
          >
            BookSeat <span className="mx-2 sm:mx-3 md:mx-4">&middot;</span>
            BookSeat <span className="mx-2 sm:mx-3 md:mx-4">&middot;</span>
            BookSeat <span className="mx-2 sm:mx-3 md:mx-4">&middot;</span>
            BookSeat <span className="mx-2 sm:mx-3 md:mx-4">&middot;</span>
            BookSeat <span className="mx-2 sm:mx-3 md:mx-4">&middot;</span>
            BookSeat <span className="mx-2 sm:mx-3 md:mx-4">&middot;</span>
            BookSeat <span className="mx-2 sm:mx-3 md:mx-4">&middot;</span>
            BookSeat <span className="mx-2 sm:mx-3 md:mx-4">&middot;</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewMarquee;
