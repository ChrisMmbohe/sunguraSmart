'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { ICart, IOrder } from '@/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const { userId } = useAuth();
  const router = useRouter();

  const [cart, setCart] = useState<ICart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('shipping');

  const [shippingForm, setShippingForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
  });

  const [orderData, setOrderData] = useState<Partial<IOrder> | null>(null);

  useEffect(() => {
    if (!userId) {
      toast.error('Please sign in to checkout');
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
        router.push('/store/cart');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCart();
  }, [userId, router]);

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cart || cart.items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setIsProcessing(true);
    try {
      // Create order
      const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const tax = Math.round(subtotal * 0.1 * 100) / 100;
      const shippingCost = subtotal > 100 ? 0 : 10;
      const total = subtotal + tax + shippingCost;

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: shippingForm,
          tax,
          shippingCost,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      const order = await response.json();
      setOrderData(order.data);
      toast.success('Order created successfully');
      setCurrentStep('payment');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create order');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!orderData || !orderData._id) {
      toast.error('Order not found');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderData._id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process payment');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!userId || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-12 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Checkout</h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Your cart is empty</p>
          <Button onClick={() => router.push('/store/cart')} className="mt-4">
            Back to Cart
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.1 * 100) / 100;
  const shipping = subtotal > 100 ? 0 : 10;
  const total = subtotal + tax + shipping;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Checkout</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Tabs value={currentStep} onValueChange={setCurrentStep} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="shipping">Shipping</TabsTrigger>
                <TabsTrigger value="payment" disabled={!orderData}>
                  Payment
                </TabsTrigger>
                <TabsTrigger value="review" disabled={!orderData}>
                  Review
                </TabsTrigger>
              </TabsList>

              {/* Shipping Tab */}
              <TabsContent value="shipping">
                <form onSubmit={handleShippingSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={shippingForm.firstName}
                        onChange={(e) =>
                          setShippingForm({ ...shippingForm, firstName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={shippingForm.lastName}
                        onChange={(e) =>
                          setShippingForm({ ...shippingForm, lastName: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={shippingForm.email}
                        onChange={(e) =>
                          setShippingForm({ ...shippingForm, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={shippingForm.phone}
                        onChange={(e) =>
                          setShippingForm({ ...shippingForm, phone: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={shippingForm.address}
                      onChange={(e) =>
                        setShippingForm({ ...shippingForm, address: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={shippingForm.city}
                        onChange={(e) =>
                          setShippingForm({ ...shippingForm, city: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={shippingForm.state}
                        onChange={(e) =>
                          setShippingForm({ ...shippingForm, state: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">Zip Code</Label>
                      <Input
                        id="zipCode"
                        value={shippingForm.zipCode}
                        onChange={(e) =>
                          setShippingForm({ ...shippingForm, zipCode: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={isProcessing} className="w-full">
                    {isProcessing ? 'Creating Order...' : 'Continue to Payment'}
                  </Button>
                </form>
              </TabsContent>

              {/* Payment Tab */}
              <TabsContent value="payment">
                <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
                  <h3 className="text-lg font-semibold">Payment Method</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Click below to proceed to our secure payment page powered by Stripe.
                  </p>
                  <Button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? 'Processing...' : 'Proceed to Payment'}
                  </Button>
                </div>
              </TabsContent>

              {/* Review Tab */}
              <TabsContent value="review">
                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
                  <h3 className="text-lg font-semibold mb-4">Order Review</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>First Name:</strong> {shippingForm.firstName}</p>
                    <p><strong>Last Name:</strong> {shippingForm.lastName}</p>
                    <p><strong>Email:</strong> {shippingForm.email}</p>
                    <p><strong>Phone:</strong> {shippingForm.phone}</p>
                    <p><strong>Address:</strong> {shippingForm.address}, {shippingForm.city}, {shippingForm.state} {shippingForm.zipCode}</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Order Summary */}
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 h-fit sticky top-8">
            <div className="p-6">
              <h2 className="mb-4 text-lg font-bold">Order Summary</h2>
              <div className="space-y-3 border-b border-gray-200 pb-4 dark:border-gray-800">
                {cart.items.map((item) => (
                  <div key={item.productId.toString()} className="text-sm">
                    <p className="text-gray-900 dark:text-white">Product {item.quantity}x</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 py-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (10%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
