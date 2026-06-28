import React from "react";

// TODO: Fix bakcgorund color of loader
const loading = () => {
  return (
    <div className="">
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 ">
        <p className="text-white/80 text-3xl font-semibold">Loading...</p>
      </div>
    </div>
  );
};

export default loading;
