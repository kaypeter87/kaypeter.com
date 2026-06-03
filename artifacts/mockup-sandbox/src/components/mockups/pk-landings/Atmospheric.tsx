import { useMemo, useEffect, useState } from "react";
import { animate, motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import { createNoise2D } from "simplex-noise";

// Deterministic PRNG
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Build a natural-looking mountain ridge silhouette
function generateRidge(opts: {
  seed: number;
  width: number;
  height: number;
  baselineY: number;
  amplitude: number;
  step?: number;
  slope?: number;
  freq?: number;
  jitter?: number;
}): string {
  const rand = mulberry32(opts.seed);
  const noise = createNoise2D(rand);
  const step = opts.step ?? 6;
  const freq = opts.freq ?? 1;
  const jitter = opts.jitter ?? 0;
  const points: [number, number][] = [];
  for (let x = -160; x <= opts.width + 160; x += step) {
    const t = (x + 160) / (opts.width + 320);
    const slopeOffset = (opts.slope ?? 0) * (t - 0.5);
    let h = 0;
    h += noise(x * 0.0028 * freq, opts.seed * 0.13) * 1.0;
    h += noise(x * 0.0072 * freq, opts.seed * 0.27) * 0.55;
    h += noise(x * 0.018 * freq,  opts.seed * 0.59) * 0.28;
    h += noise(x * 0.045 * freq,  opts.seed * 0.91) * 0.14;
    h += (rand() - 0.5) * jitter;
    const y = opts.baselineY - h * opts.amplitude + slopeOffset;
    points.push([x, y]);
  }
  let d = `M ${points[0][0]} ${opts.height} L ${points[0][0]} ${points[0][1].toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i][0]} ${points[i][1].toFixed(1)}`;
  }
  d += ` L ${points[points.length - 1][0]} ${opts.height} Z`;
  return d;
}

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
  isAnchor?: boolean;
};

type Shooter = {
  id: number;
  startX: number;
  startY: number;
  length: number;
  angle: number;
  duration: number;
  dx: number;
  dy: number;
};

function ShootingStars() {
  const [shooters, setShooters] = useState<Shooter[]>([]);

  useEffect(() => {
    let nextId = 0;
    let timer: number;

    const spawn = () => {
      const angleDeg = 18 + Math.random() * 18;
      const angleRad = (angleDeg * Math.PI) / 180;
      const distance = 28 + Math.random() * 22;
      const length = 40 + Math.random() * 45;
      const s: Shooter = {
        id: nextId++,
        startX: -5 + Math.random() * 50,
        startY: 5 + Math.random() * 35,
        length,
        angle: angleDeg,
        duration: 0.35 + Math.random() * 0.25,
        dx: Math.cos(angleRad) * distance,
        dy: Math.sin(angleRad) * distance,
      };
      setShooters([s]);
      const nextDelay = s.duration * 1000 + 6000 + Math.random() * 7000;
      timer = window.setTimeout(spawn, nextDelay);
    };

    timer = window.setTimeout(spawn, 800 + Math.random() * 1500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">
      {shooters.map((s) => {
        const tailRad = (s.angle * Math.PI) / 180;
        const tailDx = -Math.cos(tailRad) * s.length;
        const tailDy = -Math.sin(tailRad) * s.length;
        return (
          <motion.div
            key={s.id}
            className="absolute"
            style={{
              left: `${s.startX}%`,
              top: `${s.startY}%`,
              width: `${s.length}px`,
              height: "2px",
              transformOrigin: "100% 50%",
              background:
                "linear-gradient(to right, rgba(240,235,216,0) 0%, rgba(240,235,216,0.85) 70%, rgba(255,255,255,1) 100%)",
              borderRadius: "2px",
              filter: "drop-shadow(0 0 4px rgba(240,235,216,0.6))",
              translate: `${tailDx}px ${tailDy}px`,
              rotate: `${s.angle}deg`,
            }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{
              x: `${s.dx}vw`,
              y: `${s.dy}vh`,
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: s.duration,
              ease: "linear",
              opacity: {
                duration: s.duration,
                times: [0, 0.12, 0.65, 1],
                ease: "easeOut",
              },
            }}
          />
        );
      })}
    </div>
  );
}

type MountainPalette = {
  farthest: string;
  far: string;
  mid: string;
  near: string;
  right: string;
  front: string;
};

const NIGHT_PALETTE: MountainPalette = {
  farthest: "#2a3548",
  far:      "#283b50",
  mid:      "#1b2940",
  near:     "#101626",
  right:    "#0d1321",
  front:    "#0d1321",
};

function Mountains({
  mx,
  my,
  colors,
}: {
  mx: MotionValue<number>;
  my: MotionValue<number>;
  colors: MountainPalette;
}) {
  const farHillX = useTransform(mx, (v) => v * 14);
  const farHillY = useTransform(my, (v) => v * 8);
  const midHillX = useTransform(mx, (v) => v * 26);
  const midHillY = useTransform(my, (v) => v * 14);
  const frontHillX = useTransform(mx, (v) => v * 42);
  const frontHillY = useTransform(my, (v) => v * 22);

  const W = 1440;
  const H = 240;
  const ridges = useMemo(
    () => ({
      farthest:  generateRidge({ seed: 11, width: W, height: H, baselineY: 110, amplitude: 45, slope: -8,  freq: 0.45, jitter: 0,    step: 6 }),
      far:       generateRidge({ seed: 47, width: W, height: H, baselineY: 135, amplitude: 55, slope: -6,  freq: 0.55, jitter: 0,    step: 6 }),
      mid:       generateRidge({ seed: 73, width: W, height: H, baselineY: 165, amplitude: 70, slope: -4,  freq: 0.75, jitter: 0.02, step: 4 }),
      near:      generateRidge({ seed: 109, width: W, height: H, baselineY: 190, amplitude: 65, slope: 0,   freq: 0.95, jitter: 0.04, step: 3 }),
    }),
    []
  );

  const frontHillKeys: [number, number][] = useMemo(
    () => [
      [-160, 10], [40, 28], [120, 60], [200, 92], [260, 110],
      [320, 145], [410, 215], [520, 300], [640, 405], [780, 480],
    ],
    []
  );
  const frontHillPath = useMemo(() => {
    const rand = mulberry32(211);
    const noise = createNoise2D(rand);
    const fh = 480;
    const pts: [number, number][] = [];
    for (let i = 0; i < frontHillKeys.length - 1; i++) {
      const [x1, y1] = frontHillKeys[i];
      const [x2, y2] = frontHillKeys[i + 1];
      const seg = Math.max(8, Math.floor((x2 - x1) / 4));
      for (let j = 0; j <= seg; j++) {
        const t = j / seg;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t;
        const n = noise(x * 0.025, 1.7) * 3.5 + noise(x * 0.08, 5.1) * 1.2;
        pts.push([x, y + n]);
      }
    }
    let d = `M -160 ${fh}`;
    for (const [x, y] of pts) d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    d += ` L 780 ${fh} Z`;
    return d;
  }, [frontHillKeys]);

  const rightHillPath = useMemo(() => {
    const rand = mulberry32(317);
    const noise = createNoise2D(rand);
    const fh = 480;
    const keys: [number, number][] = [
      [600, fh], [780, 360], [920, 280], [1080, 210],
      [1240, 160], [1380, 125], [1540, 100],
    ];
    const pts: [number, number][] = [];
    for (let i = 0; i < keys.length - 1; i++) {
      const [x1, y1] = keys[i];
      const [x2, y2] = keys[i + 1];
      const seg = Math.max(8, Math.floor((x2 - x1) / 4));
      for (let j = 0; j <= seg; j++) {
        const t = j / seg;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t;
        const n = noise(x * 0.022, 3.3) * 4 + noise(x * 0.07, 6.7) * 1.4;
        pts.push([x, y + n]);
      }
    }
    let d = `M 600 ${fh}`;
    for (const [x, y] of pts) d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    d += ` L 1540 ${fh} Z`;
    return d;
  }, []);

  return (
    <>
      {/* Horizon glow */}
      <motion.div
        className="absolute inset-x-0 z-[5] pointer-events-none"
        style={{ x: farHillX, y: farHillY, bottom: "25%", height: "30%" }}
      >
        <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-[#2a3548]/40 to-transparent blur-2xl" />
      </motion.div>

      <motion.div
        className="absolute inset-x-0 z-[6] pointer-events-none"
        style={{ x: farHillX, y: farHillY, bottom: "-8%", height: "92%" }}
      >
        <svg className="absolute" style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }} viewBox="0 0 1440 240" preserveAspectRatio="none">
          <path d={ridges.farthest} fill={colors.farthest} />
        </svg>
      </motion.div>

      {/* Mist behind far layer */}
      <motion.div className="absolute inset-x-0 z-[7] pointer-events-none bg-gradient-to-t from-[#283b50]/20 to-transparent blur-xl" style={{ x: farHillX, y: farHillY, bottom: "0%", height: "20%" }} />

      <motion.div
        className="absolute inset-x-0 z-[7] pointer-events-none"
        style={{ x: farHillX, y: farHillY, bottom: "-8%", height: "86%" }}
      >
        <svg className="absolute" style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }} viewBox="0 0 1440 240" preserveAspectRatio="none">
          <path d={ridges.far} fill={colors.far} />
        </svg>
      </motion.div>

      {/* Mist behind mid layer */}
      <motion.div className="absolute inset-x-0 z-[8] pointer-events-none bg-gradient-to-t from-[#1b2940]/30 to-transparent blur-xl" style={{ x: midHillX, y: midHillY, bottom: "0%", height: "15%" }} />

      <motion.div
        className="absolute inset-x-0 z-[8] pointer-events-none"
        style={{ x: midHillX, y: midHillY, bottom: "-8%", height: "82%" }}
      >
        <svg className="absolute" style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }} viewBox="0 0 1440 240" preserveAspectRatio="none">
          <path d={ridges.mid} fill={colors.mid} />
        </svg>
      </motion.div>

      {/* Mist behind near layer */}
      <motion.div className="absolute inset-x-0 z-[9] pointer-events-none bg-gradient-to-t from-[#101626]/40 to-transparent blur-xl" style={{ x: midHillX, y: midHillY, bottom: "0%", height: "15%" }} />

      <motion.div
        className="absolute inset-x-0 z-[9] pointer-events-none"
        style={{ x: midHillX, y: midHillY, bottom: "-8%", height: "88%" }}
      >
        <svg className="absolute" style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }} viewBox="0 0 1440 240" preserveAspectRatio="none">
          <path d={ridges.near} fill={colors.near} />
        </svg>
      </motion.div>

      <motion.div
        className="absolute inset-x-0 z-[10] pointer-events-none"
        style={{ x: midHillX, y: midHillY, bottom: "-8%", height: "82%" }}
      >
        <svg className="absolute" style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }} viewBox="0 0 1440 480" preserveAspectRatio="none">
          <path d={rightHillPath} fill={colors.right} />
        </svg>
      </motion.div>

      <motion.div
        className="absolute inset-x-0 z-[11] pointer-events-none"
        style={{ x: frontHillX, y: frontHillY, bottom: "-8%", height: "100%" }}
      >
        <svg className="absolute" style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }} viewBox="0 0 1440 480" preserveAspectRatio="none">
          <path d={frontHillPath} fill={colors.front} />
        </svg>
      </motion.div>
    </>
  );
}

export function Atmospheric() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 60, damping: 18, mass: 0.6 });
  const my = useSpring(rawY, { stiffness: 60, damping: 18, mass: 0.6 });

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
      return;
    }
    let pendingX = 0;
    let pendingY = 0;
    let rafId = 0;
    let queued = false;
    const flush = () => {
      queued = false;
      rawX.set(pendingX);
      rawY.set(pendingY);
    };
    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      pendingX = (e.clientX / w) * 2 - 1;
      pendingY = (e.clientY / h) * 2 - 1;
      if (!queued) {
        queued = true;
        rafId = window.requestAnimationFrame(flush);
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [rawX, rawY]);

  const starsX = useTransform(mx, (v) => v * 18);
  const starsY = useTransform(my, (v) => v * 18);
  
  const moonPhase = useMotionValue(-1);
  useEffect(() => {
    const controls = animate(moonPhase, 0, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [moonPhase]);
  
  const moonOffX = useTransform([mx, moonPhase], ([m, p]) => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
    return (m as number) * 30 + (p as number) * vw * 0.45;
  });
  const moonOffY = useTransform([my, moonPhase], ([m, p]) => {
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    return (m as number) * 30 + (p as number) * vh * 0.75;
  });

  const stars = useMemo<Star[]>(() => {
    const items: Star[] = [];
    const rand = mulberry32(888);
    for (let i = 0; i < 90; i++) {
      // Create slight clustering around a diagonal "milky way" band
      let x = rand() * 100;
      let y = rand() * 100;
      if (rand() > 0.6) {
        const t = rand();
        x = t * 100 + (rand() - 0.5) * 15;
        y = t * 100 + (rand() - 0.5) * 15;
      }
      
      const isAnchor = rand() > 0.95;
      
      items.push({
        id: i,
        x,
        y,
        size: isAnchor ? 2.5 + rand() * 1.5 : rand() * 2 + 1,
        opacity: isAnchor ? 0.8 + rand() * 0.2 : rand() * 0.5 + 0.1,
        duration: 0,
        xMove: 0,
        yMove: 0,
        twinkleDuration: rand() > 0.45 ? rand() * 4 + 2 : null,
        isAnchor,
      });
    }
    return items;
  }, []);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden font-serif select-none" style={{ backgroundColor: "#060b13", color: "#f0ebd8" }}>
      {/* Sky Gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0a1122] via-[#0d162a] to-[#1d2d44]" />
      
      {/* Milky way band */}
      <div className="absolute inset-0 z-0 opacity-10 bg-gradient-to-br from-transparent via-[#748cab] to-transparent blur-3xl transform rotate-45 scale-150" />

      {mounted && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
        >
          <motion.div className="absolute inset-0 z-0" style={{ x: starsX, y: starsY }}>
            {stars.map((star) => (
              <motion.div
                key={star.id}
                className={`absolute rounded-full ${star.isAnchor ? 'bg-white' : 'bg-[#f0ebd8]'}`}
                style={{
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  opacity: star.opacity,
                  boxShadow: star.isAnchor ? `0 0 6px 1px rgba(255,255,255,0.4)` : 'none'
                }}
                animate={
                  star.twinkleDuration
                    ? {
                        opacity: [star.opacity, Math.min(1, star.opacity + 0.6), star.opacity * 0.25, star.opacity],
                        scale: [1, 1.2, 1, 1],
                      }
                    : undefined
                }
                transition={
                  star.twinkleDuration
                    ? {
                        duration: star.twinkleDuration,
                        repeat: Infinity,
                        repeatDelay: Math.random() * 6 + 2,
                        ease: "easeInOut",
                        times: [0, 0.4, 0.7, 1],
                      }
                    : undefined
                }
              />
            ))}
          </motion.div>

          {/* Atmospheric Moon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-[5] pointer-events-none"
            style={{
              width: "min(12vw, 15vh)",
              height: "min(12vw, 15vh)",
              left: "26%",
              top: "20%",
              x: moonOffX,
              y: moonOffY,
              translateX: "-50%",
              translateY: "-50%",
            }}
          >
            {/* Chromatic Edge / Halo */}
            <div
              className="absolute inset-[-20%] rounded-full opacity-40 blur-md"
              style={{
                background: "radial-gradient(circle at 45% 45%, #ffffff 0%, #b8c5d6 45%, #748cab 80%, transparent 100%)",
              }}
            />
            {/* Soft luminance bloom */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 35% 35%, #ffffff 0%, #f0ebd8 35%, #d8d2bc 65%, #6a6452 95%, #2a2518 100%)",
                boxShadow:
                  "0 0 100px 30px rgba(240,235,216,0.15), 0 0 250px 80px rgba(116,140,171,0.08)",
              }}
            />
            {/* Moon craters and texture */}
            <div
              className="absolute inset-0 rounded-full mix-blend-multiply opacity-60"
              style={{
                background:
                  "radial-gradient(circle at 75% 75%, transparent 40%, rgba(0,0,0,0.65) 100%)",
              }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{ width: "15%", height: "15%", left: "18%", top: "35%", background: "rgba(0,0,0,0.15)", filter: "blur(2px)" }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{ width: "9%", height: "9%", left: "45%", top: "65%", background: "rgba(0,0,0,0.22)", filter: "blur(1px)" }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{ width: "18%", height: "12%", left: "60%", top: "40%", background: "rgba(0,0,0,0.18)", filter: "blur(2px)", transform: "rotate(-20deg)" }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{ width: "7%", height: "7%", left: "30%", top: "60%", background: "rgba(0,0,0,0.12)", filter: "blur(1px)" }}
            />
          </motion.div>

          <ShootingStars />
          <Mountains mx={mx} my={my} colors={NIGHT_PALETTE} />
        </motion.div>
      )}

      {/* Typography / Bottom Row */}
      <div className="absolute inset-0 z-20 flex flex-col justify-between p-8 md:p-12 pointer-events-none">
        <div className="flex justify-between items-start w-full">
          <div />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 1 }}
            className="text-[10px] md:text-xs tracking-[0.3em] uppercase font-light"
            style={{ color: "#748cab" }}
          >
            EST. 2026
          </motion.div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end w-full gap-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="pointer-events-auto flex flex-col"
          >
            <h1
              className="text-sm md:text-base tracking-[0.2em] font-light leading-relaxed lowercase"
              style={{ color: "#f0ebd8" }}
            >
              peter kay &mdash; journal &amp; work
            </h1>
            <p
              className="mt-1 md:mt-2 text-[10px] md:text-xs tracking-[0.3em] uppercase font-light"
              style={{ color: "#748cab" }}
            >
              계성우
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 1.5 }}
            className="pointer-events-auto"
          >
            <a
              href="#"
              className="group flex flex-col items-end gap-1.5 transition-colors duration-500"
            >
              <div className="flex items-center gap-4">
                <span className="text-[10px] md:text-xs tracking-[0.3em] uppercase font-light" style={{ color: "#748cab" }}>Enter</span>
                <span
                  className="w-6 md:w-8 h-[1px] transition-all duration-700 group-hover:w-12 md:group-hover:w-16 origin-left"
                  style={{ background: "#748cab" }}
                />
              </div>
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
