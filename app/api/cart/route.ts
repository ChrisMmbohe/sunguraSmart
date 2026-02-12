import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/api/lib/db';
import { verifyAuth } from '@/app/api/lib/auth';
import { Cart, Product } from '@/database';
import { AddToCartSchema, UpdateCartItemSchema } from '@/app/api/lib/schemas';

// GET /api/cart - Get user's cart
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth();
    await connectDB();

    let cart = await Cart.findOne({ userId }).populate('items.productId');
    
    if (!cart) {
      cart = new Cart({ userId, items: [] });
      await cart.save();
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item: any) => sum + item.price * item.quantity, 0);

    return NextResponse.json({
      success: true,
      data: {
        ...cart.toObject(),
        subtotal,
        itemCount: cart.items.length,
      },
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth();
    await connectDB();

    const body = await request.json();
    const { productId, quantity } = AddToCartSchema.parse(body);

    // Verify product exists and get current price
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (!product.inStock) {
      return NextResponse.json(
        { error: 'Product is out of stock' },
        { status: 400 }
      );
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { error: `Only ${product.stock} items available` },
        { status: 400 }
      );
    }

    // Get or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if item already in cart
    const existingItem = cart.items.find((item: any) => item.productId.toString() === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId,
        quantity,
        price: product.price,
      });
    }

    await cart.save();

    return NextResponse.json({
      success: true,
      message: 'Item added to cart',
      data: cart,
    });
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Clear entire cart
export async function DELETE(request: NextRequest) {
  try {
    const userId = await verifyAuth();
    await connectDB();

    await Cart.updateOne({ userId }, { items: [] });

    return NextResponse.json({
      success: true,
      message: 'Cart cleared',
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}
