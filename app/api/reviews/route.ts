import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/api/lib/db';
import { verifyAuth } from '@/app/api/lib/auth';
import { Review, Product, Order } from '@/database';
import { CreateReviewSchema } from '@/app/api/lib/schemas';

// GET /api/reviews?productId=xxx - Get reviews for a product
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create a review
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth();
    await connectDB();

    const body = await request.json();
    const validatedData = CreateReviewSchema.parse(body);

    // Verify product exists
    const product = await Product.findById(validatedData.productId);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if user has purchased this product (for verified badge)
    const purchaseOrder = await Order.findOne({
      userId,
      'items.productId': validatedData.productId,
      status: { $in: ['paid', 'processing', 'shipped', 'delivered'] },
    });

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      productId: validatedData.productId,
      userId,
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      );
    }

    // Create review
    const review = new Review({
      ...validatedData,
      userId,
      userName: body.userName || 'Anonymous',
      verified: !!purchaseOrder,
    });

    await review.save();

    // Update product rating
    const allReviews = await Review.find({ productId: validatedData.productId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await Product.findByIdAndUpdate(validatedData.productId, {
      'ratings.average': Math.round(avgRating * 10) / 10,
      'ratings.count': allReviews.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Review created successfully',
      data: review,
    });
  } catch (error: any) {
    console.error('Error creating review:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create review' },
      { status: 500 }
    );
  }
}
