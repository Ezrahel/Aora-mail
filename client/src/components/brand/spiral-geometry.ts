/**
 * The Aora @, drawn once. The logo, favicons and social cards all read from
 * here, so they stay the same shape. Keep this file free of imports: the icon
 * script runs it directly in Node.
 */

function polar(radius: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  return [50 + Math.cos(radians) * radius, 50 - Math.sin(radians) * radius];
}

const OUTER = Array.from({ length: 49 }, (_, index) => polar(38 + (index / 48) * 9, -18 + (index / 48) * 323));

export const BOWL = { cx: 46, cy: 49, rx: 16.5, ry: 18 };

/** The stem, its hook, and the outer spiral as one continuous stroke. */
export const STROKE = `M 62 33 V 58 C 62 68 74 68 79 58 L ${OUTER.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L ")}`;

function cubic(a: number, b: number, c: number, d: number, t: number) {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

/** The mark as a dense run of points, for drawing it out of particles. */
export function markOutline(): number[][] {
  const bowl = Array.from({ length: 90 }, (_, index) => {
    const angle = (index / 90) * Math.PI * 2;
    return [BOWL.cx + Math.cos(angle) * BOWL.rx, BOWL.cy + Math.sin(angle) * BOWL.ry];
  });
  const stem = Array.from({ length: 26 }, (_, index) => [62, 33 + (index / 25) * 25]);
  const hook = Array.from({ length: 20 }, (_, index) => {
    const t = index / 19;
    return [cubic(62, 62, 74, 79, t), cubic(58, 68, 68, 58, t)];
  });
  const outer: number[][] = [];
  for (let i = 0; i < OUTER.length - 1; i++) {
    for (let step = 0; step < 5; step++) {
      const k = step / 5;
      outer.push([
        OUTER[i][0] + (OUTER[i + 1][0] - OUTER[i][0]) * k,
        OUTER[i][1] + (OUTER[i + 1][1] - OUTER[i][1]) * k,
      ]);
    }
  }
  return [...bowl, ...stem, ...hook, ...outer];
}
