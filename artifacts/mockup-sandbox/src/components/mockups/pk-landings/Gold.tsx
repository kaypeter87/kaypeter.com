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
  color: string;
};

const PALETTE = {
  bg: "#000814",
  bgDeep: "#001D3D",
  midnight: "#003566",
  gold: "#FFC300",
  goldBright: "#FFD60A",
};

export function Gold() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const stars = useMemo<Star[]>(() => {
    const items: Star[] = [];
    for (let i = 0; i < 100; i++) {
      const r = Math.random();
      const color = r > 0.85 ? PALETTE.goldBright : r > 0.55 ? PALETTE.gold : "#fff8d6";
      items.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.7 + 0.25,
        duration: Math.random() * 13 + 12,
        xMove: (Math.random() - 0.5) * 15,
        yMove: (Math.random() - 0.5) * 15,
        twinkleDuration: Math.random() > 0.7 ? Math.random() * 3 + 2 : null,
        color,
      });
    }
    return items;
  }, []);

  return (
    <div
      className="relative w-full h-[100dvh] overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at 50% 60%, ${PALETTE.bgDeep} 0%, ${PALETTE.bg} 70%)`,
        color: PALETTE.goldBright,
        fontFamily: "Georgia, serif",
      }}
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
                backgroundColor: star.color,
                boxShadow: `0 0 ${star.size * 2}px ${star.color}`,
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

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute left-1/2 top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ width: "min(38vw, 38vh)", height: "min(38vw, 38vh)" }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 38% 38%, ${PALETTE.goldBright} 0%, ${PALETTE.gold} 45%, #b8860b 80%, #6b4a00 100%)`,
            boxShadow: `0 0 80px 20px ${PALETTE.gold}33, 0 0 200px 60px ${PALETTE.goldBright}1f`,
          }}
        />
        <div
          className="absolute inset-0 rounded-full mix-blend-overlay opacity-40"
          style={{
            background:
              "radial-gradient(circle at 70% 70%, transparent 55%, rgba(0,0,0,0.55) 100%)",
          }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: "12%",
            height: "12%",
            left: "22%",
            top: "30%",
            background: "rgba(0,0,0,0.18)",
          }}
          animate={{ opacity: [0.6, 0.4, 0.6] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: "7%",
            height: "7%",
            left: "55%",
            top: "55%",
            background: "rgba(0,0,0,0.22)",
          }}
          animate={{ opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: "5%",
            height: "5%",
            left: "70%",
            top: "30%",
            background: "rgba(0,0,0,0.18)",
          }}
          animate={{ opacity: [0.4, 0.25, 0.4] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <div className="absolute inset-0 z-10 flex flex-col justify-between p-8 md:p-16 pointer-events-none">
        <div className="flex justify-between items-start w-full">
          <div />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 1 }}
            className="text-xs tracking-[0.3em] uppercase font-light"
            style={{ color: PALETTE.gold }}
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
              style={{ color: PALETTE.goldBright }}
            >
              peter kay &mdash; journal &amp; work
            </h1>
            <p
              className="mt-2 text-xs tracking-[0.3em] font-light"
              style={{ color: PALETTE.gold, fontFamily: "'Source Han Serif K', 'Noto Serif KR', serif" }}
            >
              계성우
            </p>
          </motion.div>

          <motion.a
            href="#"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 1.5 }}
            className="pointer-events-auto group flex items-center gap-4 text-xs tracking-[0.3em] uppercase transition-colors duration-500"
            style={{ color: PALETTE.gold }}
          >
            <span className="group-hover:text-[#FFD60A]">Enter</span>
            <span
              className="w-8 h-px transition-all duration-500 group-hover:w-16 origin-left"
              style={{ backgroundColor: PALETTE.gold }}
            />
          </motion.a>
        </div>
      </div>
    </div>
  );
}
