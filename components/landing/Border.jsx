"use client";

import React, {
  useState,
  createContext,
  useContext,
  useEffect,
  useRef,
} from "react";
import SlidingMenu from "./SlidingMenu";
import { DiscordIcon } from "./DiscordIcon";
const BorderContext = createContext();

export const useBorder = () => useContext(BorderContext);


const Notch = ({
  type,
  fontClassName,
  className,
  isVisible,
  notchColor,
  textColor,
}) => {
  const { soundOn, setSoundOn, isMenuOpen, setIsMenuOpen, coords } =
    useContext(BorderContext);

  const onToggle = (toggleType) => {
    if (toggleType === "sound") {
      setSoundOn((s) => !s);
    } else if (toggleType === "menu") {
      setIsMenuOpen((o) => !o);
    }
  };

  const [lines, setLines] = useState([]);
  const lineCount = 19;
  const animationFrameId = useRef(null);
  const transitionStartTime = useRef(null);
  const startLines = useRef([]);

  const staticLines = React.useMemo(() => {
    return [...Array(lineCount)].map((_, i) => {
      let height = 4;
      if (i >= 6 && i <= 12) {
        const centerIndex = 9;
        const distFromCenter = Math.abs(i - centerIndex);
        height = 6 + 6 * Math.max(0, 1 - distFromCenter / 4);
      }
      return { height };
    });
  }, []);

  useEffect(() => {
    if (type !== "sound") return;

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }

    if (soundOn) {
      let wavePhase = 0;
      const animateOn = () => {
        wavePhase += 0.15;
        const newLines = [...Array(lineCount)].map((_, i) => {
          if (i <= 1 || i >= 17) return { height: 4 };
          const centerIndex = 9;
          const distFromCenter = Math.abs(i - centerIndex);
          const wave1 = Math.sin(wavePhase - distFromCenter * 0.5);
          const wave2 = Math.sin(wavePhase * 0.5 + distFromCenter * 0.8);
          const bulgeFactor = 1 - distFromCenter / 8;
          const combinedWave = (wave1 + wave2) / 2;
          const minHeight = 6;
          const maxHeight = 16;
          const dynamicHeight =
            (maxHeight - minHeight) * ((combinedWave + 1) / 2);
          const height = minHeight + dynamicHeight * bulgeFactor;
          return { height };
        });
        setLines(newLines);
        animationFrameId.current = requestAnimationFrame(animateOn);
      };
      animateOn();
    } else {
      if (lines.length === 0) {
        setLines(staticLines);
        return;
      }
      startLines.current = lines;
      transitionStartTime.current = performance.now();
      const transitionDuration = 400;

      const animateOff = (now) => {
        const elapsedTime = now - transitionStartTime.current;
        const progress = Math.min(elapsedTime / transitionDuration, 1);
        const transitioningLines = startLines.current.map((startLine, i) => {
          const endHeight = staticLines[i].height;
          const startHeight = startLine.height;
          const height = startHeight + (endHeight - startHeight) * progress;
          return { height };
        });
        setLines(transitioningLines);
        if (progress < 1) {
          animationFrameId.current = requestAnimationFrame(animateOff);
        } else {
          setLines(staticLines);
        }
      };
      animationFrameId.current = requestAnimationFrame(animateOff);
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [soundOn, type, staticLines]);

  const tokenizeCoords = (x, y) => {
    const formatNum = (num) => num.toString().padStart(4, "0").split("");
    return ["X.", ...formatNum(x), "//", "Y.", ...formatNum(y)];
  };

  const tokens = coords ? tokenizeCoords(coords.x, coords.y) : [];
  const baseClasses = "fixed z-52 flex justify-center items-center";
  const textClasses = `text-xs md:text-sm tracking-widest transition-opacity ${fontClassName}`;

  const notchStyle = {
    backgroundColor: notchColor,
    transition: "background-color 0.5s ease-in-out",
  };

  const textStyle = {
    color: textColor,
    transition: "color 0.5s ease-in-out",
  };

  switch (type) {
    case "sound":
      return (
        <div className={`${baseClasses} ${className}`}>
          <div
            className={`${baseClasses} lg:top-4 sm:top-3 top-2 left-1/2 -translate-x-1/2 h-8 md:h-10 w-50 md:w-64`}
            style={{
              ...notchStyle,
              clipPath: "polygon(0 0, 100% 0, 85% 100%, 15% 100%)",
            }}
          >
            <div
              className="relative bottom-1 w-[95%] h-[80%] flex justify-center items-center"
              style={{
                backgroundColor: "#8F3C00",
                transition: "background-color 0.5s ease-in-out",
                clipPath: "polygon(3% 10%, 97% 10%, 86% 100%, 14% 100%)",
              }}
            >
              <button
                onClick={() => onToggle("sound")}
                data-sound-click
                className={`flex pt-1 items-center justify-center w-full h-full hover:opacity-80 ${textClasses}`}
                style={{ color: "#F5B37F" }}
                type="button"
              >
                <div className="flex items-center">
                  <div className="flex justify-center items-center w-20 h-[25px]">
                    {lines.map((line, i) => (
                      <div
                        key={i}
                        className="bg-[#E86100] mx-0.5"
                        style={{
                          width: `3px`,
                          height: `${line.height}px`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="w-12 text-left pl-2">
                    <span>[{soundOn ? "ON" : "OFF"}]</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      );
    case "menu":
      return (
        <div
          className={`${baseClasses} top-1/2 right-3 w-5 md:w-7 -translate-y-1/2 h-72`}
          style={{
            ...notchStyle,
            clipPath: "polygon(0 15%, 100% 0, 100% 100%, 0 85%)",
          }}
        >
          <button
            onClick={() => onToggle("menu")}
            data-sound-click
            data-sound-hover
            className={`${textClasses} flex flex-col items-center justify-center h-full w-full hover:opacity-70`}
            style={textStyle}
          >
            {(isMenuOpen ? "CLOSE" : "MENU").split("").map((char, i) => (
              <span
                key={i}
                className="leading-tight tracking-widest transition-opacity duration-300"
              >
                {char}
              </span>
            ))}
          </button>
        </div>
      );
    case "coords":
      return (
        <div
          className={`${baseClasses} top-1/2 left-3 w-5 md:w-7 -translate-y-1/2 h-72`}
          style={{
            ...notchStyle,
            clipPath: "polygon(0 0, 100% 15%, 100% 85%, 0 100%)",
          }}
        >
          <div
            className={`flex flex-col left-0.5 gap-y-0.5 items-start ${textClasses}`}
            style={textStyle}
          >
            {tokens.map((t, i) => (
              <span key={i} className="leading-tight">
                {t}
              </span>
            ))}
          </div>
        </div>
      );

    case "coords-right":
      return (
        <div
          className={`${baseClasses} top-1/2 right-3 w-5 md:w-7 -translate-y-1/2 h-72`}
          style={{
            ...notchStyle,
            clipPath: "polygon(0 15%, 100% 0, 100% 100%, 0 85%)",
          }}
        >
          <div
            className={`flex flex-col right-0.5 gap-y-0.5 items-end ${textClasses}`}
            style={textStyle}
          >
            {tokens.map((t, i) => (
              <span key={i} className="leading-tight">
                {t}
              </span>
            ))}
          </div>
        </div>
      );

    case "discord":
      return (
        <div
          className={`${baseClasses} lg:bottom-4 sm:bottom-3 bottom-2 left-1/2 -translate-x-1/2 h-8 md:h-10 w-40 rounded-t-xl flex flex-col items-center justify-center`}
          style={{
            ...notchStyle,
            clipPath: "polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)",
          }}
        >
          <a
            href="https://discord.gg/6Thxh6R5" // Replace with your Discord invite link
            target="_blank"
            rel="noopener noreferrer"
            data-sound-hover
            data-sound-click
            className={`${textClasses} hover:opacity-70 transition-opacity duration-300 flex flex-col items-center justify-center gap-1 pt-2`}
            style={textStyle}
          >
            <DiscordIcon 
              className="w-3 h-3 md:w-4 md:h-4" 
              style={textStyle}
            />
            <span className="text-xs">DISCORD</span>
          </a>
        </div>
      );

    default: 
      return null; 
  }
};

const Border = ({
  children,
  nostromoLightClassName,
  nostromoMediumClassName,
  isTimelineVisible,
}) => {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [soundOn, setSoundOn] = useState(true); // Changed from false to true
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [borderColor, setBorderColor] = useState("#000000");
  const [notchTextColor, setNotchTextColor] = useState("#F5B37F");

  const backgroundMusic = useRef(null);
  const hoverSound = useRef(null);
  const clickSound = useRef(null);
  const fadeInProcess = useRef(null);
  const fadeOutProcess = useRef(null);

  const backgroundMusicURL = "/assets/audio/background_music.mp3";
  const hoverSoundURL =
    "https://www.dropbox.com/scl/fi/llh0lafsdd02k4a89lg6m/hover-effect-dich.mp3?rlkey=xf5rn79uo9klimtnq1otxenvj&raw=1";
  const clickSoundURL =
    "https://www.dropbox.com/scl/fi/47gqhe6ilmfughe60u5m9/click-1-effect-dich.mp3?rlkey=czmv0eztgfi33zzbtsm3b6z7h&raw=1";

  const backgroundMusicVolume = 0.5;
  const hoverSoundVolume = 0.75;
  const clickSoundVolume = 0.75;

  useEffect(() => {
    setBorderColor(isTimelineVisible ? "#D5D1BE" : "#000000");
    setNotchTextColor(isTimelineVisible ? "#000000" : "#F5B37F");
  }, [isTimelineVisible]);

  const stopFadeProcesses = () => {
    if (fadeInProcess.current) clearInterval(fadeInProcess.current);
    if (fadeOutProcess.current) clearInterval(fadeOutProcess.current);
    fadeInProcess.current = null;
    fadeOutProcess.current = null;
  };

  useEffect(() => {
    backgroundMusic.current = new Audio(backgroundMusicURL);
    hoverSound.current = new Audio(hoverSoundURL);
    clickSound.current = new Audio(clickSoundURL);
    backgroundMusic.current.loop = true;

    return () => {
      stopFadeProcesses();
      backgroundMusic.current?.pause();
    };
  }, []);

  useEffect(() => {
    const duration = 250;
    const steps = 25;
    const interval = duration / steps;
    const stepSize = 1 / steps;

    stopFadeProcesses();

    if (soundOn) {
      if (backgroundMusic.current.paused) {
        backgroundMusic.current
          .play()
          .catch((e) => console.error("Audio play failed:", e));
      }

      let currentStep = 0;
      fadeInProcess.current = setInterval(() => {
        currentStep++;
        const progress = Math.min(currentStep * stepSize, 1);
        if (backgroundMusic.current)
          backgroundMusic.current.volume = progress * backgroundMusicVolume;
        if (hoverSound.current)
          hoverSound.current.volume = progress * hoverSoundVolume;
        if (clickSound.current)
          clickSound.current.volume = progress * clickSoundVolume;
        if (progress >= 1) {
          clearInterval(fadeInProcess.current);
          fadeInProcess.current = null;
        }
      }, interval);
    } else {
      if (!backgroundMusic.current) return;
      let currentVolume = backgroundMusic.current.volume;
      const stepAmount = currentVolume / steps;

      fadeOutProcess.current = setInterval(() => {
        currentVolume -= stepAmount;
        const progress = Math.max(currentVolume, 0);
        if (backgroundMusic.current) backgroundMusic.current.volume = progress;
        if (hoverSound.current) hoverSound.current.volume = progress;
        if (clickSound.current) clickSound.current.volume = progress;
        if (progress <= 0) {
          clearInterval(fadeOutProcess.current);
          fadeOutProcess.current = null;
          backgroundMusic.current.pause();
        }
      }, interval);
    }
  }, [soundOn]);

  const soundOnRef = useRef(soundOn);
  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  useEffect(() => {
    const handleMouseOver = (event) => {
      if (!soundOnRef.current) return;
      const target = event.target.closest("[data-sound-hover]");
      if (target && !target.hasAttribute("data-sound-playing")) {
        target.setAttribute("data-sound-playing", "true");
        hoverSound.current.currentTime = 0;
        hoverSound.current.play();
        target.addEventListener(
          "mouseleave",
          () => {
            target.removeAttribute("data-sound-playing");
          },
          { once: true }
        );
      }
    };

    const handleMouseClick = (event) => {
      if (!soundOnRef.current) return;
      if (event.target.closest("[data-sound-click]")) {
        clickSound.current.currentTime = 0;
        clickSound.current.play();
      }
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("click", handleMouseClick);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("click", handleMouseClick);
    };
  }, []);

  const borderStyle = {
    backgroundColor: borderColor,
    transition: "background-color 0.5s ease-in-out",
  };

  const cornerNotchSize = "12px";

  return (
    <BorderContext.Provider
      value={{ soundOn, setSoundOn, isMenuOpen, setIsMenuOpen, coords }}
    >
      <div
        onMouseMove={(e) => setCoords({ x: e.clientX, y: e.clientY })}
        className="relative w-full h-full"
      >
        <div
          className="fixed top-0 left-0 w-full lg:h-5 sm:h-4 h-3 z-52 pointer-events-none"
          style={borderStyle}
        ></div>
        <div
          className="fixed bottom-0 left-0 w-full lg:h-5 sm:h-4 h-3 z-52 pointer-events-none"
          style={borderStyle}
        ></div>
        <div
          className="fixed top-0 left-0 lg:w-5 sm:w-4 w-3 h-full z-52 pointer-events-none"
          style={borderStyle}
        ></div>
        <div
          className="fixed top-0 right-0 lg:w-5 sm:w-4 w-3 h-full z-52 pointer-events-none"
          style={borderStyle}
        ></div>

        <div
          className="fixed lg:top-5 sm:top-4 top-3 lg:left-5 sm:left-4 left-3 w-0 h-0 z-52 pointer-events-none"
          style={{
            borderTop: `${cornerNotchSize} solid ${borderColor}`,
            borderRight: `${cornerNotchSize} solid transparent`,
            transition: "border-top-color 0.5s ease-in-out",
          }}
        />
        <div
          className="fixed lg:top-5 sm:top-4 top-3 lg:right-5 sm:right-4 right-3 w-0 h-0 z-52 pointer-events-none"
          style={{
            borderTop: `${cornerNotchSize} solid ${borderColor}`,
            borderLeft: `${cornerNotchSize} solid transparent`,
            transition: "border-top-color 0.5s ease-in-out",
          }}
        />
        <div
          className="fixed lg:bottom-5 sm:bottom-4 bottom-3 lg:left-5 sm:left-4 left-3 w-0 h-0 z-52 pointer-events-none"
          style={{
            borderBottom: `${cornerNotchSize} solid ${borderColor}`,
            borderRight: `${cornerNotchSize} solid transparent`,
            transition: "border-bottom-color 0.5s ease-in-out",
          }}
        />
        <div
          className="fixed lg:bottom-5 sm:bottom-4 bottom-3 lg:right-5 sm:right-4 right-3 w-0 h-0 z-52 pointer-events-none"
          style={{
            borderBottom: `${cornerNotchSize} solid ${borderColor}`,
            borderLeft: `${cornerNotchSize} solid transparent`,
            transition: "border-bottom-color 0.5s ease-in-out",
          }}
        />

        <div className="pointer-events-auto">
          <Notch
            type="sound"
            fontClassName={nostromoLightClassName}
            notchColor={borderColor}
            textColor={notchTextColor}
          />
          <Notch
            type="sound"
            fontClassName={nostromoLightClassName}
            notchColor={borderColor}
            textColor={notchTextColor}
          />
          <Notch
            type="coords-right"
            fontClassName={nostromoLightClassName}
            notchColor={borderColor}
            textColor={notchTextColor}
          />
          <Notch
            type="coords"
            fontClassName={nostromoLightClassName}
            notchColor={borderColor}
            textColor={notchTextColor}
          />
          <Notch
            type="discord"
            fontClassName={nostromoLightClassName}
            notchColor={borderColor}
            textColor={notchTextColor}
          />
        </div>

        <div className="relative z-10">{children}</div>

        <div className="pointer-events-auto">
          <SlidingMenu />
        </div>
      </div>
    </BorderContext.Provider>
  );
};

export default Border;
