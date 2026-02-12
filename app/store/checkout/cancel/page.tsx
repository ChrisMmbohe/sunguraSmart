'use client';

import { Button } from '@/components/ui/button';
import { XCircleIcon } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-8">
      <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-950 dark:shadow-xl text-center">
          <XCircleIcon className="h-16 w-16 mx-auto mb-4 text-red-600 dark:text-red-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Payment Cancelled
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Your payment was cancelled. Your order was not completed.
          </p>

          <div className="mt-8 space-y-3">
            <p className="text-gray-600 dark:text-gray-400">
              You can return to checkout and try again, or continue shopping.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <Link href="/store/checkout">
              <Button className="w-full">Return to Checkout</Button>
            </Link>
            <Link href="/store/cart">
              <Button variant="outline" className="w-full">
                View Cart
              </Button>
            </Link>
            <Link href="/store">
              <Button variant="outline" className="w-full">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
