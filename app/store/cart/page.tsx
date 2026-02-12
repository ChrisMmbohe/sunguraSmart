'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ICart } from '@/database';
import { CartSummary } from '@/components/store/CartSummary';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CartPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<ICart | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      toast.error('Please sign in to view your cart');
      router.push('/sign-in');
      return;
    }

    const fetchCart = async () => {
      try {
        const response = await fetch('/api/cart');
        if (!response.ok) throw new Error('Failed to fetch cart');
        const data = await response.json();
        setCart(data.data);
      } catch (error) {
        console.error('Error fetching cart:', error);
        toast.error('Failed to load cart');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCart();
  }, [userId, router]);

  const handleUpdateItem = async (productId: string, quantity: number) => {
    try {
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) throw new Error('Failed to update cart');
      const data = await response.json();
      setCart(data.data);
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Failed to update cart');
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove item');
      const data = await response.json();
      setCart(data.data);
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Shopping Cart</h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Cart */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-950">
                <div className="animate-pulse">
                  <div className="h-12 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
              </div>
            ) : cart && cart.items.length > 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
                <div className="p-6">
                  <h2 className="mb-4 text-xl font-bold">Items in Your Cart</h2>
                  <div className="space-y-4 divide-y divide-gray-200 dark:divide-gray-800">
                    {cart.items.map((item) => (
                      <div key={item.productId.toString()} className="pt-4 first:pt-0">
                        {/* Item display would go here - simplified for now */}
                        <div className="flex justify-between">
                          <span>Product: {item.productId.toString().slice(0, 8)}...</span>
                          <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-950">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Your cart is empty
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Start shopping to add items to your cart
                </p>
                <Link href="/store">
                  <Button className="mt-4">Continue Shopping</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Cart Summary Sidebar */}
          <div className="lg:col-span-1">
            <CartSummary
              cart={cart}
              isLoading={isLoading}
              onUpdateItem={handleUpdateItem}
              onRemoveItem={handleRemoveItem}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
