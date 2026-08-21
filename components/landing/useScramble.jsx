import { useState, useEffect, useRef } from 'react';

const useScramble = (text, options = {}) => {
  const { speed = 100, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()1234567890' } = options;
  
  const [displayText, setDisplayText] = useState('');
  const frameRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const iterationRef = useRef(0);

  useEffect(() => {
    // Start with a fully scrambled text
    let initialText = '';
    for (let i = 0; i < text.length; i++) {
      if (text[i] === ' ') {
        initialText += ' ';
      } else {
        initialText += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    setDisplayText(initialText);

    // Reset animation state when text changes
    iterationRef.current = 0;
    lastUpdateTimeRef.current = 0;
    
    const animate = (currentTime) => {
      // Control the frame rate based on the speed option
      if (currentTime - lastUpdateTimeRef.current < speed) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      lastUpdateTimeRef.current = currentTime;
      
      const currentIteration = iterationRef.current;
      
      // Stop the animation when complete
      if (currentIteration >= text.length) {
        setDisplayText(text); // Ensure final text is set
        return;
      }
      
      const newText = text
        .split('')
        .map((char, index) => {
          if (index < currentIteration) {
            return text[index];
          }
          if (char === ' ') return ' ';
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');
        
      setDisplayText(newText);
      iterationRef.current += 1;
      
      frameRef.current = requestAnimationFrame(animate);
    };

    // Start the animation
    frameRef.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [text, speed, chars]);

  return displayText;
};

export default useScramble;
