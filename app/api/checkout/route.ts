import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/api/lib/db';
import { verifyAuth } from '@/app/api/lib/auth';
import { Order, Cart } from '@/database';
import Stripe from 'stripe';
import { captureEvent } from '@/lib/posthog';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-15.acacia',
});

const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// POST /api/checkout - Create Stripe checkout session
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth();
    await connectDB();

    // Get the order from the request (order ID should be in body)
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Fetch order
    const order = await Order.findById(orderId);
    if (!order || order.userId !== userId) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'Order is not in pending state' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const lineItems = order.items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.productName,
          description: `Order item - SKU: ${item.productId}`,
          images: item.image ? [item.image] : undefined,
        },
        unit_amount: Math.round(item.price * 100), // Price in cents
      },
      quantity: item.quantity,
    }));

    // Add tax and shipping as separate line items
    if (order.tax > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Tax',
          },
          unit_amount: Math.round(order.tax * 100),
        },
        quantity: 1,
      });
    }

    if (order.shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping',
          },
          unit_amount: Math.round(order.shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${DOMAIN}/store/checkout/success?session_id={CHECKOUT_SESSION_ID}&orderId=${orderId}`,
      cancel_url: `${DOMAIN}/store/checkout/cancel?orderId=${orderId}`,
      customer_email: order.shippingAddress.email,
      metadata: {
        orderId: order._id?.toString(),
        userId,
      },
    });

    // Update order with Stripe session ID
    order.stripeSessionId = session.id;
    await order.save();

    // Track with PostHog
    captureEvent(userId, 'checkout_started', {
      orderId: order._id,
      total: order.total,
      sessionId: session.id,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
