import React, { useState, useEffect, useRef } from "react";
import { day1Events, day2Events } from "./timeline/data";
import TimelineGrid from "./timeline/TimeLineGrid";
import EventCard from "./timeline/EventCard";

import {TimelineHeader} from "./timeline/TimeLineHeader";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const HorizontalTimeline = ({ events }) => {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const tlRef = useRef(null); // Store reference to timeline
  const [isMobile, setIsMobile] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile touch handlers
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < events.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Mobile animation
  useEffect(() => {
    if (isMobile && wrapperRef.current) {
      gsap.to(wrapperRef.current, {
        x: -currentIndex * window.innerWidth,
        duration: 0.5,
        ease: "power2.out"
      });
    }
  }, [currentIndex, isMobile]);

  // Desktop ScrollTrigger animation
  useEffect(() => {
    if (isMobile) return;

    const container = containerRef.current;
    const wrapper = wrapperRef.current;

    if (!container || !wrapper) return;

    // Reset transforms
    gsap.set(wrapper, { x: 0 });

    const tl = gsap.to(wrapper, {
      x: () => -(wrapper.scrollWidth - window.innerWidth),
      ease: "none",
      scrollTrigger: {
        trigger: container,
        pin: true,
        scrub: 2,
        anticipatePin: 1,
        end: () => `+=${wrapper.scrollWidth - window.innerWidth}`,
        refreshPriority: -1,
        // Force refresh on mobile orientation change
        onRefresh: () => {
          if (window.innerWidth <= 768 && tlRef.current) {
            tlRef.current.scrollTrigger?.kill();
            tlRef.current.kill();
          }
        }
      }
    });

    // Store reference to timeline
    tlRef.current = tl;

    const refresh = () => {
      // Kill ScrollTrigger on mobile
      if (window.innerWidth <= 768) {
        if (tlRef.current) {
          tlRef.current.scrollTrigger?.kill();
          tlRef.current.kill();
          tlRef.current = null;
        }
        return;
      }
      ScrollTrigger.refresh();
    };

    window.addEventListener("resize", refresh);
    window.addEventListener("orientationchange", refresh);

    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("orientationchange", refresh);
      if (tlRef.current) {
        tlRef.current.scrollTrigger?.kill();
        tlRef.current.kill();
        tlRef.current = null;
      }
    };
  }, [events.length, isMobile]);

  // Mobile render
  if (isMobile) {
    return (
      <div className="relative w-full h-screen overflow-hidden">
        <div
          ref={wrapperRef}
          className="timeline-wrapper flex h-full items-center justify-center"
          style={{ width: `${events.length * 100}vw` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {events.map((event, index) => (
            <div key={event.id} className="w-screen flex-shrink-0 flex items-center justify-center px-8">
              <div className="w-full max-w-sm">
                <EventCard event={event} />
              </div>
            </div>
          ))}
        </div>
        
        {/* Mobile navigation arrows at bottom */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-6 z-10">
          <button
            onClick={() => setCurrentIndex(currentIndex - 1)}
            disabled={currentIndex === 0}
            className={`bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all ${
              currentIndex === 0 ? 'opacity-30' : 'opacity-100 hover:bg-white/30'
            }`}
          >
            ←
          </button>
          
          <button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            disabled={currentIndex === events.length - 1}
            className={`bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all ${
              currentIndex === events.length - 1 ? 'opacity-30' : 'opacity-100 hover:bg-white/30'
            }`}
          >
            →
          </button>
        </div>
      </div>
    );
  }

  // Desktop render
  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden">
      <div
        ref={wrapperRef}
        className="timeline-wrapper flex h-full gap-4"
        style={{ 
          width: 'max-content',
          minWidth: '100vw'
        }}
      >
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
};

// Main Timeline Component
const Timeline = () => {
  const [isTimelineVisible, setIsTimelineVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      setIsTimelineVisible(scrollY > windowHeight * 0.5);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <TimelineGrid>
      <TimelineHeader isTimelineVisible={isTimelineVisible} />
      <HorizontalTimeline events={day1Events} />
      <HorizontalTimeline events={day2Events} />
    </TimelineGrid>
  );
};

export default Timeline;
