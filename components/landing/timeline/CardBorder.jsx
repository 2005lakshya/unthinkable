const CardBorderSVG = ({ imageUrl, altText = 'Event image' }) => {
  const clipId = `clip-${Math.random().toString(36).substr(2, 9)}`;
  const gradientId = `grad-${Math.random().toString(36).substr(2, 9)}`;
  const filterId = `glow-${Math.random().toString(36).substr(2, 9)}`;
  
  const pathD = "M373.527 7H20.0125C17.2462 7 15.0056 9.24615 15.0125 12.0124L16.2157 495.487C16.2226 498.244 18.4592 500.475 21.2157 500.475H374.755C377.517 500.475 379.755 498.236 379.755 495.475V314.708C379.755 313.447 379.279 312.233 378.422 311.308L366.351 298.286C365.494 297.361 365.018 296.147 365.018 294.887V210.938C365.018 209.568 365.58 208.258 366.573 207.314L376.972 197.43C377.965 196.486 378.527 195.176 378.527 193.806V12C378.527 9.23858 376.289 7 373.527 7Z";

  return (
    <div className="w-full h-full relative">
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 387 508" 
        className="absolute inset-0"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={pathD} />
          </clipPath>
          
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBCFE8" />
            <stop offset="50%" stopColor="#C4B5FD" />
            <stop offset="100%" stopColor="#93C5FD" />
          </linearGradient>

          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          </filter>
        </defs>

        <image
          href={imageUrl}
          x="0" 
          y="0" 
          width="100%" 
          height="100%"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />

        <path 
          d={pathD} 
          stroke={`url(#${gradientId})`} 
          strokeWidth="15" 
          fill="none" 
          filter={`url(#${filterId})`} 
        />
        <path 
          d={pathD} 
          stroke={`url(#${gradientId})`} 
          strokeWidth="14" 
          fill="none"
        />
        <path 
          d="M1 399.28L7.75473 395V479.386L1 474.494V399.28Z" 
          fill="white" 
          stroke="white"
        />
      </svg>
    </div>
  );
};

export default CardBorderSVG;
