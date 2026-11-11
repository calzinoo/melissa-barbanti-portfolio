// "Colature": corner pours with marbled cells, ribbons, veins and drips.
import { H, W, blob, f, inCenter, pick, pickCorners, rng, vein, wrap } from "./splash-lib.mjs";

export function pour({ seed, blobs, pale, vein: veinColor, specks }) {
  const r = rng(seed);
  const active = pickCorners(r);
  let body = "";
  let wash = "";
  let ribbons = "";
  let top = "";
  const dripX = [];
  for (const [cx0, cy0] of active) {
    const clusterBlobs = 4 + Math.floor(r() * 3);
    for (let i = 0; i < clusterBlobs; i++) {
      let x, y, tries = 0;
      do {
        x = cx0 + (r() - 0.5) * 520;
        y = cy0 + (r() - 0.5) * 420;
      } while (inCenter(x, y) && ++tries < 20);
      const rad = 70 + r() * 170;
      const col = pick(r, blobs);
      body += `<path d="${blob(r, x, y, rad)}" fill="${col}" fill-opacity="${f(0.7 + r() * 0.3)}"/>`;
      // marbled pale cell inside the pour
      if (r() > 0.35) {
        body += `<path d="${blob(r, x + (r() - 0.5) * rad * 0.4, y + (r() - 0.5) * rad * 0.4, rad * (0.3 + r() * 0.25), 7)}" fill="${pick(r, pale)}" fill-opacity="${f(0.55 + r() * 0.4)}"/>`;
      }
    }
    for (let i = 0; i < 2; i++) {
      wash += `<circle cx="${f(cx0 + (r() - 0.5) * 300)}" cy="${f(cy0 + (r() - 0.5) * 260)}" r="${f(220 + r() * 160)}" fill="${pick(r, blobs)}" fill-opacity="0.35"/>`;
    }
    for (let i = 0; i < 4; i++) {
      const x = cx0 + (r() - 0.5) * 420, y = cy0 + (r() - 0.5) * 360;
      if (inCenter(x, y)) continue;
      ribbons += `<path d="${vein(r, x, y, r() * 6.28, 260 + r() * 300)}" fill="none" stroke="${pick(r, pale)}" stroke-width="${f(5 + r() * 16)}" stroke-linecap="round" stroke-opacity="${f(0.35 + r() * 0.4)}"/>`;
    }
    for (let i = 0; i < 5; i++) {
      const x = cx0 + (r() - 0.5) * 460, y = cy0 + (r() - 0.5) * 380;
      if (inCenter(x, y)) continue;
      top += `<path d="${vein(r, x, y, r() * 6.28, 220 + r() * 380)}" fill="none" stroke="${veinColor}" stroke-width="${f(1 + r() * 2.6)}" stroke-linecap="round" stroke-opacity="${f(0.55 + r() * 0.4)}"/>`;
    }
    for (let i = 0; i < 60; i++) {
      const x = cx0 + (r() - 0.5) * 900, y = cy0 + (r() - 0.5) * 760;
      if (inCenter(x, y)) continue;
      top += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1 + r() * r() * 9)}" fill="${pick(r, specks)}" fill-opacity="${f(0.6 + r() * 0.4)}"/>`;
    }
    if (cy0 === 0) dripX.push(cx0);
  }
  // paint drips falling from the top edge
  for (const dx of dripX) {
    for (let i = 0; i < 3; i++) {
      const x = dx + (r() - 0.5) * 360, len = 80 + r() * 230, w = 5 + r() * 9;
      const col = pick(r, blobs);
      top += `<path d="M${f(x)} 0V${f(len)}" stroke="${col}" stroke-width="${f(w)}" stroke-linecap="round" fill="none" stroke-opacity="0.85"/><circle cx="${f(x)}" cy="${f(len)}" r="${f(w * 0.85)}" fill="${col}" fill-opacity="0.85"/>`;
    }
  }
  return wrap(seed, { wash, body, ribbons, top });
}
