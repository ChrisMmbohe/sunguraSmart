import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/api/lib/db';
import { verifyAuth } from '@/app/api/lib/auth';
import { Order, Cart, Product } from '@/database';
import { CreateOrderSchema } from '@/app/api/lib/schemas';
import { posthog } from '@/lib/posthog';

// GET /api/orders - Get user's orders
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth();
    await connectDB();

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create new order (checkout)
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth();
    await connectDB();

    const body = await request.json();
    const validatedData = CreateOrderSchema.parse(body);

    // Get user's cart
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Verify stock availability and lock products
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product || product.stock < item.quantity) {
        return NextResponse.json(
          { error: `${item.productId} is no longer available in requested quantity` },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    const tax = validatedData.tax || Math.round(subtotal * 0.1 * 100) / 100; // Default 10% tax
    const shippingCost = validatedData.shippingCost || 0;
    const total = subtotal + tax + shippingCost;

    // Create order items
    const orderItems = await Promise.all(
      cart.items.map(async (item: any) => {
        const product = await Product.findById(item.productId);
        return {
          productId: item.productId,
          productName: product?.name,
          quantity: item.quantity,
          price: item.price,
          image: product?.images[0]?.url,
        };
      })
    );

    // Create order
    const order = new Order({
      userId,
      items: orderItems,
      shippingAddress: validatedData.shippingAddress,
      subtotal,
      tax,
      shippingCost,
      total,
      status: 'pending',
    });

    await order.save();

    // Track with PostHog
    if (posthog) {
      posthog.capture({
        distinctId: userId,
        event: 'order_created',
        properties: {
          orderId: order._id,
          total,
          itemCount: orderItems.length,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
