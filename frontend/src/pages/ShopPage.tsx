import { useState } from 'react';
import { useGetProducts } from '../hooks/useQueries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductCard from '../components/ProductCard';
import ShoppingCart from '../components/ShoppingCart';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCategory } from '../backend';

export default function ShopPage() {
  const { data: products, isLoading } = useGetProducts();
  const [activeTab, setActiveTab] = useState<string>('all');

  const filterProducts = (category?: ProductCategory) => {
    if (!products) return [];
    if (!category) return products;
    return products.filter((p) => p.category === category);
  };

  const renderProductGrid = (category?: ProductCategory) => {
    const filtered = filterProducts(category);

    if (isLoading) {
      return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[350px] rounded-lg" />
          ))}
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="text-center py-12 text-white/70">
          <p>No products available in this category.</p>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  };

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 pixel-font text-cupcake-pink">
          Shop
        </h1>
        <p className="text-lg text-white/80">
          Browse our collection of ranks, crate keys, and perks to enhance your gameplay.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="all">All Items</TabsTrigger>
              <TabsTrigger value="rank">Ranks</TabsTrigger>
              <TabsTrigger value="crateKey">Crate Keys</TabsTrigger>
              <TabsTrigger value="perk">Perks</TabsTrigger>
            </TabsList>
            <TabsContent value="all">{renderProductGrid()}</TabsContent>
            <TabsContent value="rank">{renderProductGrid(ProductCategory.rank)}</TabsContent>
            <TabsContent value="crateKey">{renderProductGrid(ProductCategory.crateKey)}</TabsContent>
            <TabsContent value="perk">{renderProductGrid(ProductCategory.perk)}</TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <ShoppingCart />
          </div>
        </div>
      </div>
    </div>
  );
}
