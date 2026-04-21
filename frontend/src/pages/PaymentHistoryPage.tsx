import { useGetCallerOrders } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import ProtectedRoute from '../components/ProtectedRoute';

function PaymentHistoryContent() {
  const { data: orders = [], isLoading } = useGetCallerOrders();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      default:
        return 'destructive';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cupcake-pink/10 to-cupcake-cream/20 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold pixel-font text-center mb-2 text-cupcake-pink">Payment History</h1>
          <p className="text-center text-white/80">View all your past orders and transactions</p>
        </div>

        {isLoading ? (
          <Card className="border-cupcake-pink/50">
            <CardContent className="py-12 text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
              </div>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card className="border-cupcake-pink/50">
            <CardContent className="py-12 text-center space-y-4">
              <Package className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">No Orders Yet</h3>
                <p className="text-white/80 mb-6">
                  You haven't made any purchases yet. Visit the shop to get started!
                </p>
              </div>
              <Link to="/shop">
                <Button className="cupcake-gradient hover:cupcake-gradient-hover text-white">
                  Browse Shop
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="border-cupcake-pink/50 bg-card/80 backdrop-blur">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2 text-white">
                        Order #{order.id.substring(0, 8)}...
                        {getStatusIcon(order.paymentStatus)}
                      </CardTitle>
                      <p className="text-sm text-white/70 mt-1">
                        {new Date(Number(order.timestamp) / 1000000).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(order.paymentStatus)} className="capitalize">
                      {order.paymentStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.paymentStatus === 'pending' && (
                    <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                        <strong>Pending - Please kindly wait for confirmation</strong>
                        <br />
                        Your payment is being processed. This may take a few minutes.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-white">Items:</h4>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm bg-muted/50 p-2 rounded">
                          <span className="text-white">{item.productId}</span>
                          <span className="text-white/70">Qty: {Number(item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-cupcake-pink/30">
                    <span className="font-semibold text-white">Total Amount:</span>
                    <span className="text-xl font-bold text-cupcake-pink">
                      ₹{Number(order.totalAmount).toFixed(2)}
                    </span>
                  </div>

                  {order.upiPaymentReference && (
                    <div className="text-xs text-white/70">
                      <span className="font-medium">Transaction Ref:</span>{' '}
                      <code className="bg-muted px-1 py-0.5 rounded">{order.upiPaymentReference}</code>
                    </div>
                  )}

                  {order.customer && (
                    <div className="text-xs text-white/70">
                      <span className="font-medium">Customer:</span> {order.customer}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentHistoryPage() {
  return (
    <ProtectedRoute>
      <PaymentHistoryContent />
    </ProtectedRoute>
  );
}
