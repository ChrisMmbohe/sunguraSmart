'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { IOrder } from '@/database';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AccountPage() {
  const { userId, user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      router.push('/sign-in');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        setOrders(data.data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [userId, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
      case 'refunded':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">My Account</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Welcome back, {user?.firstName || 'User'}!
          </p>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="profile">Profile Settings</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
              <div className="p-6">
                <h2 className="mb-6 text-2xl font-bold">Your Orders</h2>

                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse h-24 rounded bg-gray-200 dark:bg-gray-800" />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
                    <p className="text-gray-600 dark:text-gray-400">
                      You haven't placed any orders yet.
                    </p>
                    <Link href="/store">
                      <Button className="mt-4">Start Shopping</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4 divide-y divide-gray-200 dark:divide-gray-800">
                    {orders.map((order) => (
                      <div key={order._id?.toString()} className="py-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                              Order #{order._id?.toString().slice(-8)}
                            </p>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {new Date(order.createdAt || '').toLocaleDateString()}
                            </p>
                            <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                              ${order.total?.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              {order.items?.length} item(s)
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
              <h2 className="mb-6 text-2xl font-bold">Profile Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    For more account settings, please visit your Clerk account dashboard.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
