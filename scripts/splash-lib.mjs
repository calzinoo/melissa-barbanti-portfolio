// Shared helpers for the splash texture generators (seeded RNG, blobs, veins, SVG wrapper).
export const W = 1600;
export const H = 1000;


export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const f = (n) => String(Math.round(n * 10) / 10);

/** Smooth closed blob (Catmull-Rom -> cubic bezier). */
export function blob(r, cx, cy, rad, n = 9) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = rad * (0.62 + r() * 0.7);
    pts.push([cx + Math.cos(a) * k * 1.15, cy + Math.sin(a) * k * 0.85]);
  }
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + "Z";
}

/** Thin wandering vein, like gold leaking through the paint. */
export function vein(r, x, y, ang, len) {
  let d = `M${f(x)} ${f(y)}`;
  const steps = 5;
  for (let i = 0; i < steps; i++) {
    const s = len / steps;
    ang += (r() - 0.5) * 1.3;
    const x1 = x + Math.cos(ang + 0.5) * s * 0.5, y1 = y + Math.sin(ang + 0.5) * s * 0.5;
    x += Math.cos(ang) * s; y += Math.sin(ang) * s;
    d += `Q${f(x1)} ${f(y1)} ${f(x)} ${f(y)}`;
  }
  return d;
}

export const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
export const inCenter = (x, y) => x > W * 0.28 && x < W * 0.72 && y > H * 0.22 && y < H * 0.8;
export const CORNERS = [[0, 0], [W, 0], [0, H], [W, H], [W * 0.5, H], [W * 0.5, 0]];

/** Picks up to 5 corner clusters where the paint accumulates, leaving the center clear. */
export function pickCorners(r) {
  return CORNERS.filter(() => r() > 0.25).slice(0, 5);
}

/** Wraps layers into the final SVG; `disp` is the wobble of the main layer. */
export function wrap(seed, { wash = "", body = "", ribbons = "", top = "" }, disp = 130) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
    `<defs><filter id="o" x="-20%" y="-20%" width="140%" height="140%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.007 0.011" numOctaves="4" seed="${seed % 97}" result="t"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="t" scale="${disp}" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="1.6"/></filter>` +
    `<filter id="w" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="55"/></filter>` +
    `<filter id="r" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="5" result="q"/><feDisplacementMap in="SourceGraphic" in2="q" scale="40"/><feGaussianBlur stdDeviation="2.5"/></filter>` +
    `<filter id="s"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="${seed % 31}" result="u"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="u" scale="14"/></filter></defs>` +
    `<g filter="url(#w)">${wash}</g><g filter="url(#o)">${body}</g><g filter="url(#r)">${ribbons}</g><g filter="url(#s)">${top}</g></svg>`
  );
}
