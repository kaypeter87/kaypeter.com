import { useMemo, useEffect, useState } from "react";
import { animate, motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import { createNoise2D } from "simplex-noise";
import { Moon } from "lucide-react";

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

type MountainPalette = {
  farthest: string;
  far: string;
  mid: string;
  near: string;
  right: string;
  front: string;
};

const DAY_PALETTE: MountainPalette = {
  farthest: "#dad7cd",
  far:      "#a3b18a",
  mid:      "#588157",
  near:     "#3a5a40",
  right:    "#344e41",
  front:    "#344e41",
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
      {/* Horizon glow/haze behind mountains */}
      <motion.div
        className="absolute inset-x-0 z-[5] pointer-events-none"
        style={{ x: farHillX, y: farHillY, bottom: "25%", height: "30%" }}
      >
        <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-[#f6ead8]/60 via-[#f6ead8]/20 to-transparent blur-3xl" />
      </motion.div>

      {/* Farthest Ridge (desaturated slightly for depth) */}
      <motion.div
        className="absolute inset-x-0 z-[6] pointer-events-none opacity-80"
        style={{ x: farHillX, y: farHillY, bottom: "-8%", height: "92%" }}
      >
        <svg className="absolute" style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }} viewBox="0 0 1440 240" preserveAspectRatio="none">
          <path d={ridges.farthest} fill={colors.farthest} />
        </svg>
      </motion.div>

      {/* Mist behind far layer */}
      <motion.div className="absolute inset-x-0 z-[7] pointer-events-none bg-gradient-to-t from-[#f6ead8]/50 to-transparent blur-2xl" style={{ x: farHillX, y: farHillY, bottom: "0%", height: "20%" }} />

      {/* Far Ridge */}
      <motion.div
        className="absolute inset-x-0 z-[7] pointer-events-none"
        style={{ x: farHillX, y: farHillY, bottom: "-8%", height: "86%" }}
      >
        <svg className="absolute" style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }} viewBox="0 0 1440 240" preserveAspectRatio="none">
          <path d={ridges.far} fill={colors.far} />
        </svg>
      </motion.div>

      {/* Mist behind mid layer */}
      <motion.div className="absolute inset-x-0 z-[8] pointer-events-none bg-gradient-to-t from-[#f6ead8]/30 to-transparent blur-xl" style={{ x: midHillX, y: midHillY, bottom: "0%", height: "15%" }} />

      {/* Mid Ridge */}
      <motion.div
        className="absolute inset-x-0 z-[8] pointer-events-none"
        style={{ x: midHillX, y: midHillY, bottom: "-8%", height: "82%" }}
      >
        <svg className="absolute" style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }} viewBox="0 0 1440 240" preserveAspectRatio="none">
          <path d={ridges.mid} fill={colors.mid} />
        </svg>
      </motion.div>

      {/* Mist behind near layer */}
      <motion.div className="absolute inset-x-0 z-[9] pointer-events-none bg-gradient-to-t from-[#e9c46a]/15 to-transparent blur-xl" style={{ x: midHillX, y: midHillY, bottom: "0%", height: "15%" }} />

      {/* Near Ridge */}
      <motion.div
        className="absolute inset-x-0 z-[9] pointer-events-none"
        style={{ x: midHillX, y: midHillY, bottom: "-8%", height: "88%" }}
      >
        <svg className="absolute" style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }} viewBox="0 0 1440 240" preserveAspectRatio="none">
          <path d={ridges.near} fill={colors.near} />
        </svg>
      </motion.div>

      {/* Right Fore Ridge */}
      <motion.div
        className="absolute inset-x-0 z-[10] pointer-events-none"
        style={{ x: midHillX, y: midHillY, bottom: "-8%", height: "82%" }}
      >
        <svg className="absolute" style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }} viewBox="0 0 1440 480" preserveAspectRatio="none">
          <path d={rightHillPath} fill={colors.right} />
        </svg>
      </motion.div>

      {/* Left Front Ridge with directional sunlight tint */}
      <motion.div
        className="absolute inset-x-0 z-[11] pointer-events-none"
        style={{ x: frontHillX, y: frontHillY, bottom: "-8%", height: "100%" }}
      >
        <svg className="absolute" style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }} viewBox="0 0 1440 480" preserveAspectRatio="none">
          <defs>
            <linearGradient id="frontMountainTint" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#e9c46a" stopOpacity="0.15" />
              <stop offset="30%" stopColor={colors.front} stopOpacity="1" />
              <stop offset="100%" stopColor={colors.front} stopOpacity="1" />
            </linearGradient>
          </defs>
          <path d={frontHillPath} fill="url(#frontMountainTint)" />
        </svg>
      </motion.div>
    </>
  );
}

function BirdShape({ flapDuration }: { flapDuration: number }) {
  return (
    <motion.svg
      width="24"
      height="14"
      viewBox="0 0 36 20"
      style={{ display: "block", overflow: "visible" }}
      animate={{ scaleY: [1, 0.45, 1] }}
      transition={{ duration: flapDuration, repeat: Infinity, ease: "easeInOut" }}
    >
      <path
        d="M 2 14 Q 9 2 18 11 Q 27 2 34 14"
        stroke="#5b6f8a"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </motion.svg>
  );
}

function Birds({ mx, my }: { mx: MotionValue<number>; my: MotionValue<number> }) {
  const birds = useMemo(() => {
    const items = [];
    for (let i = 0; i < 3; i++) {
      items.push({
        id: i,
        y: 15 + Math.random() * 25,
        scale: 0.4 + Math.random() * 0.4,
        duration: 35 + Math.random() * 25,
        delay: -Math.random() * 40,
        flapDuration: 0.5 + Math.random() * 0.4,
      });
    }
    return items;
  }, []);

  const birdsX = useTransform(mx, (v) => v * 6);
  const birdsY = useTransform(my, (v) => v * 6);

  return (
    <motion.div className="absolute inset-0 z-[6] overflow-hidden pointer-events-none" style={{ x: birdsX, y: birdsY }}>
      {birds.map((bird) => (
        <motion.div
          key={bird.id}
          className="absolute"
          style={{
            top: `${bird.y}%`,
            left: 0,
            transform: `scale(${bird.scale})`,
            transformOrigin: "left center",
            opacity: 0.6,
          }}
          initial={{ x: "-10vw" }}
          animate={{ x: "115vw", y: [0, -8, 4, -6, 0] }}
          transition={{
            x: {
              duration: bird.duration,
              delay: bird.delay,
              repeat: Infinity,
              ease: "linear",
            },
            y: {
              duration: bird.duration / 3,
              delay: bird.delay,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        >
          <BirdShape flapDuration={bird.flapDuration} />
        </motion.div>
      ))}
    </motion.div>
  );
}

type CloudPuff = { cx: number; cy: number; r: number };
type CloudShapeData = {
  puffs: CloudPuff[];
  base: { cx: number; cy: number; rx: number; ry: number };
  width: number;
  height: number;
};

function generateCloudPuffs(seed: number): CloudShapeData {
  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const count = 3 + Math.floor(rand() * 4);
  const baseR = 25 + rand() * 10;
  const step = baseR * 1.1;
  const width = baseR * 2 + step * (count - 1) + baseR * 0.5;
  const height = baseR * 2.5;
  const baseline = height * 0.7;
  const puffs: CloudPuff[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const cx = baseR + t * step * (count - 1);
    const arc = Math.sin(t * Math.PI);
    const cy = baseline - arc * (baseR * 0.6);
    const r = baseR * (0.8 + arc * 0.3);
    puffs.push({ cx, cy, r });
  }
  const base = {
    cx: width / 2,
    cy: baseline + 2,
    rx: width * 0.48,
    ry: baseR * 0.9,
  };
  return { puffs, base, width, height };
}

function CloudShape({ cloud }: { cloud: any }) {
  const { shape } = cloud;
  const filterId = `cloud-blur-${cloud.id}`;
  const pad = Math.ceil(cloud.blur * 6 + 10);
  return (
    <svg
      width={shape.width + pad * 2}
      height={shape.height + pad * 2}
      viewBox={`${-pad} ${-pad} ${shape.width + pad * 2} ${shape.height + pad * 2}`}
      fill="none"
      style={{ display: "block" }}
    >
      <defs>
        <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={cloud.blur} />
        </filter>
        <linearGradient id={`grad-${cloud.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#f6ead8" stopOpacity={0.6} />
        </linearGradient>
      </defs>
      <g fill={`url(#grad-${cloud.id})`} filter={`url(#${filterId})`}>
        <ellipse cx={shape.base.cx} cy={shape.base.cy} rx={shape.base.rx} ry={shape.base.ry} />
        {shape.puffs.map((p: any, i: number) => (
          <circle key={i} cx={p.cx} cy={p.cy} r={p.r} />
        ))}
      </g>
    </svg>
  );
}

function Clouds({ mx, my }: { mx: MotionValue<number>; my: MotionValue<number> }) {
  const clouds = useMemo(() => {
    const items = [];
    for (let i = 0; i < 5; i++) {
      const shape = generateCloudPuffs(i + 42);
      items.push({
        id: i,
        y: 8 + Math.random() * 25,
        scale: 0.8 + Math.random() * 0.8,
        duration: 220 + Math.random() * 180,
        delay: -Math.random() * 300,
        opacity: 0.6 + Math.random() * 0.3,
        blur: 4 + Math.random() * 6,
        shape,
      });
    }
    return items;
  }, []);

  const cloudsX = useTransform(mx, (v) => v * 10);
  const cloudsY = useTransform(my, (v) => v * 10);

  return (
    <motion.div className="absolute inset-0 z-[5] overflow-hidden pointer-events-none" style={{ x: cloudsX, y: cloudsY }}>
      {clouds.map((c) => (
        <motion.div
          key={c.id}
          className="absolute"
          style={{
            top: `${c.y}%`,
            left: 0,
            transform: `scale(${c.scale})`,
            transformOrigin: "left center",
            opacity: c.opacity,
            willChange: "transform",
          }}
          initial={{ x: "-20vw" }}
          animate={{ x: "125vw" }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <CloudShape cloud={c} />
        </motion.div>
      ))}
    </motion.div>
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

  const sunOffX = useTransform(mx, (v) => v * 15);
  const sunOffY = useTransform(my, (v) => v * 15);

  return (
    <div className="relative w-full min-h-[100dvh] overflow-hidden font-serif select-none" style={{ backgroundColor: "#d4eeff", fontFamily: "'Cormorant Garamond', serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* Sky Gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#8abce0] via-[#add1ed] to-[#f6ead8]" />

      {/* Top Left Sun Tint */}
      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-[#fbeec2]/40 to-transparent opacity-80 blur-3xl" />

      {mounted && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
        >
          {/* Atmospheric Sun */}
          <motion.div
            className="absolute z-[4] pointer-events-none"
            style={{
              width: "min(20vw, 25vh)",
              height: "min(20vw, 25vh)",
              left: "26%",
              top: "20%",
              x: sunOffX,
              y: sunOffY,
              translateX: "-50%",
              translateY: "-50%",
            }}
          >
            {/* Volumetric god rays */}
            <motion.div 
              className="absolute inset-[-150%] rounded-full opacity-30 mix-blend-screen"
              style={{
                background: "conic-gradient(from 0deg at 50% 50%, transparent 0%, #fff9e6 5%, transparent 10%, transparent 45%, #fff9e6 50%, transparent 55%, transparent 100%)",
                filter: "blur(20px)"
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Sun Glow */}
            <div
              className="absolute inset-[-40%] rounded-full opacity-60 blur-2xl mix-blend-screen"
              style={{
                background: "radial-gradient(circle at 50% 50%, #ffffff 0%, #fbeec2 40%, #e9c46a 70%, transparent 100%)",
              }}
            />
            
            {/* Sun Disc */}
            <motion.div
              className="absolute inset-[15%] rounded-full"
              style={{
                background: "radial-gradient(circle at 40% 40%, #ffffff 0%, #fbeec2 20%, #f1d68a 60%, #e9c46a 90%, #c89a3a 100%)",
                boxShadow: "0 0 80px 20px rgba(251, 238, 194, 0.4), inset 0 0 20px rgba(255,255,255,0.8)",
              }}
              animate={{
                boxShadow: [
                  "0 0 80px 20px rgba(251, 238, 194, 0.4), inset 0 0 20px rgba(255,255,255,0.8)",
                  "0 0 100px 30px rgba(251, 238, 194, 0.5), inset 0 0 30px rgba(255,255,255,1)",
                  "0 0 80px 20px rgba(251, 238, 194, 0.4), inset 0 0 20px rgba(255,255,255,0.8)"
                ]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Lens flare hints */}
            <div className="absolute top-[180%] left-[180%] w-[10%] h-[10%] rounded-full bg-[#fbeec2]/20 blur-sm" />
            <div className="absolute top-[250%] left-[250%] w-[5%] h-[5%] rounded-full bg-white/30 blur-xs mix-blend-screen" />
          </motion.div>

          <Clouds mx={mx} my={my} />
          <Birds mx={mx} my={my} />
          <Mountains mx={mx} my={my} colors={DAY_PALETTE} />
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
            className="flex items-center gap-3 pointer-events-auto"
          >
            <span className="text-[10px] md:text-xs tracking-[0.3em] uppercase font-light text-[#1d2d44]">
              EST. 2026
            </span>
            <button className="w-8 h-8 rounded-full border border-[#1d2d44]/20 flex items-center justify-center hover:bg-[#1d2d44]/5 transition-colors text-[#1d2d44]">
              <Moon size={14} strokeWidth={1.5} />
            </button>
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
              className="text-sm md:text-base tracking-[0.2em] font-medium leading-relaxed lowercase"
              style={{ color: "#1d2d44" }}
            >
              peter kay &mdash; journal &amp; work
            </h1>
            <p
              className="mt-1 md:mt-2 text-[10px] md:text-xs tracking-[0.3em] uppercase font-medium"
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
                <span className="text-[10px] md:text-xs tracking-[0.3em] uppercase font-medium" style={{ color: "#748cab" }}>Enter</span>
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
