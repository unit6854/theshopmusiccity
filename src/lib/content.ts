export interface Review {
  name: string;
  order?: number;
  rating: number;
  source?: string;
  featured?: boolean;
  quote: string;
}

export interface Faq {
  order?: number;
  question: string;
  answer: string;
}

const reviewModules = import.meta.glob<Review>('../content/reviews/*.json', { eager: true, import: 'default' });
const faqModules = import.meta.glob<Faq>('../content/faqs/*.json', { eager: true, import: 'default' });

const byOrder = (a: { order?: number }, b: { order?: number }) => (a.order ?? 99) - (b.order ?? 99);

export const reviews: Review[] = Object.values(reviewModules).sort(byOrder);
export const featuredReviews: Review[] = reviews.filter((r) => r.featured);
export const faqs: Faq[] = Object.values(faqModules).sort(byOrder);
