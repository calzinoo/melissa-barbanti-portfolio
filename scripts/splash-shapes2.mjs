// More paint styles: splatter, dry-brush strokes, fluid-art cells, watercolor washes.
import { blob, f, inCenter, pick, pickCorners, rng, vein, wrap } from "./splash-lib.mjs";

const away = (r, cx0, cy0, sx = 500, sy = 420) => {
  let x, y, tries = 0;
  do {
    x = cx0 + (r() - 0.5) * sx;
    y = cy0 + (r() - 0.5) * sy;
  } while (inCenter(x, y) && ++tries < 20);
  return [x, y];
};

/** Action-painting splatter: a core blob with radial streaks ending in droplets. */
export function splatter({ seed, blobs, pale, specks }) {
  const r = rng(seed);
  let body = "", top = "", wash = "";
  for (const [cx0, cy0] of pickCorners(r)) {
    wash += `<circle cx="${f(cx0)}" cy="${f(cy0)}" r="240" fill="${pick(r, blobs)}" fill-opacity="0.25"/>`;
    for (let g = 0; g < 2; g++) {
      const [x, y] = away(r, cx0, cy0, 440, 380);
      const col = pick(r, blobs);
      body += `<path d="${blob(r, x, y, 40 + r() * 50, 11)}" fill="${col}" fill-opacity="0.95"/>`;
      for (let k = 0, n = 26 + Math.floor(r() * 18); k < n; k++) {
        const a = r() * 6.28, len = 60 + r() * r() * 380, w = 1.5 + r() * 5;
        const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
        const c = r() > 0.25 ? col : pick(r, pale);
        top += `<path d="M${f(x)} ${f(y)}L${f(ex)} ${f(ey)}" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round" stroke-opacity="0.85"/><circle cx="${f(ex)}" cy="${f(ey)}" r="${f(w * (1.2 + r() * 1.6))}" fill="${c}" fill-opacity="0.9"/>`;
      }
      for (let k = 0; k < 40; k++) {
        const a = r() * 6.28, d = 80 + r() * 480;
        top += `<circle cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d)}" r="${f(0.8 + r() * r() * 6)}" fill="${pick(r, specks)}" fill-opacity="0.85"/>`;
      }
    }
  }
  return wrap(seed, { wash, body, top }, 25);
}

/**
 * "Pennellate": swirling poured flows like the artist's fluid canvases: deep navy masses,
 * slate/teal bands, white lacing and thin copper veins with metallic flakes.
 * Uses its own palette (ignores the shared one); the site recolors it via hue-rotate.
 */
export function brush({ seed }) {
  const r = rng(seed);
  const dark = ["#080d18", "#101c30", "#1a2f4d"], mid = ["#25496b", "#2f6a82", "#3d5a78"];
  const pale = ["#7a92a6", "#5c7890", "#8c9ba2"], copper = ["#c8672a", "#e39a45", "#8f3f1b"];
  const centers = pickCorners(r).map(([cx, cy]) => away(r, cx, cy, 300, 260));
  const noisePh = [r() * 6.28, r() * 6.28, r() * 6.28];
  // vector field: swirl around the cluster centers plus a slow wobble
  const angleAt = (x, y) => {
    let vx = Math.cos(x / 170 + noisePh[0]) * 0.5, vy = Math.sin(y / 140 + noisePh[1]) * 0.5;
    for (const [cx, cy] of centers) {
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) + 20, w = Math.min(1.6, 260 / d);
      vx += (-dy / d) * w + (dx / d) * w * 0.35;
      vy += (dx / d) * w + (dy / d) * w * 0.35;
    }
    return Math.atan2(vy, vx);
  };
  const flow = (x, y, steps, stepLen, flip) => {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const a = angleAt(x, y) + (flip ? Math.PI : 0);
      pts.push([x, y, a, i / steps]);
      x += Math.cos(a) * stepLen;
      y += Math.sin(a) * stepLen;
    }
    return pts;
  };
  const ribbon = (pts, width) => {
    const prof = (t) => width * Math.max(0.12, Math.sin(Math.PI * Math.min(1, t * 0.92 + 0.04)) ** 0.7);
    const side = (sg) => pts.map(([x, y, a, t]) => [x - Math.sin(a) * prof(t) * sg, y + Math.cos(a) * prof(t) * sg]);
    return [...side(1), ...side(-1).reverse()].map(([x, y], i) => `${i ? "L" : "M"}${f(x)} ${f(y)}`).join("") + "Z";
  };
  const line = (pts) => pts.map(([x, y], i) => `${i ? "L" : "M"}${f(x)} ${f(y)}`).join("");
  let wash = "", body = "", ribbons = "", top = "";
  for (const [cx, cy] of centers) {
    wash += `<circle cx="${f(cx)}" cy="${f(cy)}" r="380" fill="${pick(r, dark)}" fill-opacity="0.4"/>`;
    for (let i = 0; i < 6; i++) {
      const [x, y] = away(r, cx, cy, 460, 400), pts = flow(x, y, 46, 14, r() > 0.5);
      body += `<path d="${ribbon(pts, 55 + r() * 80)}" fill="${pick(r, dark)}" fill-opacity="0.95"/>`;
    }
    for (let i = 0; i < 5; i++) {
      const [x, y] = away(r, cx, cy, 500, 420), pts = flow(x, y, 40, 14, r() > 0.5);
      body += `<path d="${ribbon(pts, 22 + r() * 40)}" fill="${pick(r, mid)}" fill-opacity="${f(0.75 + r() * 0.25)}"/>`;
    }
    for (let i = 0; i < 12; i++) {
      const [x, y] = away(r, cx, cy, 560, 460), pts = flow(x, y, 34, 14, r() > 0.5);
      ribbons += `<path d="${ribbon(pts, 5 + r() * 16)}" fill="${pick(r, pale)}" fill-opacity="${f(0.55 + r() * 0.4)}"/>`;
      if (r() > 0.55) ribbons += `<path d="${blob(r, pts[12][0], pts[12][1], 24 + r() * 30, 9)}" fill="${pick(r, pale)}" fill-opacity="0.6"/>`;
    }
    for (let i = 0; i < 15; i++) {
      const [x, y] = away(r, cx, cy, 560, 480), pts = flow(x, y, 38, 12, r() > 0.5);
      top += `<path d="${line(pts)}" fill="none" stroke="${pick(r, copper)}" stroke-width="${f(1.5 + r() * 4)}" stroke-linecap="round" stroke-opacity="${f(0.7 + r() * 0.3)}"/>`;
      for (let k = 0; k < 7; k++) {
        const q = pts[Math.floor(r() * pts.length)];
        top += `<circle cx="${f(q[0] + (r() - 0.5) * 24)}" cy="${f(q[1] + (r() - 0.5) * 24)}" r="${f(1 + r() * r() * 5)}" fill="${pick(r, copper)}" fill-opacity="0.95"/>`;
      }
    }
    // metallic copper glitter patches
    for (let g = 0; g < 2; g++) {
      const [gx, gy] = away(r, cx, cy, 480, 400);
      for (let k = 0; k < 60; k++) {
        const a = r() * 6.28, d = r() * r() * 110;
        top += `<circle cx="${f(gx + Math.cos(a) * d)}" cy="${f(gy + Math.sin(a) * d)}" r="${f(1.5 + r() * 4.5)}" fill="${pick(r, copper)}" fill-opacity="${f(0.7 + r() * 0.3)}"/>`;
      }
    }
  }
  return wrap(seed, { wash, body, ribbons, top }, 120);
}

/** Fluid-art cells: nested organic rings with lacing, like poured acrylic. */
export function cells({ seed, blobs, pale, vein: veinColor }) {
  const r = rng(seed);
  let body = "", top = "", wash = "";
  for (const [cx0, cy0] of pickCorners(r)) {
    wash += `<circle cx="${f(cx0)}" cy="${f(cy0)}" r="300" fill="${pick(r, blobs)}" fill-opacity="0.3"/>`;
    for (let g = 0, n = 5 + Math.floor(r() * 4); g < n; g++) {
      const [x, y] = away(r, cx0, cy0, 560, 460);
      const R = 38 + r() * 80;
      body += `<path d="${blob(r, x, y, R * 1.5, 12)}" fill="${pick(r, blobs)}" fill-opacity="0.9"/>`;
      body += `<path d="${blob(r, x, y, R, 10)}" fill="${pick(r, pale)}" fill-opacity="0.9"/>`;
      body += `<path d="${blob(r, x, y, R * 0.5, 8)}" fill="${pick(r, blobs)}" fill-opacity="0.95"/>`;
      top += `<path d="${blob(r, x, y, R * 1.25, 12)}" fill="none" stroke="${veinColor}" stroke-width="1.5" stroke-opacity="0.55"/>`;
    }
  }
  return wrap(seed, { wash, body, top }, 95);
}

/** Soft watercolor blooms with darker pigment edges. */
export function watercolor({ seed, blobs, pale }) {
  const r = rng(seed);
  let body = "", wash = "", ribbons = "";
  for (const [cx0, cy0] of pickCorners(r)) {
    for (let g = 0, n = 3 + Math.floor(r() * 3); g < n; g++) {
      const [x, y] = away(r, cx0, cy0, 480, 400);
      const d = blob(r, x, y, 110 + r() * 150, 12), col = pick(r, blobs);
      wash += `<path d="${d}" fill="${col}" fill-opacity="0.4"/>`;
      body += `<path d="${d}" fill="${col}" fill-opacity="0.22" stroke="${col}" stroke-width="${f(3 + r() * 5)}" stroke-opacity="0.6"/>`;
      ribbons += `<path d="${blob(r, x, y, 70 + r() * 60, 9)}" fill="${pick(r, pale)}" fill-opacity="0.18"/>`;
    }
  }
  return wrap(seed, { wash, body, ribbons }, 110);
}
