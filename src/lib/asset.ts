// Image filenames in this project are stable - the pipeline overwrites
// hero-bg-mobile.webp in place rather than emitting a content hash. For a
// long time those files were also served with "immutable", which tells a
// browser never to revalidate: anyone who loaded the site before that header
// was corrected still holds the old photo, and no amount of reloading will
// replace it because the cached entry is considered fresh for a year.
//
// A changed URL is the only thing that reaches those clients, so every image
// is referenced with this stamp. Bump it whenever the pipeline regenerates
// artwork and the new files need to reach people who have already visited.
export const ASSET_V = '20260904e';

/** Appends the cache-busting stamp to a site-root asset path. */
export const v = (path: string | undefined | null): string =>
  path && path.startsWith('/') ? `${path}?v=${ASSET_V}` : (path ?? '');
