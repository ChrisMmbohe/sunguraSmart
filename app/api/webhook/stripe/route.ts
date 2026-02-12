import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/api/lib/db';
import { Order, Cart, Product } from '@/database';
import Stripe from 'stripe';
import { captureEvent } from '@/lib/posthog';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-15.acacia',
});

// POST /api/webhook/stripe - Handle Stripe webhook events
export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  try {
    const body = await request.text();
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    await connectDB();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        const userId = session.metadata?.userId;

        if (orderId && userId) {
          const order = await Order.findById(orderId);
          if (order) {
            order.status = 'paid';
            order.paidAt = new Date();
            order.stripePaymentIntentId = session.payment_intent as string;
            await order.save();

            // Reduce stock for each product
            for (const item of order.items) {
              await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: -item.quantity } }
              );
            }

            // Clear user's cart
            await Cart.updateOne({ userId }, { items: [] });

            // Track with PostHog
            captureEvent(userId, 'purchase_completed', {
              orderId: orderId,
              amount: order.total,
              itemCount: order.items.length,
            });

            console.log(`Order ${orderId} marked as paid`);
          }
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (orderId) {
          const order = await Order.findById(orderId);
          if (order && order.status === 'pending') {
            order.status = 'cancelled';
            await order.save();
            console.log(`Order ${orderId} expired`);
          }
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        // Find order by payment intent
        const order = await Order.findOne({
          stripePaymentIntentId: charge.payment_intent,
        });

        if (order) {
          order.status = 'refunded';
          await order.save();

          // Restore stock
          for (const item of order.items) {
            await Product.findByIdAndUpdate(
              item.productId,
              { $inc: { stock: item.quantity } }
            );
          }

          console.log(`Order ${order._id} refunded`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}
