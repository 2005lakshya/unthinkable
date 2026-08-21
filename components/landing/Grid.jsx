
export const GridPlusBackground = ({ children }) => {
  return (
    <div className="relative" style={{ backgroundColor: "#D5D1BE" }}>
      <div className="absolute inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, #c0bdab 1px, transparent 1px),
              linear-gradient(to bottom, #c0bdab 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        ></div>
        <div className="absolute inset-0 grid grid-cols-5 gap-8 p-8">
          {Array.from({ length: 30 }, (_, index) => (
            <div key={index} className="flex items-center justify-center">
              <div
                className="text-md font-light select-none"
                style={{ color: "#ea8244" }}
              >
                +
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10">{children}</div>

    </div>
  );
};

