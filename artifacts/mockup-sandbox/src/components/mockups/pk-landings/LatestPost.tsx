import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function LatestPost() {
  const [mounted, setMounted] = useState(false);
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    },
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&display=swap');
          
          .font-serif-custom {
            font-family: 'Cormorant Garamond', serif;
          }
          
          .line-draw {
            transform-origin: left center;
            animation: drawLine 1.2s cubic-bezier(0.21, 0.47, 0.32, 0.98) forwards;
            animation-delay: 1s;
            transform: scaleX(0);
          }
          
          @keyframes drawLine {
            to {
              transform: scaleX(1);
            }
          }
        `}
      </style>
      <div className="min-h-screen w-full bg-[#1d2d44] text-[#f0ebd8] font-serif-custom flex flex-col justify-between p-8 md:p-12 overflow-hidden selection:bg-[#3e5c76] selection:text-[#f0ebd8]">
        {/* Top Header */}
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="flex flex-col items-start gap-4 md:items-center"
        >
          <div className="text-4xl md:text-5xl font-medium tracking-wide leading-none">
            PK
          </div>
          <div className="flex flex-col md:items-center text-xs tracking-[0.2em] text-[#748cab] uppercase space-y-1">
            <span>Journal — Vol. III, No. 12</span>
            <span>{today}</span>
          </div>
        </motion.header>

        {/* Center Content */}
        <main className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full py-20">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={mounted ? "visible" : "hidden"}
            className="flex flex-col items-start"
          >
            <motion.div variants={itemVariants} className="mb-6">
              <span className="text-sm tracking-widest text-[#748cab] uppercase font-medium">
                Latest entry
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-6xl lg:text-[5rem] leading-[1.1] font-medium mb-8 text-[#f0ebd8] max-w-3xl"
            >
              On the Architecture of <br className="hidden md:block" />
              <span className="italic">Slow Mornings</span>
            </motion.h1>

            <motion.div variants={itemVariants} className="max-w-xl mb-12">
              <p className="text-lg md:text-xl text-[#748cab] leading-relaxed font-light">
                There is a specific geometry to the early hours, before the world
                demands a response. It is built not of stone, but of silence, 
                measured in the slow creeping of light across the floorboards.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <a
                href="#read"
                className="group inline-flex items-center gap-4 text-[#f0ebd8] tracking-widest uppercase text-sm hover:text-[#748cab] transition-colors duration-500"
              >
                <span>Read</span>
                <span className="transform group-hover:translate-x-2 transition-transform duration-500">
                  →
                </span>
              </a>
            </motion.div>
          </motion.div>
        </main>

        {/* Bottom Footer */}
        <footer className="w-full mt-auto">
          <div className="h-[1px] w-full bg-[#3e5c76] line-draw mb-6 opacity-50" />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="flex justify-between items-center text-[#748cab] text-sm tracking-widest uppercase"
          >
            <div>
              <a href="#enter" className="hover:text-[#f0ebd8] transition-colors">
                Enter Site
              </a>
            </div>
            <nav className="flex gap-4 md:gap-8">
              <a href="#archive" className="hover:text-[#f0ebd8] transition-colors">
                Archive
              </a>
              <span className="text-[#3e5c76]">·</span>
              <a href="#about" className="hover:text-[#f0ebd8] transition-colors">
                About
              </a>
              <span className="text-[#3e5c76]">·</span>
              <a href="#contact" className="hover:text-[#f0ebd8] transition-colors">
                Contact
              </a>
            </nav>
          </motion.div>
        </footer>
      </div>
    </>
  );
}
