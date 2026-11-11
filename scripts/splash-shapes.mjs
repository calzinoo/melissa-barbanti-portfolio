// Extra paint styles inspired by the canvases: petals, marbling, gold veins.
import { blob, f, inCenter, pick, pickCorners, rng, vein, wrap } from "./splash-lib.mjs";

const away = (r, cx0, cy0, sx = 500, sy = 420) => {
  let x, y, tries = 0;
  do {
    x = cx0 + (r() - 0.5) * sx;
    y = cy0 + (r() - 0.5) * sy;
  } while (inCenter(x, y) && ++tries < 20);
  return [x, y];
};

/** Flower rosettes made of two rings of petals. */
export function petals({ seed, blobs, pale, vein: veinColor, specks }) {
  const r = rng(seed);
  let body = "", top = "", wash = "";
  for (const [cx0, cy0] of pickCorners(r)) {
    wash += `<circle cx="${f(cx0)}" cy="${f(cy0)}" r="${f(260 + r() * 120)}" fill="${pick(r, blobs)}" fill-opacity="0.3"/>`;
    for (let i = 0, n = 3 + Math.floor(r() * 2); i < n; i++) {
      const [x, y] = away(r, cx0, cy0);
      const R = 120 + r() * 140, count = 6 + Math.floor(r() * 4), rot = r() * 6.28;
      for (const ring of [1, 0.62]) {
        for (let k = 0; k < count; k++) {
          const a = rot + (k / count) * 6.28 + (ring < 1 ? Math.PI / count : 0), d = R * ring * 0.55;
          const px = f(x + Math.cos(a) * d), py = f(y + Math.sin(a) * d);
          body += `<ellipse cx="${px}" cy="${py}" rx="${f(R * ring * 0.55)}" ry="${f(R * ring * 0.22)}" transform="rotate(${f((a * 180) / Math.PI)} ${px} ${py})" fill="${pick(r, blobs)}" fill-opacity="${f(0.7 + r() * 0.3)}"/>`;
        }
      }
      body += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(R * 0.17)}" fill="${pick(r, pale)}" fill-opacity="0.9"/>`;
      for (let k = 0; k < 14; k++) {
        const a = r() * 6.28, d = R * (0.1 + r() * 0.2);
        top += `<circle cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d)}" r="${f(1.5 + r() * 3)}" fill="${pick(r, specks)}"/>`;
      }
    }
    top += `<path d="${vein(r, cx0, cy0, r() * 6.28, 300)}" fill="none" stroke="${veinColor}" stroke-width="2" stroke-opacity="0.7"/>`;
  }
  return wrap(seed, { wash, body, top }, 40);
}

/** Wide swirling bands, like marbled paper. */
export function marble({ seed, blobs, pale, vein: veinColor }) {
  const r = rng(seed);
  let body = "", ribbons = "", wash = "";
  for (const [cx0, cy0] of pickCorners(r)) {
    wash += `<circle cx="${f(cx0)}" cy="${f(cy0)}" r="320" fill="${pick(r, blobs)}" fill-opacity="0.35"/>`;
    for (let i = 0; i < 7; i++) {
      const [x, y] = away(r, cx0, cy0, 600, 500);
      body += `<path d="${vein(r, x, y, r() * 6.28, 500 + r() * 400)}" fill="none" stroke="${pick(r, i % 3 ? blobs : pale)}" stroke-width="${f(30 + r() * 70)}" stroke-linecap="round" stroke-opacity="${f(0.5 + r() * 0.4)}"/>`;
    }
    for (let i = 0; i < 8; i++) {
      const [x, y] = away(r, cx0, cy0, 600, 500);
      ribbons += `<path d="${vein(r, x, y, r() * 6.28, 400 + r() * 400)}" fill="none" stroke="${i % 2 ? veinColor : pick(r, pale)}" stroke-width="${f(1.5 + r() * 4)}" stroke-linecap="round" stroke-opacity="0.75"/>`;
    }
  }
  return wrap(seed, { wash, body, ribbons }, 190);
}

/** Delicate gold veins branching from the corners over dark pours. */
export function veins({ seed, blobs, pale, vein: veinColor, specks }) {
  const r = rng(seed);
  let body = "", top = "", wash = "";
  for (const [cx0, cy0] of pickCorners(r)) {
    wash += `<circle cx="${f(cx0)}" cy="${f(cy0)}" r="260" fill="${pick(r, blobs)}" fill-opacity="0.35"/>`;
    const [bx, by] = away(r, cx0, cy0, 300, 250);
    body += `<path d="${blob(r, bx, by, 110 + r() * 80)}" fill="${blobs[blobs.length - 1]}" fill-opacity="0.85"/>`;
    for (let i = 0; i < 16; i++) {
      const [x, y] = away(r, cx0, cy0, 380, 320);
      top += `<path d="${vein(r, x, y, r() * 6.28, 300 + r() * 450)}" fill="none" stroke="${i % 3 ? veinColor : pick(r, pale)}" stroke-width="${f(0.8 + r() * 2.4)}" stroke-linecap="round" stroke-opacity="${f(0.5 + r() * 0.45)}"/>`;
    }
    for (let i = 0; i < 70; i++) {
      const [x, y] = away(r, cx0, cy0, 800, 650);
      top += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.8 + r() * r() * 6)}" fill="${pick(r, specks)}" fill-opacity="${f(0.6 + r() * 0.4)}"/>`;
    }
  }
  return wrap(seed, { wash, body, top }, 90);
}
