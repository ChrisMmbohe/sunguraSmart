import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/api/lib/db';
import { verifyApiSecret } from '@/app/api/lib/auth';
import { Product } from '@/database';

/**
 * NOTE ON CLOUDINARY 401 ERRORS:
 * If you get a 401, your Cloudinary account has "Restricted Media Types" enabled.
 * To fix: 
 * 1. Log into Cloudinary Console
 * 2. Settings -> Security
 * 3. Uncheck "Fetched URL" under "Restricted media types" 
 * OR add "upload.wikimedia.org" to the "Allowed fetch domains".
 */
const getImageUrl = (originalUrl: string) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.replace(/"/g, '');
  
  // If no cloud name or if you're having trouble with 401s, return original URL
  if (!cloudName || cloudName === 'demo') return originalUrl;
  
  // Return the fetch URL
  return `https://res.cloudinary.com/${cloudName}/image/fetch/f_auto,q_auto,w_800/${originalUrl}`;
};

const SAMPLE_PRODUCTS = [
  {
    name: 'Premium Rabbit Feed',
    description: 'High-quality balanced feed for growing rabbits',
    longDescription: 'Specially formulated premium feed containing essential vitamins, minerals, and fiber for optimal rabbit health and growth. Contains no artificial preservatives.',
    price: 25.99,
    category: 'Feed',
    stock: 100,
    sku: 'FEED-001',
    images: [
      {
        url: getImageUrl('https://upload.wikimedia.org/wikipedia/commons/a/a5/Rabbit_brown.jpg'),
        alt: 'Premium Rabbit Feed',
      },
    ],
    tags: ['feed', 'premium', 'balanced', 'rabbits'],
    ratings: { average: 4.5, count: 23 },
    isActive: true,
    isFeatured: true,
  },
  {
    name: 'Hutch Cleaner Spray',
    description: 'Eco-friendly hutch and cage cleaning solution',
    longDescription: 'Safe, non-toxic spray designed specifically for cleaning rabbit hutches and cages. Kills 99.9% of bacteria while being gentle on surfaces.',
    price: 12.99,
    category: 'Supplies',
    stock: 50,
    sku: 'CLEAN-001',
    images: [
      {
        url: getImageUrl('https://upload.wikimedia.org/wikipedia/commons/1/1e/Spray_bottle.jpg'),
        alt: 'Hutch Cleaner Spray',
      },
    ],
    tags: ['cleaning', 'eco-friendly', 'supplies'],
    ratings: { average: 4.2, count: 15 },
    isActive: true,
  },
  {
    name: 'Ceramic Water Bowl',
    description: 'Durable ceramic water bowl for rabbits',
    price: 8.99,
    category: 'Accessories',
    stock: 75,
    sku: 'BOWL-001',
    images: [
      {
        url: getImageUrl('https://upload.wikimedia.org/wikipedia/commons/d/d4/Bowl.jpg'),
        alt: 'Ceramic Water Bowl',
      },
    ],
    tags: ['bowl', 'water', 'ceramic'],
    ratings: { average: 4.8, count: 42 },
    isActive: true,
    isFeatured: true,
  },
  {
    name: 'Hay Feeder Rack',
    description: 'Metal hay feeder rack that reduces waste',
    longDescription: 'Sturdy metal hay feeder designed to minimize waste and keep hay clean. Easy to refill and clean.',
    price: 19.99,
    category: 'Accessories',
    stock: 30,
    sku: 'FEEDER-001',
    images: [
      {
        url: getImageUrl('https://upload.wikimedia.org/wikipedia/commons/c/cb/Metal_rack.jpg'),
        alt: 'Hay Feeder Rack',
      },
    ],
    tags: ['feeder', 'hay', 'metal'],
    ratings: { average: 4.6, count: 31 },
    isActive: true,
  },
  {
    name: 'Rabbit Health Guide eBook',
    description: 'Comprehensive digital guide for rabbit care',
    longDescription: 'Complete 50-page eBook covering rabbit nutrition, health, breeding, and common diseases. PDF format, instantly downloadable.',
    price: 9.99,
    category: 'Digital Products',
    stock: 999,
    sku: 'EBOOK-001',
    images: [
      {
        url: getImageUrl('https://upload.wikimedia.org/wikipedia/commons/5/5a/BookCover.jpg'),
        alt: 'Rabbit Health Guide',
      },
    ],
    tags: ['ebook', 'guide', 'health', 'digital'],
    ratings: { average: 4.7, count: 88 },
    isActive: true,
  },
  {
    name: 'Vitamin Supplement Powder',
    description: 'Essential vitamin and mineral powder supplement',
    price: 16.99,
    category: 'Supplements',
    stock: 45,
    sku: 'VIT-001',
    images: [
      {
        url: getImageUrl('https://upload.wikimedia.org/wikipedia/commons/7/7f/Powder.jpg'),
        alt: 'Vitamin Supplement',
      },
    ],
    tags: ['vitamin', 'supplement', 'health'],
    ratings: { average: 4.4, count: 19 },
    isActive: true,
  },
  {
    name: 'Deluxe Wooden Hutch',
    description: 'Large weather-resistant wooden rabbit hutch',
    longDescription: 'Premium wooden hutch with multiple compartments, excellent insulation, and easy access for cleaning. Includes run area.',
    price: 149.99,
    originalPrice: 199.99,
    category: 'Housing',
    stock: 5,
    sku: 'HUTCH-001',
    images: [
      {
        url: getImageUrl('https://upload.wikimedia.org/wikipedia/commons/0/0f/Wooden_hutch.jpg'),
        alt: 'Deluxe Wooden Hutch',
      },
    ],
    tags: ['hutch', 'housing', 'wood', 'deluxe'],
    ratings: { average: 4.9, count: 67 },
    isActive: true,
    isFeatured: true,
  },
  {
    name: 'Rabbit Breeding Manual',
    description: 'Professional guide to rabbit breeding and genetics',
    price: 24.99,
    category: 'Books',
    stock: 20,
    sku: 'BOOK-001',
    images: [
      {
        url: getImageUrl('https://upload.wikimedia.org/wikipedia/commons/5/5a/BookCover.jpg'),
        alt: 'Breeding Manual',
      },
    ],
    tags: ['breeding', 'genetics', 'manual', 'professional'],
    ratings: { average: 4.8, count: 34 },
    isActive: true,
  },
  {
    name: 'Heated Water Bottle',
    description: 'Winter heated water bottle for cold climates',
    price: 14.99,
    category: 'Supplies',
    stock: 40,
    sku: 'BOTTLE-001',
    images: [
      {
        url: getImageUrl('https://upload.wikimedia.org/wikipedia/commons/3/3f/Water_bottle.jpg'),
        alt: 'Heated Water Bottle',
      },
    ],
    tags: ['water', 'heated', 'winter', 'supplies'],
    ratings: { average: 4.3, count: 26 },
    isActive: true,
  },
  {
    name: 'Professional Farm Software License',
    description: '1-year license for SunguraSmart farm management software',
    price: 99.99,
    category: 'Digital Products',
    stock: 100,
    sku: 'LICENSE-001',
    images: [
      {
        url: getImageUrl('https://upload.wikimedia.org/wikipedia/commons/0/08/Software_icon.jpg'),
        alt: 'Software License',
      },
    ],
    tags: ['software', 'farm', 'management', 'digital'],
    ratings: { average: 4.6, count: 45 },
    isActive: true,
    isFeatured: true,
  },
];

export async function POST(request: NextRequest) {
  try {
    if (!verifyApiSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const clearExisting = request.nextUrl.searchParams.get('clear') === 'true';
    if (clearExisting) {
      await Product.deleteMany({});
    }

    const inserted = await Product.insertMany(SAMPLE_PRODUCTS, { ordered: false });

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${inserted.length} products`,
      data: inserted,
    });
  } catch (error: any) {
    console.error('Error seeding products:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed products' },
      { status: 500 }
    );
  }
}