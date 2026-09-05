// Writes the intrinsic pixel size of every gallery photo to
// src/data/gallery-dims.json, keyed by the same src path gallery.json uses.
//
// The gallery grid is a CSS column masonry with lazily loaded photos of
// varying height. With no width/height on the <img> the browser cannot
// reserve a box, so every photo that arrives shoves the ones below it - a
// large cumulative layout shift on the page with the most images on it.
//
// The sizes live here rather than in gallery.json because that file is edited
// through the CMS, which would drop fields its schema does not declare, and
// they are precomputed rather than read at build time so the build needs no
// image library on the server.
import sharp from 'sharp';
import { readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const DIR = path.resolve('./public/images/gallery');
const out = {};
for (const f of readdirSync(DIR).filter((n) => n.endsWith('.webp'))) {
  const m = await sharp(path.join(DIR, f)).metadata();
  out['/images/gallery/' + f] = { w: m.width, h: m.height };
}
writeFileSync(
  path.resolve('./src/data/gallery-dims.json'),
  JSON.stringify(out, null, 2) + '\n'
);
console.log('gallery-dims.json:', Object.keys(out).length, 'photos');
