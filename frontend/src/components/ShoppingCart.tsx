import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, ShoppingCart as CartIcon, Trash2 } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useGetProducts } from '../hooks/useQueries';
import { useState } from 'react';
import { toast } from 'sonner';
import UpiPaymentDialog from './UpiPaymentDialog';
import { useAuth } from '../hooks/useAuth';
import AuthDialog from './AuthDialog';

export default function ShoppingCart() {
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();
  const { data: products = [] } = useGetProducts();
  const { isAuthenticated, profileLoading, isFetched } = useAuth();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const cartWithDetails = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      ...item,
      product,
    };
  });

  const total = cartWithDetails.reduce((sum, item) => {
    if (!item.product) return sum;
    return sum + Number(item.product.upiAmount) * Number(item.quantity);
  }, 0);

  const handleCheckout = async () => {
    // Wait for profile to be fetched before checking authentication
    if (profileLoading || !isFetched) {
      toast.info('Loading authentication status...');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please login to checkout');
      setShowAuthDialog(true);
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = () => {
    clearCart();
    setShowPaymentDialog(false);
  };

  // Prepare cart items with full details for payment dialog
  const cartItemsForPayment = cartWithDetails
    .filter((item) => item.product)
    .map((item) => ({
      productId: item.productId,
      productName: item.product!.name,
      price: item.product!.upiAmount,
      quantity: item.quantity,
    }));

  if (items.length === 0) {
    return (
      <Card className="sticky top-24 border-cupcake-pink/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CartIcon className="h-5 w-5" />
            Shopping Cart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-white/70 py-8">Your cart is empty</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="sticky top-24 border-cupcake-pink/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CartIcon className="h-5 w-5" />
            Shopping Cart ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cartWithDetails.map((item) => {
            if (!item.product) return null;

            return (
              <div key={item.productId} className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-white">{item.product.name}</h4>
                    <p className="text-xs text-white/70">₹{Number(item.product.upiAmount).toFixed(2)} each</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.productId)}
                    className="h-8 w-8 text-white hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuantity(item.productId, Number(item.quantity) - 1)}
                    disabled={Number(item.quantity) <= 1}
                    className="h-8 w-8"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-12 text-center font-medium text-white">{Number(item.quantity)}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuantity(item.productId, Number(item.quantity) + 1)}
                    className="h-8 w-8"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <span className="ml-auto font-semibold text-white">
                    ₹{(Number(item.product.upiAmount) * Number(item.quantity)).toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}

          <Separator className="bg-cupcake-pink/30" />

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-white">Total:</span>
              <span className="text-2xl font-bold text-cupcake-pink">₹{total.toFixed(2)}</span>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={profileLoading}
              className="w-full cupcake-gradient hover:cupcake-gradient-hover text-white"
            >
              {profileLoading ? 'Loading...' : 'Checkout'}
            </Button>

            <Button variant="outline" onClick={clearCart} className="w-full border-cupcake-pink/50 text-white hover:text-white">
              Clear Cart
            </Button>
          </div>
        </CardContent>
      </Card>

      {showPaymentDialog && (
        <UpiPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          cartItems={cartItemsForPayment}
          totalAmount={total}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </>
  );
}
