'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircleIcon } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    // Verify payment with backend in a real app
    // For now, just display success
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-8">
      <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-950 dark:shadow-xl text-center">
          <CheckCircleIcon className="h-16 w-16 mx-auto mb-4 text-green-600 dark:text-green-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Order Confirmed!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Thank you for your purchase. Your order has been received.
          </p>

          {orderId && (
            <div className="mt-6 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">Order ID</p>
              <p className="font-mono text-lg font-semibold text-gray-900 dark:text-white break-all">
                {orderId}
              </p>
            </div>
          )}

          <div className="mt-8 space-y-3">
            <p className="text-gray-600 dark:text-gray-400">
              A confirmation email has been sent to your inbox.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              You can track your order status in your account dashboard.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <Link href="/store/account">
              <Button className="w-full">View Your Orders</Button>
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
