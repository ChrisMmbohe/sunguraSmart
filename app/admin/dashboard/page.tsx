'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { IProduct, IOrder } from '@/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboardPage() {
  const { userId, sessionClaims } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    sku: '',
    imageUrl: '',
  });

  useEffect(() => {
    // Check if user is admin
    const userRole = (sessionClaims?.metadata as any)?.role;
    if (userRole !== 'admin') {
      toast.error('You do not have admin access');
      router.push('/');
      return;
    }

    setIsAdmin(true);
    fetchProducts();
    fetchOrders();
  }, [sessionClaims, router, userId]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=100');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          category: formData.category,
          sku: formData.sku,
          images: formData.imageUrl ? [{ url: formData.imageUrl }] : [],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add product');
      }

      toast.success('Product added successfully');
      setFormData({ name: '', description: '', price: '', stock: '', category: '', sku: '', imageUrl: '' });
      setShowAddProduct(false);
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete product');

      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update order');

      toast.success('Order updated successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  if (!isAdmin) {
    return null;
  }

  const totalRevenue = orders
    .filter((o) => o.status === 'paid')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage products and orders
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {products.length}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {orders.length}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
              ${totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
              <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-800">
                <h2 className="text-xl font-bold">Products</h2>
                <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
                  <DialogTrigger asChild>
                    <Button gap-2 className="gap-2">
                      <PlusIcon className="h-4 w-4" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                      <DialogDescription>
                        Create a new product for your store
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddProduct} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="price">Price</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="stock">Stock</Label>
                          <Input
                            id="stock"
                            type="number"
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Input
                            id="category"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="sku">SKU</Label>
                          <Input
                            id="sku"
                            value={formData.sku}
                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="imageUrl">Image URL</Label>
                        <Input
                          id="imageUrl"
                          type="url"
                          value={formData.imageUrl}
                          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Add Product
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {isLoading ? (
                <div className="space-y-4 p-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse h-16 rounded bg-gray-200 dark:bg-gray-800" />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="p-6 text-center text-gray-600 dark:text-gray-400">
                  No products yet. Create your first product!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800">
                        <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Stock</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product._id?.toString()} className="border-b border-gray-200 dark:border-gray-800">
                          <td className="px-6 py-3 text-sm">{product.name}</td>
                          <td className="px-6 py-3 text-sm">${product.price.toFixed(2)}</td>
                          <td className="px-6 py-3 text-sm">{product.stock}</td>
                          <td className="px-6 py-3 text-sm">{product.category}</td>
                          <td className="px-6 py-3 text-sm">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteProduct(product._id?.toString() || '')}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
              <div className="border-b border-gray-200 p-6 dark:border-gray-800">
                <h2 className="text-xl font-bold">Orders</h2>
              </div>

              {orders.length === 0 ? (
                <div className="p-6 text-center text-gray-600 dark:text-gray-400">
                  No orders yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800">
                        <th className="px-6 py-3 text-left text-sm font-semibold">Order ID</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Customer</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Total</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order._id?.toString()} className="border-b border-gray-200 dark:border-gray-800">
                          <td className="px-6 py-3 text-sm font-mono">
                            {order._id?.toString().slice(-8)}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            {order.shippingAddress.email}
                          </td>
                          <td className="px-6 py-3 text-sm font-semibold">
                            ${order.total?.toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <Badge>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="px-6 py-3 text-sm">
                            {new Date(order.createdAt || '').toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order._id?.toString() || '', e.target.value)}
                              className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
                            >
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
