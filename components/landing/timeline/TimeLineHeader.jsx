import { t012 } from "@/app/fonts";

const type12=t012

export const TimelineHeader = ({ isTimelineVisible }) => (
  <header
    className={`absolute top-0 left-0 right-0 z-20 flex flex-col sm:flex-row justify-between items-startp-4 sm:p-6 lg:p-8 gap-4 transition-transform duration-500 
    ${isTimelineVisible ? "translate-y-0" : "-translate-y-full"}`}>
    <h1
      className={`text-4xl sm:text-6xl lg:text-8xl xl:text-9xl font-bold tracking-[0.1em] sm:tracking-[0.2em] lg:tracking-[0.3em]  bg-black ${type12.className}`}
    >
      TIMELINE
    </h1>
  </header>
);
