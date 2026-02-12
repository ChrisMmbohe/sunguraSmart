import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/api/lib/db';
import { verifyAdminAuth } from '@/app/api/lib/auth';
import { Product } from '@/database';
import { CreateProductSchema, UpdateProductSchema } from '@/app/api/lib/schemas';

// GET /api/products - List all products with filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    let filter: any = { isActive: true };

    // Text search
    if (query) {
      filter.$text = { $search: query };
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Sorting
    let sortObj: any = { createdAt: -1 };
    switch (sortBy) {
      case 'price-asc':
        sortObj = { price: 1 };
        break;
      case 'price-desc':
        sortObj = { price: -1 };
        break;
      case 'rating':
        sortObj = { 'ratings.average': -1 };
        break;
      case 'popularity':
        sortObj = { 'ratings.count': -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product (admin only)
export async function POST(request: NextRequest) {
  try {
    await verifyAdminAuth();
    await connectDB();

    const body = await request.json();
    const validatedData = CreateProductSchema.parse(body);

    // Check if SKU already exists
    const existingSku = await Product.findOne({ sku: validatedData.sku });
    if (existingSku) {
      return NextResponse.json(
        { error: 'Product with this SKU already exists' },
        { status: 400 }
      );
    }

    const product = new Product(validatedData);
    await product.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Product created successfully',
        data: product,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating product:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
