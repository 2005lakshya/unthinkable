"use client";

import useScramble from './useScramble.jsx';

// Accept `speed` as a prop with a default value
const ScrambleText = ({ text, as: Component = 'div', speed = 150, ...props }) => {
  // Pass the speed prop to the useScramble hook
  const scrambledText = useScramble(text, { speed });

  return <Component {...props}>{scrambledText}</Component>;
};

export default ScrambleText;
