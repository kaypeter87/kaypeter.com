import { useMemo, useEffect, useState } from "react";
import { Link } from "wouter";
import { animate, motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import { createNoise2D } from "simplex-noise";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/use-theme";

// Deterministic PRNG so each layer's procedural shape is stable across renders.
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

// Build a natural-looking mountain ridge silhouette using multi-octave simplex noise.
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

// Classic layered spruce/fir silhouette — stacked triangle tiers that get
// progressively wider toward the base, with small per-tier noise so each tree
// is unique. Reads cleanly even at distance.
function generatePineTree(seed: number): { trunk: string; tiers: string[] } {
  const rand = mulberry32(seed);
  const cx = 20;
  const apexY = 4;
  const baseY = 118;
  const tiers = 7 + Math.floor(rand() * 3);   // 7-9 visible tiers
  const totalH = baseY - apexY;
  const tierH = totalH / tiers;
  const maxHalf = 13 + rand() * 3;

  const tierShapes: string[] = [];
  for (let i = 0; i < tiers; i++) {
    const t = (i + 1) / tiers;
    const cxJ = cx + (rand() - 0.5) * 0.8;
    const half = maxHalf * t * (0.85 + rand() * 0.2);
    const topY = apexY + i * tierH * 0.92;          // tiers slightly overlap
    const bottomY = topY + tierH * 1.55;
    const droop = tierH * 0.18;
    tierShapes.push(
      `M ${(cxJ - half).toFixed(2)} ${(bottomY + droop).toFixed(2)} ` +
      `L ${cxJ.toFixed(2)} ${topY.toFixed(2)} ` +
      `L ${(cxJ + half).toFixed(2)} ${(bottomY + droop).toFixed(2)} Z`,
    );
  }
  const trunk =
    `M ${(cx - 0.6).toFixed(2)} ${baseY} ` +
    `L ${(cx + 0.6).toFixed(2)} ${baseY} ` +
    `L ${(cx + 1).toFixed(2)} ${baseY + 8} ` +
    `L ${(cx - 1).toFixed(2)} ${baseY + 8} Z`;

  return { trunk, tiers: tierShapes };
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

type Bird = {
  id: number;
  y: number;
  scale: number;
  duration: number;
  delay: number;
  flapDuration: number;
};

function ShootingStars() {
  const [shooters, setShooters] = useState<Shooter[]>([]);

  useEffect(() => {
    let nextId = 0;
    let timer: number;

    const spawn = () => {
      // Always travel diagonally from upper-left toward lower-right, with a
      // small random spread so successive meteors aren't perfectly parallel.
      const angleDeg = 18 + Math.random() * 18; // 18°-36° below horizontal
      const angleRad = (angleDeg * Math.PI) / 180;
      const distance = 28 + Math.random() * 22;
      const length = 40 + Math.random() * 45;
      const s: Shooter = {
        id: nextId++,
        startX: -5 + Math.random() * 50,  // start in the LEFT half of the sky
        startY: 5 + Math.random() * 35,   // upper portion of the sky
        length,
        angle: angleDeg,
        duration: 0.35 + Math.random() * 0.25,
        dx: Math.cos(angleRad) * distance,
        dy: Math.sin(angleRad) * distance,
      };
      setShooters([s]);
      // Wait until this meteor has fully faded before spawning another so
      // there is never more than one streak on screen at the same time.
      const nextDelay = s.duration * 1000 + 6000 + Math.random() * 7000;
      timer = window.setTimeout(spawn, nextDelay);
    };

    timer = window.setTimeout(spawn, 800 + Math.random() * 1500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">
      {shooters.map((s) => {
        // Position the streak so its BRIGHT HEAD sits at (startX, startY) and
        // the faded tail extends backward against the direction of travel.
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
        d="M 2 14 Q 9 2 18 11 Q 27 2 34 14"
        stroke="#3e5c76"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </motion.svg>
  );
}

function Birds() {
  const birds = useMemo<Bird[]>(() => {
    const items: Bird[] = [];
    for (let i = 0; i < 4; i++) {
      items.push({
        id: i,
        y: 12 + Math.random() * 45,
        scale: 0.6 + Math.random() * 0.9,
        duration: 28 + Math.random() * 22,
        delay: -Math.random() * 30,
        flapDuration: 0.45 + Math.random() * 0.35,
      });
    }
    return items;
  }, []);

  return (
    <div className="absolute inset-0 z-[6] overflow-hidden pointer-events-none">
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
    </div>
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
  blur: number;
  shape: CloudShapeData;
};

function generateCloudPuffs(seed: number): CloudShapeData {
  // Deterministic pseudo-random from seed so SSR/initial render matches.
  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const count = 3 + Math.floor(rand() * 3); // 3-5 puffs
  const baseR = 18 + rand() * 5;             // 18-23 base puff radius
  // Pack puffs tightly: each puff overlaps its neighbor by ~40%.
  const step = baseR * 1.2;
  const width = baseR * 2 + step * (count - 1) + baseR * 0.4;
  const height = baseR * 2.4;
  const baseline = height * 0.7;

  const puffs: CloudPuff[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const cx = baseR + t * step * (count - 1);
    // Gentle dome — middle puffs taller than edges.
    const arc = Math.sin(t * Math.PI);
    const cy = baseline - arc * (baseR * 0.55);
    const r = baseR * (0.88 + arc * 0.22);
    puffs.push({ cx, cy, r });
  }

  // Wide flat base ellipse merges every puff into one silhouette.
  const base = {
    cx: width / 2,
    cy: baseline + 1,
    rx: width * 0.46,
    ry: baseR * 0.85,
  };

  return { puffs, base, width, height };
}

function CloudShape({ cloud }: { cloud: Cloud }) {
  const { shape } = cloud;
  const filterId = `cloud-blur-${cloud.id}`;
  // Pad the SVG so the blur isn't clipped at the edges.
  const pad = Math.ceil(cloud.blur * 4 + 6);
  return (
    <svg
      width={shape.width + pad * 2}
      height={shape.height + pad * 2}
      viewBox={`${-pad} ${-pad} ${shape.width + pad * 2} ${shape.height + pad * 2}`}
      fill="none"
      style={{ display: "block" }}
    >
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={cloud.blur} />
        </filter>
      </defs>
      <g fill="white" filter={`url(#${filterId})`}>
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

function Clouds() {
  const clouds = useMemo<Cloud[]>(() => {
    const items: Cloud[] = [];
    for (let i = 0; i < 6; i++) {
      const shape = generateCloudPuffs(i + 1);
      items.push({
        id: i,
        y: 6 + Math.random() * 30,
        scale: 0.75 + Math.random() * 0.7,   // 0.75x – 1.45x
        duration: 180 + Math.random() * 160, // 180s – 340s
        delay: -Math.random() * 300,
        opacity: 0.75 + Math.random() * 0.2,
        blur: 0.3 + Math.random() * 0.4,
        shape,
      });
    }
    return items;
  }, []);

  return (
    <div className="absolute inset-0 z-[5] overflow-hidden pointer-events-none">
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
    </div>
  );
}

function PineTree({ style, seed }: { style: React.CSSProperties; seed: number }) {
  const tree = useMemo(() => generatePineTree(seed), [seed]);
  return (
    <svg
      className="absolute"
      style={{ ...style, aspectRatio: "1 / 4" }}
      viewBox="0 0 40 130"
      preserveAspectRatio="xMidYMax meet"
    >
      <g fill="#0d1321">
        <path d={tree.trunk} />
        {tree.tiers.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
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

function Mountains({
  mx,
  my,
  colors,
  atmospheric = false,
}: {
  mx: MotionValue<number>;
  my: MotionValue<number>;
  colors: MountainPalette;
  atmospheric?: boolean;
}) {
  const farHillX = useTransform(mx, (v) => v * 14);
  const farHillY = useTransform(my, (v) => v * 8);
  const midHillX = useTransform(mx, (v) => v * 26);
  const midHillY = useTransform(my, (v) => v * 14);
  const frontHillX = useTransform(mx, (v) => v * 42);
  const frontHillY = useTransform(my, (v) => v * 22);

  // Procedurally generated mountain silhouettes — multi-octave noise + slight slope.
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
      {/* Horizon glow — sits behind the farthest ridge, only when atmospheric */}
      {atmospheric && (
        <motion.div
          className="absolute inset-x-0 z-[5] pointer-events-none"
          style={{ x: farHillX, y: farHillY, bottom: "25%", height: "30%" }}
        >
          <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-[#2a3548]/40 to-transparent blur-2xl" />
        </motion.div>
      )}

      <motion.div
        className="absolute inset-x-0 z-[6] pointer-events-none"
        style={{ x: farHillX, y: farHillY, bottom: "-8%", height: "92%" }}
      >
        <svg className="absolute" style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }} viewBox="0 0 1440 240" preserveAspectRatio="none">
          <path d={ridges.farthest} fill={colors.farthest} />
        </svg>
      </motion.div>

      {atmospheric && (
        <motion.div className="absolute inset-x-0 z-[7] pointer-events-none bg-gradient-to-t from-[#283b50]/20 to-transparent blur-xl" style={{ x: farHillX, y: farHillY, bottom: "0%", height: "20%" }} />
      )}

      <motion.div
        className="absolute inset-x-0 z-[7] pointer-events-none"
        style={{ x: farHillX, y: farHillY, bottom: "-8%", height: "86%" }}
      >
        <svg className="absolute" style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }} viewBox="0 0 1440 240" preserveAspectRatio="none">
          <path d={ridges.far} fill={colors.far} />
        </svg>
      </motion.div>

      {atmospheric && (
        <motion.div className="absolute inset-x-0 z-[8] pointer-events-none bg-gradient-to-t from-[#1b2940]/30 to-transparent blur-xl" style={{ x: midHillX, y: midHillY, bottom: "0%", height: "15%" }} />
      )}

      <motion.div
        className="absolute inset-x-0 z-[8] pointer-events-none"
        style={{ x: midHillX, y: midHillY, bottom: "-8%", height: "82%" }}
      >
        <svg className="absolute" style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }} viewBox="0 0 1440 240" preserveAspectRatio="none">
          <path d={ridges.mid} fill={colors.mid} />
        </svg>
      </motion.div>

      {atmospheric && (
        <motion.div className="absolute inset-x-0 z-[9] pointer-events-none bg-gradient-to-t from-[#101626]/40 to-transparent blur-xl" style={{ x: midHillX, y: midHillY, bottom: "0%", height: "15%" }} />
      )}

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

const NIGHT_PALETTE: MountainPalette = {
  farthest: "#2a3548",
  far:      "#283b50",
  mid:      "#1b2940",
  near:     "#101626",
  right:    "#0d1321",
  front:    "#0d1321",
};

const DAY_PALETTE: MountainPalette = {
  farthest: "#dad7cd",
  far:      "#a3b18a",
  mid:      "#588157",
  near:     "#3a5a40",
  right:    "#344e41",
  front:    "#344e41",
};

function NightSky({
  mx,
  my,
  isDark,
}: {
  mx: MotionValue<number>;
  my: MotionValue<number>;
  isDark: boolean;
}) {
  const starsX = useTransform(mx, (v) => v * 18);
  const starsY = useTransform(my, (v) => v * 18);

  // Theme-driven arc: -1 = pre-rise (upper-left, off-screen), 0 = at rest,
  // +1 = post-set (lower-right, off-screen). Initial value is -1 when dark
  // so the moon rises into view on first mount, or +1 when light so it sits
  // hidden in the set position.
  const moonPhase = useMotionValue(isDark ? -1 : 1);
  useEffect(() => {
    if (isDark) {
      // Snap to pre-rise (invisible behind opacity 0 wrapper) and arc up.
      moonPhase.set(-1);
      const controls = animate(moonPhase, 0, {
        duration: 1.8,
        ease: [0.16, 1, 0.3, 1],
      });
      return () => controls.stop();
    }
    const controls = animate(moonPhase, 1, {
      duration: 1.8,
      ease: [0.4, 0, 0.6, 1],
    });
    return () => controls.stop();
  }, [isDark, moonPhase]);
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
      // Slight clustering around a faint diagonal "milky way" band so the
      // field reads as a sky instead of perfectly uniform noise.
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
        // ~55% of stars sparkle on a random cadence; the rest sit perfectly still.
        twinkleDuration: rand() > 0.45 ? rand() * 4 + 2 : null,
        isAnchor,
      });
    }
    return items;
  }, []);

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      initial={false}
      animate={{ opacity: isDark ? 1 : 0 }}
      transition={{ duration: 1.8, ease: "easeInOut" }}
    >
      {/* Deep sky gradient — adds vertical atmospheric depth */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0a1122] via-[#0d162a] to-[#1d2d44]" />

      {/* Faint diagonal milky-way band */}
      <div className="absolute inset-0 z-0 opacity-10 bg-gradient-to-br from-transparent via-[#748cab] to-transparent blur-3xl transform rotate-45 scale-150" />

      <motion.div className="absolute inset-0 z-[1]" style={{ x: starsX, y: starsY }}>
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className={`absolute rounded-full ${star.isAnchor ? "bg-white" : "bg-foreground"}`}
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              left: `${star.x}%`,
              top: `${star.y}%`,
              opacity: star.opacity,
              boxShadow: star.isAnchor ? "0 0 6px 1px rgba(255,255,255,0.4)" : "none",
            }}
            animate={
              star.twinkleDuration
                ? {
                    opacity: [star.opacity, Math.min(1, star.opacity + 0.6), star.opacity * 0.25, star.opacity],
                    scale: [1, 1.6, 1, 1],
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

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute z-[5] pointer-events-none"
        style={{
          width: "min(10vw, 13vh)",
          height: "min(10vw, 13vh)",
          left: "26%",
          top: "20%",
          x: moonOffX,
          y: moonOffY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        {/* Chromatic edge / outer halo */}
        <div
          className="absolute inset-[-20%] rounded-full opacity-40 blur-md"
          style={{
            background:
              "radial-gradient(circle at 45% 45%, #ffffff 0%, #b8c5d6 45%, #748cab 80%, transparent 100%)",
          }}
        />
        {/* Soft luminance bloom + body */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 35%, #ffffff 0%, #f0ebd8 35%, #d8d2bc 65%, #6a6452 95%, #2a2518 100%)",
            boxShadow:
              "0 0 100px 30px rgba(240,235,216,0.15), 0 0 250px 80px rgba(116,140,171,0.08)",
          }}
        />
        {/* Crater shadow gradient */}
        <div
          className="absolute inset-0 rounded-full mix-blend-multiply opacity-60"
          style={{
            background:
              "radial-gradient(circle at 75% 75%, transparent 40%, rgba(0,0,0,0.65) 100%)",
          }}
        />
        {/* Individual craters */}
        <div
          className="absolute rounded-full"
          style={{ width: "15%", height: "15%", left: "18%", top: "35%", background: "rgba(0,0,0,0.15)", filter: "blur(2px)" }}
        />
        <div
          className="absolute rounded-full"
          style={{ width: "9%", height: "9%", left: "45%", top: "65%", background: "rgba(0,0,0,0.22)", filter: "blur(1px)" }}
        />
        <div
          className="absolute rounded-full"
          style={{ width: "18%", height: "12%", left: "60%", top: "40%", background: "rgba(0,0,0,0.18)", filter: "blur(2px)", transform: "rotate(-20deg)" }}
        />
        <div
          className="absolute rounded-full"
          style={{ width: "7%", height: "7%", left: "30%", top: "60%", background: "rgba(0,0,0,0.12)", filter: "blur(1px)" }}
        />
      </motion.div>

      <ShootingStars />

      <Mountains mx={mx} my={my} colors={NIGHT_PALETTE} atmospheric />
    </motion.div>
  );
}

function DaySky({
  mx,
  my,
  isDark,
}: {
  mx: MotionValue<number>;
  my: MotionValue<number>;
  isDark: boolean;
}) {
  // See NightSky moonPhase for the same arc convention. Sun rises from the
  // upper-left when entering light mode and sets toward the lower-right when
  // dark mode is engaged.
  const sunPhase = useMotionValue(isDark ? 1 : -1);
  useEffect(() => {
    if (!isDark) {
      sunPhase.set(-1);
      const controls = animate(sunPhase, 0, {
        duration: 1.8,
        ease: [0.16, 1, 0.3, 1],
      });
      return () => controls.stop();
    }
    const controls = animate(sunPhase, 1, {
      duration: 1.8,
      ease: [0.4, 0, 0.6, 1],
    });
    return () => controls.stop();
  }, [isDark, sunPhase]);
  const sunOffX = useTransform([mx, sunPhase], ([m, p]) => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
    return (m as number) * 30 + (p as number) * vw * 0.45;
  });
  const sunOffY = useTransform([my, sunPhase], ([m, p]) => {
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    return (m as number) * 30 + (p as number) * vh * 0.75;
  });

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      initial={false}
      animate={{ opacity: isDark ? 0 : 1 }}
      transition={{ duration: 1.8, ease: "easeInOut" }}
    >
      {/* Cool blue sky gradient — light at horizon, deepening toward the top */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(to bottom, #93cfff 0%, #b4e1ff 50%, #d4eeff 100%)",
        }}
      />

      {/* Sun — placed in the same upper-left position the moon occupies in NightSky */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute z-[5] pointer-events-none"
        style={{
          width: "min(10vw, 13vh)",
          height: "min(10vw, 13vh)",
          left: "26%",
          top: "20%",
          x: sunOffX,
          y: sunOffY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        {/* Soft outer corona */}
        <motion.div
          className="absolute inset-[-35%] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(233,196,106,0.50) 0%, rgba(233,196,106,0.20) 40%, transparent 72%)",
          }}
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Sun disc */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 40% 40%, #fbeec2 0%, #f1d68a 40%, #e9c46a 75%, #c89a3a 100%)",
            boxShadow:
              "0 0 80px 20px rgba(233,196,106,0.35), 0 0 200px 60px rgba(233,196,106,0.18)",
          }}
        />
      </motion.div>

      <Clouds />

      <Birds />

      <Mountains mx={mx} my={my} colors={DAY_PALETTE} />
    </motion.div>
  );
}

export default function Landing() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = theme === "dark";

  // Mouse parallax: normalized -1..1 across the viewport, smoothed with a spring.
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 60, damping: 18, mass: 0.6 });
  const my = useSpring(rawY, { stiffness: 60, damping: 18, mass: 0.6 });

  useEffect(() => {
    // Skip parallax on touch / coarse-pointer devices — there's no mouse to
    // drive it and we save a lot of layout/composite work.
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
    <div className="relative w-full min-h-[100dvh] overflow-hidden bg-background text-foreground font-serif selection:bg-primary selection:text-primary-foreground">
      <div className="absolute top-6 right-6 md:top-8 md:right-8 z-20 flex items-center gap-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1 }}
          className="text-xs tracking-[0.3em] uppercase text-muted-foreground font-light"
        >
          EST. 2026
        </motion.div>
        <ThemeToggle />
      </div>

      {mounted && (
        <>
          <DaySky mx={mx} my={my} isDark={isDark} />
          <NightSky mx={mx} my={my} isDark={isDark} />
        </>
      )}

      <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 md:p-16 pointer-events-none">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end w-full gap-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="pointer-events-auto"
          >
            <h1
              className="text-sm md:text-base tracking-[0.2em] font-light leading-relaxed lowercase"
              style={{ color: isDark ? "#f0ebd8" : "#dad7cd" }}
            >
              peter kay &mdash; journal &amp; work
            </h1>
            <p
              className="mt-2 text-xs tracking-[0.3em] uppercase font-light"
              style={{ color: isDark ? "#748cab" : "#a3b18a" }}
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
            <Link
              href="/about"
              className="group flex items-center gap-4 text-xs tracking-[0.3em] uppercase transition-colors duration-500"
              style={{ color: isDark ? "#748cab" : "#a3b18a" }}
            >
              <span>Enter</span>
              <span
                className="w-8 h-px transition-all duration-500 group-hover:w-16 origin-left"
                style={{ background: isDark ? "#748cab" : "#a3b18a" }}
              />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
