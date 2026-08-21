"use client";
import React, { useState, useEffect } from "react";

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";

const generateRandomText = (length) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const DecryptingText = ({ targetText, start, isComplete, className }) => {
  const [displayText, setDisplayText] = useState("");
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    if (!start) return;

    if (isComplete) {
      setDisplayText(targetText);
      return;
    }

    const interval = setInterval(() => {
      setDisplayText((prev) => {
        if (prev === targetText) {
          clearInterval(interval);
          return targetText;
        }

        let newText = "";
        for (let i = 0; i < targetText.length; i++) {
          if (i < prev.length && prev[i] === targetText[i]) {
            newText += targetText[i];
          } else if (Math.random() < 0.15) {
            newText += targetText[i];
          } else {
            newText += characters.charAt(
              Math.floor(Math.random() * characters.length)
            );
          }
        }
        return newText;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [start, isComplete, targetText]);

  const textToRender = hasMounted ? displayText : "";

  return (
    <div className={`${className} pointer-events-none`}>
      {textToRender || generateRandomText(targetText.length)}
    </div>
  );
};

export default DecryptingText;
