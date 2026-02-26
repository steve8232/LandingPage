/**
 * Stock Image Library
 *
 * Curated Unsplash image URLs mapped by template category.
 * Each category has a hero image, section images, and a gallery set.
 * Images are served directly from Unsplash CDN — no API key needed.
 *
 * URL format: https://images.unsplash.com/photo-{id}?w={width}&h={height}&fit=crop&q=80
 */

import { TemplateCategory } from './templates';

export interface StockImageSet {
  /** Large hero/banner image */
  hero: string;
  /** Secondary image for offer/features sections */
  feature: string;
  /** Gallery images (3–4 per niche) */
  gallery: string[];
}

const stockImages: Record<TemplateCategory, StockImageSet> = {
  saas: {
    hero: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=800&fit=crop&q=80',
    feature: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&h=400&fit=crop&q=80',
    ],
  },
  ecommerce: {
    hero: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=800&fit=crop&q=80',
    feature: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop&q=80',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=400&fit=crop&q=80',
    ],
  },
  'local-services': {
    hero: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=800&fit=crop&q=80',
    feature: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=600&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop&q=80',
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&h=400&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop&q=80',
    ],
  },
  professional: {
    hero: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop&q=80',
    feature: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=400&fit=crop&q=80',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop&q=80',
    ],
  },
  'lead-gen': {
    hero: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=800&fit=crop&q=80',
    feature: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=600&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop&q=80',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=400&fit=crop&q=80',
      'https://images.unsplash.com/photo-1552581234-26160f608093?w=600&h=400&fit=crop&q=80',
    ],
  },
  'coming-soon': {
    hero: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=800&fit=crop&q=80',
    feature: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=600&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=600&h=400&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=400&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517433456624-4cc7e013ad4f?w=600&h=400&fit=crop&q=80',
    ],
  },
};

/**
 * Get stock images for a template category.
 * Falls back to 'saas' images if category is unknown.
 */
export function getStockImages(category: TemplateCategory): StockImageSet {
  return stockImages[category] || stockImages.saas;
}

/**
 * Get the hero image URL for a category.
 */
export function getHeroImage(category: TemplateCategory): string {
  return getStockImages(category).hero;
}

/**
 * Get gallery images for a category.
 */
export function getGalleryImages(category: TemplateCategory): string[] {
  return getStockImages(category).gallery;
}

