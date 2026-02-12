'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IProduct } from '@/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StarIcon, ShoppingCartIcon, ArrowLeftIcon } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<IProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) throw new Error('Product not found');
        const data = await response.json();
        setProduct(data.data);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product');
        router.push('/store');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId, router]);

  const handleAddToCart = async () => {
    if (!product) return;

    setIsAddingToCart(true);
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add to cart');
      }

      toast.success(`Added ${quantity} item(s) to cart!`);
      setQuantity(1);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-screen rounded-lg bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-gray-600 dark:text-gray-400">Product not found</p>
        </div>
      </div>
    );
  }

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-6 gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </Button>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Product Images */}
          <div className="space-y-4">
            {product.images[0] && (
              <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].alt || product.name}
                  fill
                  className="object-cover"
                />
                {discountPercentage > 0 && (
                  <div className="absolute right-4 top-4 rounded-full bg-red-500 px-4 py-2 text-lg font-bold text-white">
                    -{discountPercentage}%
                  </div>
                )}
              </div>
            )}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <div key={index} className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={image.url}
                      alt={image.alt || `Product image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {product.category}
              </p>
              <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="mt-4 flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.round(product.ratings.average)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600 dark:text-gray-400">
                  {product.ratings.average} ({product.ratings.count} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  ${product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-500 line-through dark:text-gray-400">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Stock Status */}
            <p className={`text-lg font-medium ${
              product.inStock ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {product.inStock ? `In Stock (${product.stock} available)` : 'Out of Stock'}
            </p>

            {/* Add to Cart */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={!product.inStock || isAddingToCart}
                  className="w-20"
                />
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.inStock || isAddingToCart}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  <ShoppingCartIcon className="h-5 w-5" />
                  {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="description" className="mt-8">
              <TabsList>
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="specifications">Specifications</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  {product.description}
                </p>
                {product.longDescription && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {product.longDescription}
                  </p>
                )}
                {product.tags && product.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-gray-200 px-3 py-1 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="specifications" className="space-y-4">
                {product.specifications && Object.keys(product.specifications).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-2 dark:border-gray-800">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {key}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">No specifications available</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
