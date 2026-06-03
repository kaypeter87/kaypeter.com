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
    [],
  );

  const frontHillKeys: [number, number][] = useMemo(
    () => [
      [-160, 10], [40, 28], [120, 60], [200, 92], [260, 110],
      [320, 145], [410, 215], [520, 300], [640, 405], [780, 480],
    ],
    [],
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
      {/* Grounding Horizon Hairline */}
      <motion.div
        className="absolute inset-x-0 z-[5] pointer-events-none"
        style={{ x: farHillX, y: farHillY, bottom: "16%", height: "1px", background: "rgba(255,255,255,0.4)" }}
      />
      <motion.div
        className="absolute inset-x-0 z-[6] pointer-events-none"
        style={{ x: farHillX, y: farHillY, bottom: "-8%", height: "92%" }}
      >
        <svg className="absolute" style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }} viewBox="0 0 1440 240" preserveAspectRatio="none">
          <path d={ridges.farthest} fill={colors.farthest} />
        </svg>
      </motion.div>
      <motion.div
        className="absolute inset-x-0 z-[7] pointer-events-none"
        style={{ x: farHillX, y: farHillY, bottom: "-8%", height: "86%" }}
      >
        <svg className="absolute" style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }} viewBox="0 0 1440 240" preserveAspectRatio="none">
          <path d={ridges.far} fill={colors.far} />
        </svg>
      </motion.div>
      <motion.div
        className="absolute inset-x-0 z-[8] pointer-events-none"
        style={{ x: midHillX, y: midHillY, bottom: "-8%", height: "82%" }}
      >
        <svg className="absolute" style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }} viewBox="0 0 1440 240" preserveAspectRatio="none">
          <path d={ridges.mid} fill={colors.mid} />
        </svg>
      </motion.div>
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

type Bird = {
  id: number;
  y: number;
  scale: number;
  duration: number;
  delay: number;
  flapDuration: number;
};

function BirdShape({ flapDuration }: { flapDuration: number }) {
  return (
    <motion.svg
      width="36"
      height="20"
      viewBox="0 0 36 20"
      style={{ display: "block", overflow: "visible" }}
      animate={{ scaleY: [1, 0.45, 1] }}
      transition={{ duration: flapDuration, repeat: Infinity, ease: "easeInOut" }}
    >
      <path
        d="M 2 14 Q 9 5 18 10 Q 27 5 34 14"
        stroke="#1d2d44"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
    </motion.svg>
  );
}

function Birds({ mx, my }: { mx: MotionValue<number>; my: MotionValue<number> }) {
  const birdsX = useTransform(mx, (v) => v * 30);
  const birdsY = useTransform(my, (v) => v * 15);

  const birds = useMemo<Bird[]>(() => {
    const items: Bird[] = [];
    for (let i = 0; i < 3; i++) {
      items.push({
        id: i,
        y: 15 + Math.random() * 25,
        scale: 0.45 + Math.random() * 0.4,
        duration: 35 + Math.random() * 25,
        delay: -Math.random() * 40,
        flapDuration: 0.5 + Math.random() * 0.3,
      });
    }
    return items;
  }, []);

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
          }}
          initial={{ x: "-10vw" }}
          animate={{ x: "115vw", y: [0, -10, 5, -8, 0] }}
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
type Cloud = {
  id: number;
  y: number;
  scale: number;
  duration: number;
  delay: number;
  opacity: number;
  shape: CloudShapeData;
};

function generateCloudPuffs(seed: number): CloudShapeData {
  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const count = 2 + Math.floor(rand() * 2); // 2-3 puffs
  const baseR = 20 + rand() * 10;
  const step = baseR * 1.1;
  const width = baseR * 2 + step * (count - 1) + baseR * 0.4;
  const height = baseR * 2.2;
  const baseline = height * 0.7;

  const puffs: CloudPuff[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const cx = baseR + t * step * (count - 1);
    const arc = Math.sin(t * Math.PI);
    const cy = baseline - arc * (baseR * 0.45);
    const r = baseR * (0.8 + arc * 0.3);
    puffs.push({ cx, cy, r });
  }

  const base = {
    cx: width / 2,
    cy: baseline + 2,
    rx: width * 0.48,
    ry: baseR * 0.7,
  };

  return { puffs, base, width, height };
}

function CloudShape({ cloud }: { cloud: Cloud }) {
  const { shape } = cloud;
  const pad = 10;
  return (
    <svg
      width={shape.width + pad * 2}
      height={shape.height + pad * 2}
      viewBox={`${-pad} ${-pad} ${shape.width + pad * 2} ${shape.height + pad * 2}`}
      fill="none"
      style={{ display: "block", filter: "drop-shadow(0px 8px 12px rgba(0,0,0,0.03)) blur(1px)" }}
    >
      <g fill="white">
        <ellipse
          cx={shape.base.cx}
          cy={shape.base.cy}
          rx={shape.base.rx}
          ry={shape.base.ry}
        />
        {shape.puffs.map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r={p.r} />
        ))}
      </g>
    </svg>
  );
}

function Clouds({ mx, my }: { mx: MotionValue<number>; my: MotionValue<number> }) {
  const cloudsX = useTransform(mx, (v) => v * 20);
  const cloudsY = useTransform(my, (v) => v * 10);

  const clouds = useMemo<Cloud[]>(() => {
    const items: Cloud[] = [];
    for (let i = 0; i < 3; i++) {
      const shape = generateCloudPuffs(i + 42);
      items.push({
        id: i,
        y: 8 + Math.random() * 20,
        scale: 0.8 + Math.random() * 0.6,
        duration: 220 + Math.random() * 120,
        delay: -Math.random() * 200,
        opacity: 0.85 + Math.random() * 0.15,
        shape,
      });
    }
    return items;
  }, []);

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

function DaySky({
  mx,
  my,
}: {
  mx: MotionValue<number>;
  my: MotionValue<number>;
}) {
  const sunOffX = useTransform(mx, (m) => m * 15);
  const sunOffY = useTransform(my, (m) => m * 15);

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.8, ease: "easeInOut" }}
    >
      <div 
        className="absolute inset-0 z-0" 
        style={{
          background: "linear-gradient(to bottom, #93cfff 0%, #b4e1ff 50%, #d4eeff 100%)",
        }} 
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute z-[4] pointer-events-none"
        style={{
          width: "min(12vw, 15vh)",
          height: "min(12vw, 15vh)",
          left: "26%",
          top: "20%",
          x: sunOffX,
          y: sunOffY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(135deg, #fbeec2 0%, #f1d68a 40%, #e9c46a 75%, #c89a3a 100%)",
          }}
        />
        {/* Tighter Corona / Halo Ring */}
        <div
          className="absolute inset-[-12%] rounded-full border border-[#f1d68a]/30 opacity-70"
        />
        <div
          className="absolute inset-[-40%] rounded-full opacity-40 blur-xl mix-blend-overlay"
          style={{ background: "radial-gradient(circle at center, #f1d68a 0%, #e9c46a 50%, transparent 80%)" }}
        />
        <motion.div
          className="absolute inset-[-80%] rounded-full opacity-20 blur-2xl mix-blend-screen"
          style={{ background: "radial-gradient(circle at center, #fbeec2 0%, #f1d68a 40%, transparent 70%)" }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.25, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <Clouds mx={mx} my={my} />
      <Birds mx={mx} my={my} />
      <Mountains mx={mx} my={my} colors={DAY_PALETTE} />
    </motion.div>
  );
}

export function Composed() {
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

  return (
    <div className="relative w-full min-h-[100dvh] overflow-hidden bg-[#d4eeff] text-[#1d2d44] selection:bg-[#1d2d44]/10 selection:text-[#1d2d44]">
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{__html: `
        .font-composed {
          font-family: 'Cormorant Garamond', serif;
        }
      `}} />
      
      {/* Light edge vignette to frame the scene */}
      <div className="pointer-events-none absolute inset-0 z-30 shadow-[inset_0_0_100px_rgba(255,255,255,0.4)]" />

      {mounted && <DaySky mx={mx} my={my} />}

      <div className="absolute inset-0 z-20 flex flex-col justify-between p-8 md:p-12 pointer-events-none font-composed">
        
        {/* Top Right */}
        <div className="flex justify-between items-start w-full">
          <div />
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.5, delay: 0.8 }}
            className="flex flex-col items-end gap-1.5"
          >
            <div className="text-[10px] tracking-[0.25em] uppercase font-medium text-[#1d2d44]">
              EST. 2026
            </div>
            <div className="h-[1px] w-8 bg-[#1d2d44]/30" />
            <div className="text-[9px] tracking-[0.2em] uppercase font-light text-[#748cab] mt-0.5">
              SF &middot; CA
            </div>
          </motion.div>
        </div>

        {/* Bottom Lockup */}
        <div className="flex flex-col w-full gap-6 pointer-events-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end w-full gap-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-[1px] bg-[#748cab]" />
                <span className="text-[10px] tracking-[0.25em] uppercase text-[#748cab] font-medium">
                  Index
                </span>
              </div>
              <h1 className="text-xl md:text-2xl tracking-[0.1em] font-medium leading-none lowercase text-[#1d2d44] mt-1">
                peter kay &mdash; journal &amp; work
              </h1>
              <p className="mt-1 text-xs tracking-[0.4em] uppercase font-medium text-[#748cab] opacity-80">
                계성우
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 1.2 }}
              className="flex flex-col items-end"
            >
              <a
                href="#"
                className="group flex items-center gap-3 text-[11px] tracking-[0.3em] uppercase transition-colors duration-500 text-[#1d2d44] font-medium"
              >
                <span>Enter</span>
                <span className="w-10 h-[1px] bg-[#1d2d44] transition-all duration-500 group-hover:w-16 origin-left" />
              </a>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
            className="w-full h-[1px] bg-[#748cab]/30 origin-left"
          />
        </div>
      </div>
    </div>
  );
}
