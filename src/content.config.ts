import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

// faqs/ and reviews/ are read directly via import.meta.glob in src/lib/content.ts,
// not through this API - these definitions exist only to stop Astro's deprecated
// auto-collection scan (and its "no *.md files" warnings) from running on every build.
const faqs = defineCollection({ loader: glob({ pattern: '**/*.json', base: './src/content/faqs' }) });
const reviews = defineCollection({ loader: glob({ pattern: '**/*.json', base: './src/content/reviews' }) });

export const collections = { faqs, reviews };
