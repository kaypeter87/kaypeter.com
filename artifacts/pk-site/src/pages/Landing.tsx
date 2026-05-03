import { useMemo, useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
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
};

type Cloud = {
  id: number;
  y: number;
  scale: number;
  opacity: number;
  duration: number;
  delay: number;
  puffs: { dx: number; dy: number; r: number }[];
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
      const distance = 60 + Math.random() * 40;
      const length = 80 + Math.random() * 90;
      const s: Shooter = {
        id: nextId++,
        startX: -5 + Math.random() * 50,  // start in the LEFT half of the sky
        startY: 5 + Math.random() * 35,   // upper portion of the sky
        length,
        angle: angleDeg,
        duration: 0.7 + Math.random() * 0.5,
        dx: Math.cos(angleRad) * distance,
        dy: Math.sin(angleRad) * distance,
      };
      setShooters((prev) => [...prev.slice(-7), s]);
      timer = window.setTimeout(spawn, 6000 + Math.random() * 7000);
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

function NightSky({ mx, my }: { mx: MotionValue<number>; my: MotionValue<number> }) {
  const starsX = useTransform(mx, (v) => v * 18);
  const starsY = useTransform(my, (v) => v * 18);
  const moonX = useTransform(mx, (v) => v * 30);
  const moonY = useTransform(my, (v) => v * 30);
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
      // Smooth, rolling distant ridges (low amplitude, low frequency)
      farthest:  generateRidge({ seed: 11, width: W, height: H, baselineY: 165, amplitude: 30, slope: -8,  freq: 0.45, jitter: 0,    step: 6 }),
      far:       generateRidge({ seed: 47, width: W, height: H, baselineY: 185, amplitude: 38, slope: -6,  freq: 0.55, jitter: 0,    step: 6 }),
      // Closer ridges with more defined peaks
      mid:       generateRidge({ seed: 73, width: W, height: H, baselineY: 210, amplitude: 50, slope: -4,  freq: 0.75, jitter: 0.02, step: 4 }),
      near:      generateRidge({ seed: 109, width: W, height: H, baselineY: 230, amplitude: 45, slope: 0,   freq: 0.95, jitter: 0.04, step: 3 }),
    }),
    [],
  );

  // Foreground LEFT hill — high apex at top-left, with a small ledge/shoulder
  // around 200-300 where the tree cluster sits, then ramps diagonally down to
  // the right. Closely matches the silhouette in the reference photo.
  // Hand-shaped key points (x, y in viewBox units), then sample with noise
  // along the diagonal slope between them.
  const frontHillKeys: [number, number][] = useMemo(
    () => [
      [-160, 60],
      [40, 75],
      [120, 105],
      [200, 135],     // ledge starts
      [260, 145],     // ledge plateau (where trees go)
      [320, 175],
      [410, 240],
      [520, 320],
      [640, 420],
      [780, 480],
    ],
    [],
  );
  // Linear-interp lookup of the hill surface y for any x in viewBox space.
  const frontHillSurfaceY = useMemo(() => {
    return (x: number): number => {
      const keys = frontHillKeys;
      if (x <= keys[0][0]) return keys[0][1];
      if (x >= keys[keys.length - 1][0]) return keys[keys.length - 1][1];
      for (let i = 0; i < keys.length - 1; i++) {
        const [x1, y1] = keys[i];
        const [x2, y2] = keys[i + 1];
        if (x >= x1 && x <= x2) {
          const t = (x - x1) / (x2 - x1);
          return y1 + (y2 - y1) * t;
        }
      }
      return 480;
    };
  }, [frontHillKeys]);

  const frontHillPath = useMemo(() => {
    const rand = mulberry32(211);
    const noise = createNoise2D(rand);
    const fh = 480;
    const keys = frontHillKeys;
    // Linear interpolate along keys with noise jitter
    const pts: [number, number][] = [];
    for (let i = 0; i < keys.length - 1; i++) {
      const [x1, y1] = keys[i];
      const [x2, y2] = keys[i + 1];
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

  // Procedurally scatter a DENSE forest across the foreground hill. Trees are
  // packed tightly so their silhouettes overlap and merge into a continuous
  // tree-line mass (rather than reading as individual sparse trees).
  // Each tree's y is computed from the actual hill surface so they always sit
  // exactly on the silhouette regardless of viewport size.
  const trees = useMemo(() => {
    const rand = mulberry32(607);
    const items: {
      seed: number;
      x: number;
      h: number;
      surfaceY: number;
      tree: ReturnType<typeof generatePineTree>;
    }[] = [];

    let nextSeed = 1009;
    const push = (x: number, h: number) => {
      items.push({
        seed: nextSeed,
        x,
        h,
        surfaceY: frontHillSurfaceY(x),
        tree: generatePineTree(nextSeed),
      });
      nextSeed += 7;
    };

    // 1) BACK ROW — taller trees forming the silhouette's top edge. Densely
    //    packed so canopies overlap heavily.
    for (let x = -50; x < 340; x += 2.2 + rand() * 1.8) {
      const heightFactor = Math.max(0.55, 1 - (x + 50) / 480);
      const h = (110 + rand() * 70) * heightFactor;
      push(x + (rand() - 0.5) * 3, h);
    }

    // 2) MID ROW — slightly shorter trees offset to fill gaps between back-row
    //    trees, adding visual mass to the silhouette.
    for (let x = -40; x < 330; x += 2.5 + rand() * 1.8) {
      const heightFactor = Math.max(0.5, 1 - (x + 40) / 460);
      const h = (75 + rand() * 55) * heightFactor;
      push(x + (rand() - 0.5) * 4, h);
    }

    // 3) FRONT ROW — small understory trees nestled at ground level along the
    //    crest, giving the canopy a textured, busy base.
    for (let x = -30; x < 320; x += 3 + rand() * 2) {
      const heightFactor = Math.max(0.45, 1 - (x + 30) / 440);
      const h = (45 + rand() * 35) * heightFactor;
      push(x + (rand() - 0.5) * 5, h);
    }

    // 4) Trailing scatter further down the slope for depth
    for (let x = 340; x < 560; x += 4 + rand() * 5) {
      const h = 20 + rand() * 35;
      push(x + (rand() - 0.5) * 4, h);
    }

    // Sort by surfaceY ascending so trees higher on the hill render BEHIND
    // trees lower down — gives a layered, depth-rich forest silhouette where
    // overlapping crowns naturally merge into a single dark mass.
    items.sort((a, b) => a.surfaceY - b.surfaceY);
    return items;
  }, [frontHillSurfaceY]);

  // Bottom-RIGHT massif — rises from the bottom-right corner up and to the
  // left, meeting the foreground left hill near the center-bottom.
  const rightHillPath = useMemo(() => {
    const rand = mulberry32(317);
    const noise = createNoise2D(rand);
    const fh = 480;
    const keys: [number, number][] = [
      [600, fh],
      [780, 410],
      [920, 350],
      [1080, 290],
      [1240, 250],
      [1380, 220],
      [1540, 200],
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
  const stars = useMemo<Star[]>(() => {
    const items: Star[] = [];
    for (let i = 0; i < 100; i++) {
      items.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.7 + 0.2,
        duration: 0,
        xMove: 0,
        yMove: 0,
        // ~55% of stars sparkle on a random cadence; the rest sit perfectly still.
        twinkleDuration: Math.random() > 0.45 ? Math.random() * 4 + 2 : null,
      });
    }
    return items;
  }, []);

  return (
    <>
      <motion.div className="absolute inset-0 z-0" style={{ x: starsX, y: starsY }}>
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-foreground"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              left: `${star.x}%`,
              top: `${star.y}%`,
              opacity: star.opacity,
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
          width: "min(30vw, 40vh)",
          height: "min(30vw, 40vh)",
          left: "26%",
          top: "20%",
          x: moonX,
          y: moonY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 38% 38%, #f5f0d8 0%, #d8d2bc 45%, #8a8472 80%, #4a4538 100%)",
            boxShadow:
              "0 0 80px 20px rgba(240,235,216,0.18), 0 0 200px 60px rgba(240,235,216,0.10)",
          }}
        />
        <div
          className="absolute inset-0 rounded-full mix-blend-overlay opacity-50"
          style={{
            background:
              "radial-gradient(circle at 70% 70%, transparent 55%, rgba(0,0,0,0.55) 100%)",
          }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{ width: "12%", height: "12%", left: "22%", top: "30%", background: "rgba(0,0,0,0.20)" }}
          animate={{ opacity: [0.6, 0.4, 0.6] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{ width: "7%", height: "7%", left: "55%", top: "55%", background: "rgba(0,0,0,0.24)" }}
          animate={{ opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{ width: "5%", height: "5%", left: "70%", top: "30%", background: "rgba(0,0,0,0.20)" }}
          animate={{ opacity: [0.4, 0.25, 0.4] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <ShootingStars />

      {/* Shared SVG defs: a subtle turbulence/displacement filter to roughen edges */}
      <svg className="absolute" width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id="ridgeRough" x="-2%" y="-10%" width="104%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" />
          </filter>
          <filter id="ridgeRoughStrong" x="-2%" y="-10%" width="104%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.6" />
          </filter>
        </defs>
      </svg>

      {/* Procedural mountain ridges — each layer's bottom is anchored BELOW the
          viewport so the parallax shift never exposes the SVG's straight edge. */}
      <motion.div
        className="absolute inset-x-0 z-[6] pointer-events-none"
        style={{ x: farHillX, y: farHillY, bottom: "-8%", height: "52%" }}
      >
        <svg
          className="absolute"
          style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }}
          viewBox="0 0 1440 240"
          preserveAspectRatio="none"
        >
          <path d={ridges.farthest} fill="#748cab" opacity="0.28" filter="url(#ridgeRough)" />
        </svg>
      </motion.div>

      <motion.div
        className="absolute inset-x-0 z-[7] pointer-events-none"
        style={{ x: farHillX, y: farHillY, bottom: "-8%", height: "48%" }}
      >
        <svg
          className="absolute"
          style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }}
          viewBox="0 0 1440 240"
          preserveAspectRatio="none"
        >
          <path d={ridges.far} fill="#3e5c76" opacity="0.55" filter="url(#ridgeRough)" />
        </svg>
      </motion.div>

      <motion.div
        className="absolute inset-x-0 z-[8] pointer-events-none"
        style={{ x: midHillX, y: midHillY, bottom: "-8%", height: "45%" }}
      >
        <svg
          className="absolute"
          style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }}
          viewBox="0 0 1440 240"
          preserveAspectRatio="none"
        >
          <path d={ridges.mid} fill="#1d2d44" opacity="0.9" filter="url(#ridgeRoughStrong)" />
        </svg>
      </motion.div>

      <motion.div
        className="absolute inset-x-0 z-[9] pointer-events-none"
        style={{ x: midHillX, y: midHillY, bottom: "-8%", height: "50%" }}
      >
        <svg
          className="absolute"
          style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }}
          viewBox="0 0 1440 240"
          preserveAspectRatio="none"
        >
          <path d={ridges.near} fill="#0d1321" opacity="0.94" filter="url(#ridgeRoughStrong)" />
        </svg>
      </motion.div>

      {/* Bottom-RIGHT massif — anchored below the viewport to hide its straight base */}
      <motion.div
        className="absolute inset-x-0 z-[10] pointer-events-none"
        style={{ x: midHillX, y: midHillY, bottom: "-8%", height: "66%" }}
      >
        <svg
          className="absolute"
          style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }}
          viewBox="0 0 1440 480"
          preserveAspectRatio="none"
        >
          <path d={rightHillPath} fill="#0d1321" opacity="0.96" filter="url(#ridgeRoughStrong)" />
        </svg>
      </motion.div>

      {/* Foreground LEFT massif — high apex on the left with a tree ledge.
          Trees are rendered INSIDE this SVG so they sit exactly on the
          silhouette regardless of viewport size. */}
      <motion.div
        className="absolute inset-x-0 z-[11] pointer-events-none"
        style={{ x: frontHillX, y: frontHillY, bottom: "-8%", height: "86%" }}
      >
        <svg
          className="absolute"
          style={{ left: "-15%", bottom: 0, width: "130%", height: "100%" }}
          viewBox="0 0 1440 480"
          preserveAspectRatio="none"
        >
          <path d={frontHillPath} fill="#0d1321" filter="url(#ridgeRoughStrong)" />
          {trees.map((t) => {
            // Tree's natural viewBox is 40 wide × 130 tall; scale by height.
            const scale = t.h / 130;
            const w = 40 * scale;
            // Translate so the tree's BASE (y=118 in its own viewBox) sits on
            // the hill surface, with a few units of buried trunk for grounding.
            const baseOffset = 118 * scale;
            return (
              <g
                key={t.seed}
                transform={`translate(${t.x - w / 2}, ${t.surfaceY - baseOffset}) scale(${scale})`}
                fill="#0d1321"
              >
                <path d={t.tree.trunk} />
                {t.tree.tiers.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
            );
          })}
        </svg>
      </motion.div>
    </>
  );
}

function DaySky({ mx, my }: { mx: MotionValue<number>; my: MotionValue<number> }) {
  const sunX = useTransform(mx, (v) => v * 38);
  const sunY = useTransform(my, (v) => v * 38);
  const cloudsX = useTransform(mx, (v) => v * 14);
  const cloudsY = useTransform(my, (v) => v * 14);
  const clouds = useMemo<Cloud[]>(() => {
    const items: Cloud[] = [];
    for (let i = 0; i < 7; i++) {
      const puffCount = 4 + Math.floor(Math.random() * 3);
      const puffs: Cloud["puffs"] = [];
      for (let p = 0; p < puffCount; p++) {
        puffs.push({
          dx: p * 22 + (Math.random() - 0.5) * 8,
          dy: (Math.random() - 0.5) * 14,
          r: 28 + Math.random() * 22,
        });
      }
      items.push({
        id: i,
        y: 8 + Math.random() * 70,
        scale: 0.6 + Math.random() * 0.9,
        opacity: 0.55 + Math.random() * 0.35,
        duration: 60 + Math.random() * 60,
        delay: -Math.random() * 60,
        puffs,
      });
    }
    return items;
  }, []);

  return (
    <>
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(to bottom, #cfe0f0 0%, #e6e9dc 55%, #f0ebd8 100%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute left-1/2 top-1/2 z-[3] pointer-events-none"
        style={{
          width: "min(36vw, 36vh)",
          height: "min(36vw, 36vh)",
          x: sunX,
          y: sunY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        <motion.div
          className="absolute inset-[-30%] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,220,150,0.45) 0%, rgba(255,220,150,0.18) 35%, transparent 70%)",
          }}
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 40% 40%, #fff4c2 0%, #ffd97a 35%, #f0a850 75%, #c87838 100%)",
            boxShadow:
              "0 0 60px 12px rgba(255,200,100,0.35), 0 0 160px 40px rgba(255,200,100,0.18)",
          }}
        />
      </motion.div>

      <motion.div
        className="absolute inset-0 z-[4] overflow-hidden pointer-events-none"
        style={{ x: cloudsX, y: cloudsY }}
      >
        {clouds.map((cloud) => {
          const width = Math.max(...cloud.puffs.map((p) => p.dx + p.r * 2));
          return (
            <motion.div
              key={cloud.id}
              className="absolute"
              style={{
                top: `${cloud.y}%`,
                left: 0,
                opacity: cloud.opacity,
                transform: `scale(${cloud.scale})`,
                transformOrigin: "left center",
              }}
              initial={{ x: "-30vw" }}
              animate={{ x: "130vw" }}
              transition={{
                duration: cloud.duration,
                delay: cloud.delay,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <svg
                width={width}
                height="120"
                viewBox={`0 0 ${width} 120`}
                style={{ display: "block", filter: "drop-shadow(0 4px 8px rgba(150,150,170,0.18))" }}
              >
                {cloud.puffs.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.dx + p.r}
                    cy={60 + p.dy}
                    r={p.r}
                    fill="#ffffff"
                    opacity="0.92"
                  />
                ))}
              </svg>
            </motion.div>
          );
        })}
      </motion.div>

      <Birds />
    </>
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
    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      rawX.set((e.clientX / w) * 2 - 1);
      rawY.set((e.clientY / h) * 2 - 1);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [rawX, rawY]);

  return (
    <div className="relative w-full min-h-[100dvh] overflow-hidden bg-background text-foreground font-serif selection:bg-primary selection:text-primary-foreground">
      <div className="absolute top-6 right-6 md:top-8 md:right-8 z-20">
        <ThemeToggle />
      </div>

      {mounted && (isDark ? <NightSky mx={mx} my={my} /> : <DaySky mx={mx} my={my} />)}

      <div className="absolute inset-0 z-20 flex flex-col justify-between p-8 md:p-16 pointer-events-none">
        <div className="flex justify-between items-start w-full">
          <div />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 1 }}
            className="text-xs tracking-[0.3em] uppercase text-muted-foreground font-light pr-12 md:pr-16"
          >
            EST. 2026
          </motion.div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end w-full gap-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="pointer-events-auto"
          >
            <h1 className="text-sm md:text-base tracking-[0.2em] font-light leading-relaxed text-foreground lowercase">
              peter kay &mdash; journal &amp; work
            </h1>
            <p
              className="mt-2 text-xs tracking-[0.3em] font-light text-muted-foreground"
              style={{ fontFamily: "'Source Han Serif K', 'Noto Serif KR', serif" }}
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
              className="group flex items-center gap-4 text-xs tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-500"
            >
              <span>Enter</span>
              <span className="w-8 h-px bg-muted-foreground group-hover:bg-foreground transition-all duration-500 group-hover:w-16 origin-left" />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
