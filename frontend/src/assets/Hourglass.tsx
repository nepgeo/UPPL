// Hourglass.tsx
import React from "react";

const Hourglass = () => {
  return (
    <div className="relative w-5 h-5">
      <div className="absolute inset-0 border-2 border-white rounded-t-[50%] rounded-b-[50%] animate-spin-slow"></div>
      <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
    </div>
  );
};

export default Hourglass;
