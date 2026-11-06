import { CatmullRomCurve3, Vector3 } from "three";

/** Texels in the baked stroke. Particles look their position up by param t. */
export const CURVE_SIZE = 4096;

/** Share of the t range spent on the distant tail; the rest is the @ itself. */
const TAIL_SHARE = 0.34;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(random: () => number) {
  const u = Math.max(random(), 1e-6);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
}

/** Spaces points evenly by arc length so particle density stays uniform. */
function resample(points: Vector3[], count: number): Vector3[] {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    lengths.push(lengths[i - 1] + points[i].distanceTo(points[i - 1]));
  }
  const total = lengths[lengths.length - 1];
  const out: Vector3[] = [];
  let cursor = 0;
  for (let i = 0; i < count; i++) {
    const target = (i / (count - 1)) * total;
    while (cursor < lengths.length - 2 && lengths[cursor + 1] < target) cursor++;
    const span = lengths[cursor + 1] - lengths[cursor] || 1;
    const k = (target - lengths[cursor]) / span;
    out.push(points[cursor].clone().lerp(points[cursor + 1], k));
  }
  return out;
}

const OUTER_START = (-18 * Math.PI) / 180;
const OUTER_END = (305 * Math.PI) / 180;

function outerRadius(theta: number) {
  const k = (theta - OUTER_START) / (OUTER_END - OUTER_START);
  return 0.9 + k * 0.22;
}

/** The @ drawn the way a pen would: bowl, stem, hook, then the outer spiral. */
function glyphStroke(): Vector3[] {
  const points: Vector3[] = [];

  const bowlCentre = new Vector3(-0.08, 0.02, 0);
  for (let i = 0; i <= 200; i++) {
    const theta = Math.PI * 0.1 + (i / 200) * Math.PI * 2;
    points.push(new Vector3(bowlCentre.x + Math.cos(theta) * 0.4, bowlCentre.y + Math.sin(theta) * 0.44, 0));
  }

  const hook = new CatmullRomCurve3([
    new Vector3(0.32, 0.46, 0),
    new Vector3(0.32, 0.1, 0),
    new Vector3(0.33, -0.2, 0),
    new Vector3(0.44, -0.38, 0),
    new Vector3(0.64, -0.4, 0),
    new Vector3(Math.cos(OUTER_START) * outerRadius(OUTER_START), Math.sin(OUTER_START) * outerRadius(OUTER_START), 0),
  ]);
  points.push(...hook.getPoints(120));

  for (let i = 0; i <= 400; i++) {
    const theta = OUTER_START + (i / 400) * (OUTER_END - OUTER_START);
    const radius = outerRadius(theta);
    points.push(new Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0));
  }

  // A slow ripple in depth, so the glyph reads as a ribbon rather than a decal.
  points.forEach((point, index) => {
    point.z = Math.sin(index * 0.012) * 0.09;
  });
  return points;
}

/** The stroke continues past the glyph as a spiral receding into the distance. */
function tailStroke(from: Vector3): Vector3[] {
  const points: Vector3[] = [];
  const turns = 3.4;
  for (let i = 1; i <= 900; i++) {
    const k = i / 900;
    const theta = OUTER_END + k * turns * Math.PI * 2;
    const radius = outerRadius(OUTER_END) + Math.pow(k, 1.4) * 5.2;
    points.push(new Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, from.z - Math.pow(k, 1.2) * 19));
  }
  return points;
}

/**
 * Bakes the full path into RGBA floats: xyz is position, w is stream width.
 * The order runs from the far tail into the bowl, so that increasing t reads
 * as mail arriving at the address.
 */
export function buildStroke(): Float32Array {
  const glyph = glyphStroke();
  const tail = tailStroke(glyph[glyph.length - 1]);

  const tailCount = Math.round(CURVE_SIZE * TAIL_SHARE);
  const tailPoints = resample([...tail].reverse(), tailCount);
  const glyphPoints = resample([...glyph].reverse(), CURVE_SIZE - tailCount);

  const data = new Float32Array(CURVE_SIZE * 4);
  tailPoints.forEach((point, index) => {
    const k = index / tailCount;
    data.set([point.x, point.y, point.z, 0.04 + Math.pow(1 - k, 1.6) * 0.5], index * 4);
  });
  glyphPoints.forEach((point, index) => {
    data.set([point.x, point.y, point.z, 0.042], (tailCount + index) * 4);
  });
  return data;
}

/** Reads a position off the baked stroke; used to place the 3D envelopes. */
export function sampleStroke(stroke: Float32Array, t: number, target: Vector3) {
  const index = Math.min(CURVE_SIZE - 1, Math.max(0, Math.floor(t * CURVE_SIZE))) * 4;
  return target.set(stroke[index], stroke[index + 1], stroke[index + 2]);
}

export interface FieldAttributes {
  seed: Float32Array;
  offset: Float32Array;
  arm: Float32Array;
  ring: Float32Array;
  envelope: Float32Array;
  galaxy: Float32Array;
}

function envelopePoint(random: () => number, out: Float32Array, index: number) {
  const width = 1.9;
  const height = 1.25;
  const flapDepth = 0.16;
  const pick = random();
  let x: number;
  let y: number;
  let z = 0;

  if (pick < 0.42) {
    // Outer edge of the envelope.
    const edge = random() * (width + height) * 2;
    if (edge < width * 2) {
      x = (random() * 2 - 1) * width;
      y = edge < width ? height : -height;
    } else {
      x = edge < width * 2 + height ? width : -width;
      y = (random() * 2 - 1) * height;
    }
  } else if (pick < 0.72) {
    // The flap: two creases meeting just below the centre.
    const k = random();
    const side = random() < 0.5 ? -1 : 1;
    x = side * width * (1 - k);
    y = height - k * (height + 0.1);
    z = k * flapDepth;
  } else if (pick < 0.84) {
    // The lower folds rising to the flap point.
    const k = random();
    const side = random() < 0.5 ? -1 : 1;
    x = side * width * (1 - k * 0.92);
    y = -height + k * (height - 0.14);
    z = k * flapDepth * 0.5;
  } else {
    // A faint sheet of paper filling the body.
    x = (random() * 2 - 1) * width;
    y = (random() * 2 - 1) * height;
    z = -0.05;
  }

  out.set([x + gaussian(random) * 0.008, y + gaussian(random) * 0.008, z + gaussian(random) * 0.012], index * 3);
}

function galaxyPoint(random: () => number, out: Float32Array, index: number) {
  const arms = 3;
  const arm = index % arms;
  const spread = Math.pow(random(), 0.62);
  const radius = 0.25 + spread * 7.2;
  const theta = (arm / arms) * Math.PI * 2 + Math.log(radius + 0.4) * 2.5 + (gaussian(random) * 0.34) / (spread * 2.4 + 0.5);
  out.set(
    [Math.cos(theta) * radius, Math.sin(theta) * radius, gaussian(random) * (0.04 + (1 - spread) * 0.16)],
    index * 3,
  );
}

/** All particle data is generated once, seeded so every visit looks the same. */
export function buildField(count: number): FieldAttributes {
  const random = mulberry32(20260611);
  const seed = new Float32Array(count * 4);
  const offset = new Float32Array(count * 3);
  const arm = new Float32Array(count);
  const ring = new Float32Array(count * 3);
  const envelope = new Float32Array(count * 3);
  const galaxy = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    seed.set([random(), random(), 0.5 + random() * random() * 1.5, random()], i * 4);
    offset.set([gaussian(random), gaussian(random), gaussian(random)], i * 3);
    arm[i] = i % 4;

    const angle = random() * Math.PI * 2;
    const radius = 1.05 + arm[i] * 0.34 + gaussian(random) * 0.012;
    ring.set([Math.cos(angle) * radius, Math.sin(angle) * radius, gaussian(random) * 0.012], i * 3);

    envelopePoint(random, envelope, i);
    galaxyPoint(random, galaxy, i);
  }

  return { seed, offset, arm, ring, envelope, galaxy };
}

/** Particle budget by device. The field also sheds load at runtime if needed. */
export function particleBudget(width: number, cores: number) {
  if (width < 768) return 16_000;
  if (cores <= 4) return 30_000;
  return 60_000;
}
