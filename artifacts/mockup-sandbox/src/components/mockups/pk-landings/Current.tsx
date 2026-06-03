import { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";

type Star = {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  xMove: number;
  yMove: number;
  twinkleDuration: number | null;
};

const PALETTE = {
  bg: "#1d2d44",
  star: "#f0ebd8",
  text: "#f0ebd8",
  muted: "#748cab",
};

export function Current() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const stars = useMemo<Star[]>(() => {
    const items: Star[] = [];
    for (let i = 0; i < 100; i++) {
      items.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.7 + 0.2,
        duration: Math.random() * 13 + 12,
        xMove: (Math.random() - 0.5) * 15,
        yMove: (Math.random() - 0.5) * 15,
        twinkleDuration: Math.random() > 0.7 ? Math.random() * 3 + 2 : null,
      });
    }
    return items;
  }, []);

  return (
    <div
      className="relative w-full h-[100dvh] overflow-hidden font-serif"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.text, fontFamily: "Georgia, serif" }}
    >
      {mounted && (
        <div className="absolute inset-0 z-0">
          {stars.map((star) => (
            <motion.div
              key={star.id}
              className="absolute rounded-full"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                left: `${star.x}%`,
                top: `${star.y}%`,
                opacity: star.opacity,
                backgroundColor: PALETTE.star,
              }}
              animate={{
                x: [0, `${star.xMove}vw`, 0],
                y: [0, `${star.yMove}vh`, 0],
                ...(star.twinkleDuration
                  ? { opacity: [star.opacity, star.opacity * 0.2, star.opacity] }
                  : {}),
              }}
              transition={{
                x: { duration: star.duration, repeat: Infinity, ease: "linear" },
                y: { duration: star.duration * 1.1, repeat: Infinity, ease: "linear" },
                ...(star.twinkleDuration
                  ? {
                      opacity: {
                        duration: star.twinkleDuration,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }
                  : {}),
              }}
            />
          ))}
        </div>
      )}

      <div className="absolute inset-0 z-10 flex flex-col justify-between p-8 md:p-16 pointer-events-none">
        <div className="flex justify-between items-start w-full">
          <div />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 1 }}
            className="text-xs tracking-[0.3em] uppercase font-light"
            style={{ color: PALETTE.muted }}
          >
            EST. 2026
          </motion.div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end w-full gap-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          >
            <h1
              className="text-sm md:text-base tracking-[0.2em] font-light leading-relaxed lowercase"
              style={{ color: PALETTE.text }}
            >
              paul kim &mdash; journal &amp; work
            </h1>
          </motion.div>

          <motion.a
            href="#"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 1.5 }}
            className="pointer-events-auto group flex items-center gap-4 text-xs tracking-[0.3em] uppercase transition-colors duration-500"
            style={{ color: PALETTE.muted }}
          >
            <span>Enter</span>
            <span
              className="w-8 h-px transition-all duration-500 group-hover:w-16 origin-left"
              style={{ backgroundColor: PALETTE.muted }}
            />
          </motion.a>
        </div>
      </div>
    </div>
  );
}
