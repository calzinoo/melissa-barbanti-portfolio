// Styles inspired by two canvases: "materia" (black/white/coral mass with gold halo) and "cosmo" (blue orb with copper rim).
import { blob, f, inCenter, pick, pickCorners, rng, vein, wrap } from "./splash-lib.mjs";

const away = (r, cx0, cy0, sx = 500, sy = 420) => {
  let x, y, tries = 0;
  do {
    x = cx0 + (r() - 0.5) * sx;
    y = cy0 + (r() - 0.5) * sy;
  } while (inCenter(x, y) && ++tries < 20);
  return [x, y];
};

/** Dense mass of overlapping black, white, grey and coral cells laced with gold, under a golden arc. */
export function materia({ seed }) {
  const r = rng(seed);
  const dark = ["#14120f", "#2a2420", "#4a2f27"], light = ["#8a8478", "#6e695f", "#5a554c"];
  const hot = ["#e2472a", "#f0805a", "#c4604a"], gold = "#c9a24a";
  let wash = "", body = "", ribbons = "", top = "";
  for (const [cx, cy] of pickCorners(r)) {
    // golden halo: thick dry-brush arc made of parallel strokes
    const R = 300 + r() * 160, a0 = r() * 6.28, sweep = 1.6 + r() * 1.4;
    for (let k = 0; k < 9; k++) {
      const rr = R + (k - 4) * 5, a1 = a0 + sweep * (0.85 + r() * 0.15);
      const p = (a) => `${f(cx + Math.cos(a) * rr)} ${f(cy + Math.sin(a) * rr)}`;
      top += `<path d="M${p(a0)}A${f(rr)} ${f(rr)} 0 ${sweep > Math.PI ? 1 : 0} 1 ${p(a1)}" fill="none" stroke="${gold}" stroke-width="${f(5 + r() * 9)}" stroke-linecap="round" stroke-opacity="${f(0.5 + r() * 0.4)}"/>`;
    }
    for (let i = 0, n = 16 + Math.floor(r() * 6); i < n; i++) {
      const [x, y] = away(r, cx, cy, 380, 330), rad = 70 + r() * 120;
      const col = r() > 0.45 ? pick(r, dark) : r() > 0.4 ? pick(r, light) : pick(r, hot);
      body += `<path d="${blob(r, x, y, rad, 12)}" fill="${col}" fill-opacity="0.95"/>`;
      if (r() > 0.4) body += `<path d="${blob(r, x + (r() - 0.5) * rad * 0.5, y + (r() - 0.5) * rad * 0.5, rad * 0.45, 8)}" fill="${pick(r, r() > 0.5 ? light : hot)}" fill-opacity="0.85"/>`;
    }
    for (let i = 0; i < 6; i++) {
      const [x, y] = away(r, cx, cy, 460, 400);
      ribbons += `<path d="${vein(r, x, y, r() * 6.28, 200 + r() * 260)}" fill="none" stroke="${pick(r, light)}" stroke-width="${f(3 + r() * 9)}" stroke-linecap="round" stroke-opacity="0.5"/>`;
    }
    for (let i = 0; i < 11; i++) {
      const [x, y] = away(r, cx, cy, 480, 420);
      top += `<path d="${vein(r, x, y, r() * 6.28, 200 + r() * 300)}" fill="none" stroke="${gold}" stroke-width="${f(1 + r() * 1.8)}" stroke-linecap="round" stroke-opacity="0.85"/>`;
    }
    for (let i = 0; i < 28; i++) {
      const [x, y] = away(r, cx, cy, 780, 640);
      top += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1 + r() * r() * 7)}" fill="${r() > 0.5 ? pick(r, hot) : pick(r, dark)}" fill-opacity="0.9"/>`;
    }
  }
  return wrap(seed, { wash, body, ribbons, top }, 85);
}

/** Glowing blue orbs with a copper rim, white impasto highlights and copper dabs. */
export function cosmo({ seed }) {
  const r = rng(seed);
  const blues = ["#0a2a6b", "#1456b0", "#1f68ae", "#0b1c48"], pale = ["#6ea2d2", "#4d88c2", "#86b2dc"];
  const copper = ["#d0662a", "#e8964a", "#8f3f1b"];
  let wash = "", body = "", ribbons = "", top = "", n = 0;
  for (const [cx, cy] of pickCorners(r)) {
    for (let g = 0; g < 2; g++) {
      const [x, y] = away(r, cx, cy, 380, 320), R = 150 + r() * 170, id = `g${n++}`;
      wash += `<radialGradient id="${id}"><stop offset="0" stop-color="${blues[2]}" stop-opacity="0.9"/><stop offset="0.55" stop-color="${blues[1]}" stop-opacity="0.7"/><stop offset="1" stop-color="${blues[3]}" stop-opacity="0"/></radialGradient><circle cx="${f(x)}" cy="${f(y)}" r="${f(R * 1.25)}" fill="url(#${id})"/>`;
      for (let k = 0; k < 5; k++) {
        body += `<path d="${blob(r, x + (r() - 0.5) * R * 0.5, y + (r() - 0.5) * R * 0.5, R * (0.25 + r() * 0.35), 11)}" fill="${pick(r, blues)}" fill-opacity="${f(0.7 + r() * 0.3)}"/>`;
      }
      // copper rim: broken arc
      const a0 = r() * 6.28, circ = 2 * Math.PI * R;
      body += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(R)}" fill="none" stroke="${pick(r, copper)}" stroke-width="${f(5 + r() * 7)}" stroke-linecap="round" stroke-dasharray="${f(circ * (0.45 + r() * 0.3))} ${f(circ)}" transform="rotate(${f((a0 * 180) / Math.PI)} ${f(x)} ${f(y)})" stroke-opacity="0.95"/>`;
      for (let k = 0; k < 9; k++) {
        const a = r() * 6.28, d = R * (0.2 + r() * 0.8);
        ribbons += `<path d="${vein(r, x + Math.cos(a) * d, y + Math.sin(a) * d, a + 1.5, 60 + r() * 120)}" fill="none" stroke="${pick(r, pale)}" stroke-width="${f(4 + r() * 12)}" stroke-linecap="round" stroke-opacity="${f(0.4 + r() * 0.5)}"/>`;
      }
      for (let k = 0; k < 18; k++) {
        const a = r() * 6.28, d = R * (0.5 + r() * 0.7);
        top += `<circle cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d)}" r="${f(1 + r() * r() * 5)}" fill="${r() > 0.4 ? pick(r, pale) : pick(r, copper)}" fill-opacity="0.9"/>`;
      }
    }
  }
  return wrap(seed, { wash, body, ribbons, top }, 55);
}
