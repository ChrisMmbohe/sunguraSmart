import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/api/lib/db';
import { verifyAuth } from '@/app/api/lib/auth';
import { Cart } from '@/database';
import { UpdateCartItemSchema } from '@/app/api/lib/schemas';

// PATCH /api/cart/[productId] - Update cart item quantity
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const userId = await verifyAuth();
    await connectDB();
    const { productId } = await params;

    const body = await request.json();
    const { quantity } = UpdateCartItemSchema.parse(body);

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    const itemIndex = cart.items.findIndex((item: any) => item.productId.toString() === productId);
    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Item not found in cart' },
        { status: 404 }
      );
    }

    if (quantity === 0) {
      // Remove item from cart
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    return NextResponse.json({
      success: true,
      message: quantity === 0 ? 'Item removed from cart' : 'Item updated',
      data: cart,
    });
  } catch (error: any) {
    console.error('Error updating cart item:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart/[productId] - Remove item from cart
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const userId = await verifyAuth();
    await connectDB();
    const { productId } = await params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    cart.items = cart.items.filter((item: any) => item.productId.toString() !== productId);
    await cart.save();

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart',
      data: cart,
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    return NextResponse.json(
      { error: 'Failed to remove item from cart' },
      { status: 500 }
    );
  }
}
