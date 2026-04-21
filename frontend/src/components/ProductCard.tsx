import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Crown, Key, Zap } from 'lucide-react';
import { Product, ProductCategory } from '../backend';
import { useCartStore } from '../store/cartStore';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

const categoryIcons = {
  [ProductCategory.rank]: Crown,
  [ProductCategory.crateKey]: Key,
  [ProductCategory.perk]: Zap,
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const Icon = categoryIcons[product.category];

  const handleAddToCart = () => {
    if (!product.available) {
      toast.error('This item is currently unavailable');
      return;
    }

    addItem({
      productId: product.id,
      productName: product.name,
      price: product.upiAmount,
      quantity: BigInt(1),
    });

    toast.success(`${product.name} added to cart!`);
  };

  return (
    <Card className="border-cupcake-pink/50 hover:shadow-cupcake-lg transition-shadow bg-card/80 backdrop-blur">
      <CardHeader>
        <div className="flex items-start justify-between">
          <Icon className="w-8 h-8 text-cupcake-pink" />
          <Badge variant={product.available ? 'default' : 'destructive'}>
            {product.available ? 'Available' : 'Unavailable'}
          </Badge>
        </div>
        <CardTitle className="pixel-font text-xl text-cupcake-pink">{product.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-white/80 text-sm mb-4">{product.description}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-cupcake-pink">
            ₹{Number(product.upiAmount).toFixed(2)}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full cupcake-gradient hover:cupcake-gradient-hover text-white shadow-cupcake"
          onClick={handleAddToCart}
          disabled={!product.available}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
