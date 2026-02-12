'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchIcon, FilterIcon } from 'lucide-react';

interface StoreFiltersProps {
  categories: string[];
  onSearch: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onPriceChange: (min: number, max: number) => void;
  onSortChange: (sort: string) => void;
}

export function StoreFilters({
  categories,
  onSearch,
  onCategoryChange,
  onPriceChange,
  onSortChange,
}: StoreFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handlePriceChange = () => {
    onPriceChange(
      minPrice ? parseFloat(minPrice) : 0,
      maxPrice ? parseFloat(maxPrice) : 10000
    );
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    onCategoryChange(value === 'all' ? '' : value);
  };

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="icon">
          <SearchIcon className="h-4 w-4" />
        </Button>
      </form>

      {/* Filter Toggle (Mobile) */}
      <Button
        onClick={() => setShowFilters(!showFilters)}
        variant="outline"
        className="w-full gap-2 md:hidden"
      >
        <FilterIcon className="h-4 w-4" />
        {showFilters ? 'Hide Filters' : 'Show Filters'}
      </Button>

      {/* Filters */}
      <div className={`space-y-4 ${showFilters ? 'block' : 'hidden'} md:block`}>
        {/* Category Filter */}
        <div>
          <Label className="mb-2 block text-sm font-semibold">Category</Label>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Range Filter */}
        <div>
          <Label className="mb-2 block text-sm font-semibold">Price Range</Label>
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="Min Price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              min="0"
            />
            <Input
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min="0"
            />
            <Button onClick={handlePriceChange} className="w-full" size="sm">
              Apply Price Filter
            </Button>
          </div>
        </div>

        {/* Sort Filter */}
        <div>
          <Label className="mb-2 block text-sm font-semibold">Sort By</Label>
          <Select onValueChange={onSortChange} defaultValue="newest">
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="rating">Best Rated</SelectItem>
              <SelectItem value="popularity">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
