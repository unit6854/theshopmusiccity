import sharp from 'sharp';
import { mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';

const SRC = path.resolve('../Images');
const GAL = path.join(SRC, 'gallery-src');
const SVC = path.join(SRC, 'Services thumbs');
const FAV = path.join(SRC, 'Favorites');
const OUT = path.resolve('./public/images');
const GOUT = path.join(OUT, 'gallery');
mkdirSync(OUT, { recursive: true });
mkdirSync(GOUT, { recursive: true });

// General assets: 92 keeps WebP well under the source JPEGs while staying
// visually lossless at the sizes they render.
const Q = { quality: 92, effort: 6 };
// Hero, title plate and the owner shot run at 100 - they are the largest
// things on screen and the ones worth the bytes.
const QHI = { quality: 100, effort: 6 };
const kb = (n) => (n / 1024).toFixed(0) + 'KB';

// Service card thumbs sit above the card body at 4:3.
const CARD_W = 800;
const CARD_H = 600;

// The masonry grid renders at ~260-360 CSS px wide, so 720 covers 2x displays
// without shipping the 1100px originals for all 33 photos.
const GAL_W = 720;

// [source in Images/, output, max width, webp opts]
// Hero_final 2.png replaces the earlier hero and is used exactly as framed -
// no trim, and the section's aspect-ratio matches it so nothing is cropped.
const HERO_SRC = 'Hero_final 2.png';

const large = [
  ['Working Justin.jpg', 'owner-at-work.webp', 1600, QHI],
  ['Truck red.jpg', 'truck-red.webp', 1920, QHI],
  ['the shop background.png', 'hex-wall.webp', 1400, Q],
  // Flat white lockup with real alpha - reads on any dark panel.
  ['The Shop logo.png', 'logo.webp', 900, { quality: 95, effort: 6 }],
  // Red hex-wall plate behind every page title. Car sits right, so the copy
  // gets the dark left half.
  ['Title area.png', 'title-plate.webp', 1920, QHI],
];

// Home "about" block. The source is square but the block is landscape, so the
// crop is pulled to the bottom - a centred crop would take sky off the top and
// cut the wheels off the bottom, which is the whole point of the shot.
const aboutShot = ['big truck.jpg', 'big-truck.webp', 1440, 1030];

// Narrow-screen hero. Its own portrait shot (552x909), used as framed - no
// crop, no upscale. Resizing past native would only add bytes, so it ships at
// source size and the CSS covers the phone box from there.
const heroMobile = ['mobile bg.png', 'hero-bg-mobile.webp'];

// Aspect the phone hero canvas is padded out to. Narrower than any real phone
// hero box (375x742 = 0.51, 414x826 = 0.50, 360x790 = 0.46), so object-fit:
// cover always resolves by width and never crops the sides of the shot.
const MOBILE_ASP = 0.47;

// Service cards. Each entry is a slug plus the owner's thumbs for that
// service, listed best-first: the filename numbers are his ranking (no number
// or 1 = favourite, then 1.1, 1.2, 2, 2.1, 3). Frame 0 is what renders on
// load; the card cycles through the rest.
const cards = [
  ['vehicle-wraps', ['Wraps.jpg', 'wraps 1.jpg', 'wraps 2.1.jpg']],
  ['custom-graphics', ['Speciality.jpg', 'Speciality 2.jpg']],
  ['paint-protection', ['detailing 3.jpg', 'Wrap 1.2.jpg']],
  ['window-tint', ['Tint.jpg', 'Boats.jpg', 'boats 2.jpg']],
  ['chrome-delete', ['Wrap 1.2.jpg', 'wraps 2.1.jpg']],
  [
    'custom-builds',
    ['After market.jpg', 'Wheels tires.jpg', 'Wheels tires 1.jpg', 'wheels tires 1.1.jpg', 'aftermarket 3.jpg', 'atfermarket.jpg'],
  ],
  ['detailing', ['Detailing.jpg', 'detailing 2.jpg', 'detailing 3.jpg']],
  ['fleet-wraps', ['Fleet Commerical.jpg']],
];

// [gallery-src index prefix, category slug, output slug]
const gallery = [
  ['02', 'window-tint', 'tint-suv-rear'],
  ['07', 'window-tint', 'tint-tahoe'],
  ['12', 'window-tint', 'tint-gmc-shop'],
  ['19', 'window-tint', 'tint-jeep-wrangler'],
  ['26', 'window-tint', 'tint-gmc-sierra'],
  ['47', 'window-tint', 'tint-f250-black'],
  ['57', 'window-tint', 'tint-corvette-blue'],
  ['58', 'window-tint', 'tint-charger-black'],

  ['16', 'vinyl-wraps', 'wrap-bmw-m6'],
  ['17', 'vinyl-wraps', 'wrap-lexus-camo'],
  ['14', 'vinyl-wraps', 'wrap-range-rover-red'],
  ['13', 'vinyl-wraps', 'wrap-polaris-camo'],
  ['06', 'vinyl-wraps', 'wrap-polaris-build'],
  ['28', 'vinyl-wraps', 'wrap-flag-truck'],
  ['46', 'vinyl-wraps', 'wrap-blue-chrome'],
  ['50', 'vinyl-wraps', 'wrap-gassed-up-dually'],

  ['45', 'detailing', 'detail-bentley'],
  ['49', 'detailing', 'detail-corvette-white'],
  ['51', 'detailing', 'detail-tahoe-black'],
  ['52', 'detailing', 'detail-g37'],
  ['56', 'detailing', 'detail-tesla-x'],

  ['04', 'wheels-tires', 'wheels-k5-blazer'],
  ['24', 'wheels-tires', 'wheels-escalade-red'],
  ['34', 'wheels-tires', 'wheels-range-rover'],
  ['35', 'wheels-tires', 'wheels-f250-lifted'],
  ['53', 'wheels-tires', 'wheels-tahoe-lifted'],
  ['54', 'wheels-tires', 'wheels-dually-white'],
  ['60', 'wheels-tires', 'wheels-denali'],

  ['36', 'commercial', 'fleet-pcm-van'],
  ['40', 'commercial', 'fleet-trucks'],
  ['41', 'commercial', 'fleet-es-trailer'],
  ['33', 'commercial', 'fleet-gmc-classic'],

  ['55', 'boats', 'boat-tow-rig'],
];

// Owner-picked shots for the home page rail. Portrait sources crop to 4:5.
// Porche.jpg is the Porsche favourite; Favorites/wraps.jpg is byte-identical
// to it, so it is deliberately not listed twice.
const favs = [
  ['Porche.jpg', 'fav-porsche-satin.webp'],
  ['Blue camaro.jpg', 'fav-blue-carbon.webp'],
  ['Mini coop.jpg', 'fav-mini-cooper.webp'],
  ['corvertette.jpg', 'fav-corvette-c8.webp'],
  ['truck.jpg', 'fav-truck-tint.webp'],
  ['trailer.jpg', 'fav-commercial-trailer.webp'],
  ['Idk.jpg', 'fav-windshield-tint.webp'],
];

const galFiles = readdirSync(GAL);
const findGal = (prefix) => {
  const f = galFiles.find((n) => n.startsWith(prefix + '_'));
  if (!f) throw new Error('no gallery source for index ' + prefix);
  return path.join(GAL, f);
};

for (const [from, to, maxW, opts] of large) {
  const p = sharp(path.join(SRC, from));
  if (maxW) p.resize({ width: maxW, withoutEnlargement: true });
  const i = await p.webp(opts).toFile(path.join(OUT, to));
  console.log('image  ' + from.padEnd(26) + ' -> ' + to.padEnd(30) + i.width + 'x' + i.height + '  ' + kb(i.size));
}

{
  // Full frame, untouched aspect - the hero section matches this ratio.
  const wide = await sharp(path.join(SRC, HERO_SRC))
    .resize({ width: 1920, withoutEnlargement: true })
    .webp(QHI)
    .toFile(path.join(OUT, 'hero-bg.webp'));
  console.log('image  ' + HERO_SRC.padEnd(26) + ' -> hero-bg.webp                  ' + wide.width + 'x' + wide.height + '  ' + kb(wide.size));

  // Phone hero. The shot is 552x909 (0.61) and a phone hero box is about 0.50,
  // so cover against the raw file would eat roughly a fifth of the width off
  // the sides. Giving the hero the photo's own aspect ratio instead is not an
  // option either - that height is driven by viewport width, so it comes out
  // far too short on a narrow phone and taller than the screen on a wide one.
  //
  // So the photo is left completely untouched and the canvas is extended
  // BELOW it to MOBILE_ASP, narrower than any phone hero box. Cover then
  // always resolves by width: all 552 columns of the original are on screen,
  // nothing cropped, nothing zoomed.
  //
  // How that extension is drawn matters more than it looks. It used to be a
  // flat vertical gradient starting from the mean tone of the photo's bottom
  // 30 rows. Two things went wrong with that. The mean of 30 rows came out at
  // 47 while the photo's own last row sits at 76, so the join was a visible
  // 28-level step, not the seamless start the average was meant to give. And
  // what followed the step was a textureless wash sitting in the 30-48 range
  // for the next sixty rows - against the lit, high-contrast concrete directly
  // above it, that reads as a grey rectangle stuck to the foot of the photo.
  //
  // Nobody saw it on a desktop at a fixed window size, because the hero is
  // only as tall as the viewport and the pad stayed below the cut. On a phone
  // it was the first thing you saw: iOS Safari grows the viewport as the URL
  // bar collapses, the hero grew with it, and the slab slid into view on the
  // way down the page and back out on the way up.
  //
  // The extension is now the photo's own bottom rows, mirrored, so row one of
  // the pad is row 908 of the photo - continuous by construction, at any tone,
  // with the concrete's texture carrying on instead of stopping dead. Focus
  // falls away over the first few rows and a black veil takes the whole thing
  // to the page background about fifty rows in, which is roughly where the
  // shortest phone hero ends: what the reader gets is a floor that carries on
  // and vignettes out, and below that the flat black the copy already sat on.
  //
  // Both ramps are smoothstepped rather than linear. A straight fade reaches
  // the flat colour with a slope still on it, and that slope is exactly what
  // an OLED phone draws as a band edge - which is the artefact this whole
  // block exists to get rid of.
  const [mFrom, mTo] = heroMobile;
  const msrc = path.join(SRC, mFrom);
  const mm = await sharp(msrc).metadata();
  const MW = mm.width;
  const MH = Math.round(MW / MOBILE_ASP);
  const extH = MH - mm.height;
  const tail = Math.min(extH, mm.height);

  const scene = await sharp(msrc).png().toBuffer();

  // mirrored tail: sharp's flip() is the top-bottom one (flop() is left-right)
  const mirror = await sharp(scene)
    .extract({ left: 0, top: mm.height - tail, width: MW, height: tail })
    .flip()
    .toBuffer();

  // Blurred underneath, sharp on top with its alpha ramped away: the mirroring
  // stops being readable as a mirror within a dozen rows, but the join itself
  // stays sharp against the photo, so there is no focus step at the seam.
  const soft = await sharp(mirror).blur(16).toBuffer();
  const focusMask = Buffer.from(
    '<svg width="' + MW + '" height="' + tail + '"><defs>' +
      '<linearGradient id="f" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#fff" stop-opacity="1"/>' +
      '<stop offset="3%" stop-color="#fff" stop-opacity="0.82"/>' +
      '<stop offset="6%" stop-color="#fff" stop-opacity="0.45"/>' +
      '<stop offset="9%" stop-color="#fff" stop-opacity="0.13"/>' +
      '<stop offset="12%" stop-color="#fff" stop-opacity="0"/>' +
      '<stop offset="100%" stop-color="#fff" stop-opacity="0"/>' +
      '</linearGradient></defs>' +
      '<rect width="' + MW + '" height="' + tail + '" fill="url(#f)"/></svg>'
  );
  const focused = await sharp(mirror)
    .ensureAlpha()
    .composite([{ input: focusMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const veil = Buffer.from(
    '<svg width="' + MW + '" height="' + extH + '"><defs>' +
      '<linearGradient id="v" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#08080a" stop-opacity="0"/>' +
      '<stop offset="4%" stop-color="#08080a" stop-opacity="0.12"/>' +
      '<stop offset="8%" stop-color="#08080a" stop-opacity="0.38"/>' +
      '<stop offset="12%" stop-color="#08080a" stop-opacity="0.68"/>' +
      '<stop offset="16%" stop-color="#08080a" stop-opacity="0.89"/>' +
      '<stop offset="20%" stop-color="#08080a" stop-opacity="0.98"/>' +
      '<stop offset="24%" stop-color="#08080a" stop-opacity="1"/>' +
      '<stop offset="100%" stop-color="#08080a" stop-opacity="1"/>' +
      '</linearGradient></defs>' +
      '<rect width="' + MW + '" height="' + extH + '" fill="url(#v)"/></svg>'
  );

  const i = await sharp({ create: { width: MW, height: MH, channels: 3, background: '#08080a' } })
    .composite([
      { input: scene, left: 0, top: 0 },
      { input: soft, left: 0, top: mm.height },
      { input: focused, left: 0, top: mm.height },
      { input: veil, left: 0, top: mm.height },
    ])
    .webp(QHI)
    .toFile(path.join(OUT, mTo));
  console.log('image  ' + mFrom.padEnd(26) + ' -> ' + mTo.padEnd(30) + i.width + 'x' + i.height + '  ' + kb(i.size));
}
