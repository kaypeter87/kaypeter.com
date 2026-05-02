import React from "react";
import { motion } from "framer-motion";

export function Signature() {
  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 2, ease: "easeInOut" },
    },
  };

  const dotVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { delay: 2, duration: 0.3, type: "spring", stiffness: 200 },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 2.3, duration: 1, ease: "easeOut" },
    },
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden text-[#f0ebd8]"
      style={{
        backgroundColor: "#1d2d44",
        fontFamily: "'Cormorant Garamond', serif",
      }}
    >
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        `}
      </style>

      {/* Signature Container */}
      <div className="relative flex flex-col items-center justify-center -mt-20">
        <svg
          viewBox="0 0 240 160"
          className="w-64 md:w-80 lg:w-96 drop-shadow-sm"
          fill="none"
          stroke="#f0ebd8"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Letter P */}
          <motion.path
            d="M50 140 C55 70 60 20 85 25 C115 30 110 80 80 80 C55 80 45 60 55 40"
            variants={pathVariants}
            initial="hidden"
            animate="visible"
          />
          {/* Letter K */}
          <motion.path
            d="M130 20 Q125 80 130 140"
            variants={pathVariants}
            initial="hidden"
            animate="visible"
          />
          <motion.path
            d="M170 60 C150 80 130 95 125 105"
            variants={pathVariants}
            initial="hidden"
            animate="visible"
          />
          <motion.path
            d="M125 105 C150 115 170 130 190 140"
            variants={pathVariants}
            initial="hidden"
            animate="visible"
          />
          {/* Flourish Dot */}
          <motion.circle
            cx="210"
            cy="140"
            r="3.5"
            fill="#f0ebd8"
            stroke="none"
            variants={dotVariants}
            initial="hidden"
            animate="visible"
          />
        </svg>

        {/* Enter Section */}
        <motion.div
          className="flex flex-col items-center justify-center mt-8 tracking-wide"
          variants={textVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="w-8 h-[1px] bg-[#f0ebd8]/40 mb-6" />
          <p className="text-lg md:text-xl italic font-light text-[#f0ebd8]/80 mb-8">
            — a personal site, est. 2026
          </p>

          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="group relative inline-flex items-center gap-2 px-6 py-2 text-sm uppercase tracking-[0.2em] font-light overflow-hidden transition-all duration-300 hover:text-[#1d2d44]"
          >
            <span className="relative z-10">Enter</span>
            <div className="absolute inset-0 bg-[#f0ebd8] scale-y-0 origin-bottom transition-transform duration-300 ease-out group-hover:scale-y-100" />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#f0ebd8]/30 group-hover:bg-transparent transition-colors" />
          </a>
        </motion.div>
      </div>
      
      {/* Background ambient corner glows for depth */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#3e5c76] opacity-10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#748cab] opacity-10 blur-[100px] rounded-full pointer-events-none" />
    </div>
  );
}
