import React, { useState } from "react";
import { motion } from "framer-motion";

const copy = "A small, considered place on the internet.";
const words = copy.split(" ");

export function Manifesto() {
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.5 }
    }
  };

  const wordAnim = {
    hidden: { opacity: 0, filter: "blur(8px)" },
    visible: { 
      opacity: 1, 
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: "easeOut" } 
    }
  };

  return (
    <div 
      className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundColor: "#0d1321", color: "#f0ebd8" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        .font-serif {
          font-family: 'Cormorant Garamond', serif;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 0.8s step-end infinite;
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.005); }
        }
        .animate-breathe {
          animation: breathe 6s ease-in-out infinite;
        }
      `}</style>

      <div className="flex flex-col items-center max-w-4xl mx-auto w-full z-10 font-serif">
        <motion.div 
          className={`flex flex-wrap justify-center items-center text-center ${isTypingComplete ? 'animate-breathe' : ''}`}
          variants={container}
          initial="hidden"
          animate="visible"
          onAnimationComplete={() => setTimeout(() => setIsTypingComplete(true), 500)}
        >
          <div className="relative text-[clamp(3rem,6vw,5rem)] leading-[1.2] font-light tracking-wide flex flex-wrap justify-center items-center">
            {words.map((word, idx) => (
              <motion.span 
                key={idx} 
                className="inline-block mr-[0.25em]"
                variants={wordAnim}
              >
                {word}
              </motion.span>
            ))}
            <motion.span 
              className={`inline-block w-[2px] h-[0.8em] bg-[#f0ebd8] ml-1 align-middle ${isTypingComplete ? 'opacity-0 transition-opacity duration-1000' : 'animate-blink'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            />
          </div>
        </motion.div>

        <motion.div 
          className="flex flex-col items-center mt-20 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: isTypingComplete ? 1 : 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        >
          <div className="w-16 h-[1px] mb-10 bg-[#f0ebd8] opacity-30" />
          <a 
            href="#" 
            className="text-xs uppercase tracking-[0.3em] font-sans transition-colors duration-700 hover:text-[#748cab]"
            style={{ color: "#f0ebd8" }}
            onClick={(e) => e.preventDefault()}
          >
            Enter
          </a>
        </motion.div>
      </div>
    </div>
  );
}
