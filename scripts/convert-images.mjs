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

const Q = { quality: 82, effort: 6 };
const QHI = { quality: 88, effort: 6 };
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
  ['logo-dark.png', 'logo.webp', 900, { quality: 95, effort: 6 }],
];

// Home "about" block. The source is square but the block is landscape, so the
// crop is pulled to the bottom - a centred crop would take sky off the top and
// cut the wheels off the bottom, which is the whole point of the shot.
const aboutShot = ['big truck.jpg', 'big-truck.webp', 1440, 1030];

// Narrow-screen hero. The source is 1870x841, so a tall crop would upscale
// badly - a near-square frame keeps it close to native pixels while still
// holding the car and the lit hex wall behind it.
const heroMobile = ['Hero_Final.png', 'hero-bg-mobile.webp', 1000, 1040];

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

  // Narrow screens still need a taller crop or the band gets too short to
  // hold the headline; biased right so the car stays in frame.
  const [, to, w, h] = heroMobile;
  const i = await sharp(src)
    .resize(w, h, { fit: 'cover', position: 'right' })
    .webp(QHI)
    .toFile(path.join(OUT, to));
  console.log('image  ' + HERO_SRC.padEnd(26) + ' -> ' + to.padEnd(30) + i.width + 'x' + i.height + '  ' + kb(i.size));
}

{
  const [from, to, w, h] = aboutShot;
  const i = await sharp(path.join(SRC, from))
    .resize(w, h, { fit: 'cover', position: 'bottom' })
    .webp(QHI)
    .toFile(path.join(OUT, to));
  console.log('image  ' + from.padEnd(26) + ' -> ' + to.padEnd(30) + i.width + 'x' + i.height + '  ' + kb(i.size));
}

// Emits svc-<slug>-0.webp, -1.webp ... in the owner's ranked order, and prints
// the frame list so it can be pasted into services.json.
const cardFrames = {};
for (const [slug, sources] of cards) {
  cardFrames[slug] = [];
  for (let n = 0; n < sources.length; n++) {
    const to = 'svc-' + slug + '-' + n + '.webp';
    const i = await sharp(path.join(SVC, sources[n]))
      .resize(CARD_W, CARD_H, { fit: 'cover', position: 'centre' })
      .webp(Q)
      .toFile(path.join(OUT, to));
    cardFrames[slug].push('/images/' + to);
    console.log('card   ' + sources[n].padEnd(26) + ' -> ' + to.padEnd(30) + i.width + 'x' + i.height + '  ' + kb(i.size));
  }
}
console.log('\ncard frame sets:');
for (const [slug, list] of Object.entries(cardFrames)) {
  console.log('  ' + slug.padEnd(18) + list.length + ' frame(s)');
}

mkdirSync(path.join(GOUT, 'full'), { recursive: true });

for (const [prefix, cat, slug] of gallery) {
  const to = cat + '--' + slug + '.webp';
  const src = findGal(prefix);

  const i = await sharp(src)
    .resize({ width: GAL_W, withoutEnlargement: true })
    .webp(Q)
    .toFile(path.join(GOUT, to));

  // Larger copy for the lightbox - only fetched when a photo is opened.
  const f = await sharp(src)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 76, effort: 6 })
    .toFile(path.join(GOUT, 'full', to));

  console.log(
    'gal    #' + prefix.padEnd(25) + ' -> ' + to.padEnd(38) +
    i.width + 'x' + i.height + ' ' + kb(i.size) + '  (full ' + f.width + 'x' + f.height + ' ' + kb(f.size) + ')'
  );
}

for (const [from, to] of favs) {
  const i = await sharp(path.join(FAV, from))
    .resize(760, 950, { fit: 'cover', position: 'centre' })
    .webp(Q)
    .toFile(path.join(OUT, to));
  console.log('fav    ' + from.padEnd(26) + ' -> ' + to.padEnd(30) + i.width + 'x' + i.height + '  ' + kb(i.size));
}
