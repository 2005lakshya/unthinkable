const TimelineGrid = ({ children }) => (
  <div className="w-full min-h-screen relative bg-black text-[#D5D1BE] font-mono">
    
    {/* Desktop grid */}
    <div 
      className="absolute inset-0 opacity-40"
      style={{
        backgroundImage: `linear-gradient(to right, #4A2E00 1px, transparent 1px), linear-gradient(to bottom, #4A2E00 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }}
    />
    <div 
      className="absolute inset-0 opacity-40"
      style={{
        backgroundImage: `radial-gradient(#8F3C00 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        backgroundPosition: '20px 20px'
      }}
    />
    
    <div className="relative z-10">
      {children}
    </div>
  </div>
);

export default TimelineGrid;
