import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Constellation() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate stars
  const stars = useMemo(() => {
    const starCount = 100;
    const items = [];
    for (let i = 0; i < starCount; i++) {
      items.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.7 + 0.2,
        duration: Math.random() * 13 + 12, // 12-25s
        xMove: (Math.random() - 0.5) * 15, // Drift amount
        yMove: (Math.random() - 0.5) * 15,
        twinkleDuration: Math.random() > 0.7 ? Math.random() * 3 + 2 : null,
      });
    }
    return items;
  }, []);

  // Generate constellation lines (connect nearby stars)
  const lines = useMemo(() => {
    const lineItems = [];
    // Only use a subset of stars for lines to keep it sparse
    const constellationStars = stars.slice(0, 30);
    
    for (let i = 0; i < constellationStars.length; i++) {
      for (let j = i + 1; j < constellationStars.length; j++) {
        const s1 = constellationStars[i];
        const s2 = constellationStars[j];
        
        // Calculate rough distance
        const dist = Math.sqrt(Math.pow(s1.x - s2.x, 2) + Math.pow(s1.y - s2.y, 2));
        
        if (dist < 15) { // Only connect if close
          lineItems.push({
            id: `${i}-${j}`,
            s1,
            s2
          });
        }
      }
    }
    return lineItems.slice(0, 20); // Limit lines
  }, [stars]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');
        
        .font-serif-custom {
          font-family: 'Cormorant Garamond', serif;
        }
      `}} />
      <div className="relative w-full h-[100dvh] overflow-hidden bg-[#0d1321] text-[#f0ebd8] font-serif-custom selection:bg-[#3e5c76] selection:text-[#f0ebd8]">
        
        {/* Sky Container */}
        {mounted && (
          <div className="absolute inset-0 z-0">
            {/* Stars */}
            {stars.map((star) => (
              <motion.div
                key={star.id}
                className="absolute rounded-full bg-[#f0ebd8]"
                style={{
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  opacity: star.opacity,
                }}
                animate={{
                  x: [0, `${star.xMove}vw`, 0],
                  y: [0, `${star.yMove}vh`, 0],
                  ...(star.twinkleDuration ? {
                    opacity: [star.opacity, star.opacity * 0.2, star.opacity],
                  } : {})
                }}
                transition={{
                  x: {
                    duration: star.duration,
                    repeat: Infinity,
                    ease: "linear"
                  },
                  y: {
                    duration: star.duration * 1.1,
                    repeat: Infinity,
                    ease: "linear"
                  },
                  ...(star.twinkleDuration ? {
                    opacity: {
                      duration: star.twinkleDuration,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  } : {})
                }}
              />
            ))}
          </div>
        )}

        {/* Content Overlay */}
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-8 md:p-16 pointer-events-none">
          
          {/* Top Row */}
          <div className="flex justify-between items-start w-full">
            <div></div>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 1 }}
              className="text-xs tracking-[0.3em] uppercase text-[#748cab] font-light"
            >
              EST. 2026
            </motion.div>
          </div>

          {/* Bottom Row */}
          <div className="flex flex-col md:flex-row justify-between items-end md:items-end w-full gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="pointer-events-auto"
            >
              <h1 className="text-sm md:text-base tracking-[0.2em] font-light leading-relaxed text-[#f0ebd8]">
                paul kim &mdash; journal &amp; work
              </h1>
            </motion.div>

            <motion.a
              href="#"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 1.5 }}
              className="pointer-events-auto group flex items-center gap-4 text-xs tracking-[0.3em] uppercase text-[#748cab] hover:text-[#f0ebd8] transition-colors duration-500"
            >
              <span>Enter</span>
              <span className="w-8 h-[1px] bg-[#748cab] group-hover:bg-[#f0ebd8] transition-all duration-500 group-hover:w-16 transform origin-left"></span>
            </motion.a>
          </div>

        </div>
      </div>
    </>
  );
}
