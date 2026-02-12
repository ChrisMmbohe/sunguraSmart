'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ICart } from '@/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2Icon, ShoppingCheckoutIcon } from 'lucide-react';

interface CartSummaryProps {
  cart: ICart | null;
  isLoading?: boolean;
  onUpdateItem?: (productId: string, quantity: number) => Promise<void>;
  onRemoveItem?: (productId: string) => Promise<void>;
}

export function CartSummary({ cart, isLoading, onUpdateItem, onRemoveItem }: CartSummaryProps) {
  const router = useRouter();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const subtotal = cart?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  const tax = Math.round(subtotal * 0.1 * 100) / 100;
  const shipping = subtotal > 100 ? 0 : 10;
  const total = subtotal + tax + shipping;

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (!onUpdateItem) return;
    
    setUpdatingItems((prev) => new Set(prev).add(productId));
    try {
      await onUpdateItem(productId, newQuantity);
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (productId: string) => {
    if (!onRemoveItem) return;
    
    setUpdatingItems((prev) => new Set(prev).add(productId));
    try {
      await onRemoveItem(productId);
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
        <h2 className="mb-4 text-xl font-bold">Your Cart</h2>
        <p className="text-gray-600 dark:text-gray-400">Your cart is empty</p>
        <Button className="mt-4 w-full" onClick={() => router.push('/store')}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      {/* Cart Items */}
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        <div className="p-6">
          <h2 className="mb-4 text-xl font-bold">Your Cart ({cart.items.length})</h2>
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.productId.toString()} className="flex gap-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {item.productId.name || `Product ${item.productId}`}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ${item.price.toFixed(2)} each
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleUpdateQuantity(item.productId.toString(), parseInt(e.target.value))
                    }
                    disabled={updatingItems.has(item.productId.toString())}
                    className="w-16 text-center"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveItem(item.productId.toString())}
                    disabled={updatingItems.has(item.productId.toString())}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                  <div className="w-20 text-right font-medium text-gray-900 dark:text-white">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-3 border-t border-gray-200 p-6 dark:border-gray-800">
        <div className="flex justify-between text-gray-900 dark:text-white">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-900 dark:text-white">
          <span>Tax (10%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-900 dark:text-white">
          <span>Shipping</span>
          <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
        </div>
        <div className="border-t border-gray-200 pt-3 dark:border-gray-800">
          <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="border-t border-gray-200 p-6 dark:border-gray-800">
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={() => router.push('/store/checkout')}
          disabled={cart.items.length === 0}
        >
          <ShoppingCheckoutIcon className="h-5 w-5" />
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}
