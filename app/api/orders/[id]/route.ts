import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/api/lib/db';
import { verifyAuth, verifyAdminAuth } from '@/app/api/lib/auth';
import { Order } from '@/database';

// GET /api/orders/[id] - Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAuth();
    await connectDB();
    const { id } = await params;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Users can only see their own orders (unless admin)
    if (order.userId !== userId) {
      const { userId: adminId } = await Promise.resolve(null).catch(() => ({ userId: null }));
      // Check if admin
      try {
        await verifyAdminAuth();
      } catch {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id] - Update order status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdminAuth();
    await connectDB();
    const { id } = await params;

    const body = await request.json();
    const { status, notes } = body;

    if (!['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid order status' },
        { status: 400 }
      );
    }

    const updateData: any = { status };
    if (notes) updateData.notes = notes;

    // Set appropriate timestamps
    if (status === 'paid') updateData.paidAt = new Date();
    if (status === 'shipped') updateData.shippedAt = new Date();
    if (status === 'delivered') updateData.deliveredAt = new Date();

    const order = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
