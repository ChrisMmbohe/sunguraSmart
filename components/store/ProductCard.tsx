'use client';

import Image from 'next/image';
import Link from 'next/link';
import { IProduct } from '@/database';
import { StarIcon, ShoppingCartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ProductCardProps {
  product: IProduct;
  onAddToCart?: () => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      if (onAddToCart) {
        onAddToCart();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Link href={`/store/product/${product._id}`}>
      <div className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-950">
        {/* Product Image */}
        <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-800">
          {product.images[0] && (
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt || product.name}
              width={300}
              height={300}
              className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
          {discountPercentage > 0 && (
            <div className="absolute right-2 top-2 rounded-full bg-red-500 px-3 py-1 text-sm font-semibold text-white">
              -{discountPercentage}%
            </div>
          )}
          {product.isFeatured && (
            <div className="absolute left-2 top-2 rounded-full bg-blue-500 px-3 py-1 text-sm font-semibold text-white">
              Featured
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col p-4">
          <h3 className="line-clamp-2 text-lg font-semibold text-gray-900 dark:text-white">
            {product.name}
          </h3>

          {/* Category */}
          <p className="text-sm text-gray-500 dark:text-gray-400">{product.category}</p>

          {/* Description */}
          <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
            {product.description}
          </p>

          {/* Rating */}
          <div className="my-2 flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.round(product.ratings.average)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              ({product.ratings.count})
            </span>
          </div>

          {/* Price */}
          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through dark:text-gray-400">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          <p className={`mb-3 text-sm font-medium ${
            product.inStock ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {product.inStock ? `In Stock (${product.stock})` : 'Out of Stock'}
          </p>

          {/* Add to Cart Button */}
          <Button
            onClick={(e) => {
              e.preventDefault();
              handleAddToCart();
            }}
            disabled={!product.inStock || isLoading}
            className="w-full gap-2"
            variant={product.inStock ? 'default' : 'secondary'}
          >
            <ShoppingCartIcon className="h-4 w-4" />
            {isLoading ? 'Adding...' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </Link>
  );
}
