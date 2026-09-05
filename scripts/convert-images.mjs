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

// Narrow-screen hero. The source is 1870x841, so a tall crop would upscale
// badly - a near-square frame keeps it close to native pixels while still
// holding the car and the lit hex wall behind it.
const heroMobile = ['Hero_final 2.png', 'hero-bg-mobile.webp', 800, 1578];

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
  const src = path.join(SRC, HERO_SRC);

  // Full frame, untouched aspect - the hero section matches this ratio.
  const wide = await sharp(src)
    .resize({ width: 1920, withoutEnlargement: true })
    .webp(QHI)
    .toFile(path.join(OUT, 'hero-bg.webp'));
  console.log('image  ' + HERO_SRC.padEnd(26) + ' -> hero-bg.webp                  ' + wide.width + 'x' + wide.height + '  ' + kb(wide.size));

  // Phone hero: a real crop of the scene at roughly 0.70 aspect, which frames
  // the whole car with the lit hex wall behind it and keeps the dark wall on
  // the left where the headline sits. The phone box is taller than that, so
  // rather than crop tighter (which zooms into the bumper) the floor is
  // carried down as a gradient into shadow - the copy sits over that band.
  const [, to, MW, MH] = heroMobile;
  const ASP = 0.7;
  const meta = await sharp(src).metadata();
  const winW = Math.round(meta.height * ASP);
  const left = Math.min(meta.width - winW, 820);
  const cropH = Math.round(MW / ASP);

  const crop = await sharp(src)
    .extract({ left, top: 0, width: winW, height: meta.height })
    .resize(MW, cropH, { fit: 'cover' })
    .png()
    .toBuffer();

  // average the floor so the fade starts from the concrete's own tone
  const floorStats = await sharp(crop).extract({ left: 0, top: cropH - 40, width: MW, height: 40 }).stats();
  const [fr, fg, fb] = floorStats.channels.map((ch) => Math.round(ch.mean));
  const extH = MH - cropH;
  const fade = Buffer.from(
    '<svg width="' + MW + '" height="' + extH + '"><defs>' +
      '<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="rgb(' + fr + ',' + fg + ',' + fb + ')"/>' +
      '<stop offset="55%" stop-color="#0d0d10"/>' +
      '<stop offset="100%" stop-color="#08080a"/>' +
      '</linearGradient></defs>' +
      '<rect width="' + MW + '" height="' + extH + '" fill="url(#g)"/></svg>'
  );

  const i = await sharp({ create: { width: MW, height: MH, channels: 3, background: '#08080a' } })
    .composite([{ input: crop, left: 0, top: 0 }, { input: fade, left: 0, top: cropH }])
    .webp(QHI)
    .toFile(path.join(OUT, to));

