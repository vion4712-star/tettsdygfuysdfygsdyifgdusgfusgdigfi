import { useState, useEffect } from 'react';
import {
  useGetProducts,
  useAddProduct,
  useUpdateProduct,
  useDeleteProduct,
  useToggleProductAvailability,
  useGetOrders,
  useGetAdminUpiId,
  useSetAdminUpiId,
  useConfirmUpiPaymentUsingQr,
  useGetUserProfile,
  useGetUserRole,
  useAssignModeratorRole,
  useRevokeModeratorRole,
  usePromoteToAdmin,
  useGetAllModerators,
  useGenerateAdminToken,
  useGetActiveAdminTokens,
  useRevokeAdminToken,
  useGetPendingPromotions,
  useProcessPendingPromotions,
} from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Trash2, Settings, CheckCircle2, Clock, Package, Eye, EyeOff, UserCog, Shield, ShieldCheck, Link as LinkIcon, Copy, X, RefreshCw } from 'lucide-react';
import { Product, ProductCategory, MinecraftOrder } from '../backend';

const HIDDEN_ORDERS_KEY = 'cupcake_smp_hidden_orders';

function getHiddenOrders(): Set<string> {
  try {
    const stored = localStorage.getItem(HIDDEN_ORDERS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveHiddenOrders(hiddenOrders: Set<string>) {
  try {
    localStorage.setItem(HIDDEN_ORDERS_KEY, JSON.stringify(Array.from(hiddenOrders)));
  } catch (error) {
    console.error('Failed to save hidden orders:', error);
  }
}

function OrderCard({ order }: { order: MinecraftOrder }) {
  const { data: userProfile } = useGetUserProfile(order.owner);
  const confirmPayment = useConfirmUpiPaymentUsingQr();
  const [hiddenOrders, setHiddenOrders] = useState<Set<string>>(getHiddenOrders());

  const isHidden = hiddenOrders.has(order.id);

  const handleToggleHidden = () => {
    const newHiddenOrders = new Set(hiddenOrders);
    if (isHidden) {
      newHiddenOrders.delete(order.id);
    } else {
      newHiddenOrders.add(order.id);
    }
    setHiddenOrders(newHiddenOrders);
    saveHiddenOrders(newHiddenOrders);
  };

  const handleConfirmPayment = async (transactionRef: string) => {
    try {
      await confirmPayment.mutateAsync(transactionRef);
      toast.success('Payment confirmed successfully');
    } catch (error) {
      toast.error('Failed to confirm payment');
      console.error(error);
    }
  };

  return (
    <Card className={`border-cupcake-pink/50 ${isHidden ? 'opacity-60' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg text-white">Order #{order.id.substring(0, 12)}...</CardTitle>
            <p className="text-sm text-white/70 mt-1">
              {new Date(Number(order.timestamp) / 1000000).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleToggleHidden}
              title={isHidden ? 'Unhide order' : 'Hide order'}
            >
              {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Badge
              variant={
                order.paymentStatus === 'confirmed' || order.paymentStatus === 'completed'
                  ? 'default'
                  : 'secondary'
              }
              className="capitalize"
            >
              {order.paymentStatus === 'confirmed' || order.paymentStatus === 'completed' ? (
                <CheckCircle2 className="w-3 h-3 mr-1" />
              ) : (
                <Clock className="w-3 h-3 mr-1" />
              )}
              {order.paymentStatus}
            </Badge>
            {order.paymentStatus === 'pending' && order.upiPaymentReference && (
              <Button
                size="sm"
                onClick={() => handleConfirmPayment(order.upiPaymentReference!)}
                disabled={confirmPayment.isPending}
                className="cupcake-gradient hover:cupcake-gradient-hover text-white"
              >
                Confirm
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {userProfile && (
          <div className="bg-cupcake-cream/20 p-3 rounded space-y-1">
            <div className="text-sm text-white">
              <span className="font-medium">Buyer:</span> {userProfile.name}
            </div>
            {userProfile.minecraftUsername && (
              <div className="text-sm text-white">
                <span className="font-medium">Minecraft Username:</span> {userProfile.minecraftUsername}
              </div>
            )}
          </div>
        )}

        <div>
          <h4 className="font-semibold text-sm mb-2 text-white">Items:</h4>
          <div className="space-y-1">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm bg-cupcake-cream/20 p-2 rounded">
                <span className="text-white">{item.productId}</span>
                <span className="text-white/70">Qty: {Number(item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-cupcake-pink/30">
          <span className="font-semibold text-white">Total:</span>
          <span className="text-xl font-bold text-cupcake-pink">
            ₹{Number(order.totalAmount).toFixed(2)}
          </span>
        </div>

        {order.upiPaymentReference && (
          <div className="text-xs text-white/70">
            <span className="font-medium">UPI Ref:</span>{' '}
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
  );
}

export default function AdminDashboard() {
  const { data: products = [], isLoading: productsLoading } = useGetProducts();
  const { data: orders = [], isLoading: ordersLoading } = useGetOrders();
  const { data: adminUpiId = '' } = useGetAdminUpiId();
  const { data: allModerators = [] } = useGetAllModerators();
  const { data: activeTokens = [], isLoading: tokensLoading } = useGetActiveAdminTokens();
  const { data: pendingPromotions = [] } = useGetPendingPromotions();

  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const toggleAvailability = useToggleProductAvailability();
  const setAdminUpiId = useSetAdminUpiId();
  const assignModerator = useAssignModeratorRole();
  const revokeModerator = useRevokeModeratorRole();
  const promoteAdmin = usePromoteToAdmin();
  const generateToken = useGenerateAdminToken();
  const revokeToken = useRevokeAdminToken();
  const processPending = useProcessPendingPromotions();

  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isUpiSettingsOpen, setIsUpiSettingsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newUpiId, setNewUpiId] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [hiddenOrders, setHiddenOrders] = useState<Set<string>>(getHiddenOrders());

  // Role management state
  const [principalInput, setPrincipalInput] = useState('');
  const [selectedPrincipal, setSelectedPrincipal] = useState('');
  const { data: selectedUserRole, isLoading: userRoleLoading } = useGetUserRole(selectedPrincipal);

  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    description: '',
    category: ProductCategory.perk,
    upiAmount: '',
    available: true,
  });

  useEffect(() => {
    setHiddenOrders(getHiddenOrders());
  }, [orders]);

  const filteredOrders = orders.filter((order) => {
    const isHidden = hiddenOrders.has(order.id);
    return showHidden || !isHidden;
  });

  const handleOpenProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        upiAmount: Number(product.upiAmount).toString(),
        available: product.available,
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        id: '',
        name: '',
        description: '',
        category: ProductCategory.perk,
        upiAmount: '',
        available: true,
      });
    }
    setIsProductDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    try {
      const upiAmount = BigInt(Math.round(parseFloat(productForm.upiAmount)));

      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: productForm.id,
          name: productForm.name,
          description: productForm.description,
          category: productForm.category,
          upiAmount,
          available: productForm.available,
        });
        toast.success('Product updated successfully');
      } else {
        await addProduct.mutateAsync({
          id: productForm.id,
          name: productForm.name,
          description: productForm.description,
          category: productForm.category,
          upiAmount,
          available: productForm.available,
        });
        toast.success('Product added successfully');
      }
      setIsProductDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save product');
      console.error(error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteProduct.mutateAsync(id);
      toast.success('Product deleted successfully');
    } catch (error) {
      toast.error('Failed to delete product');
      console.error(error);
    }
  };

  const handleToggleAvailability = async (id: string) => {
    try {
      await toggleAvailability.mutateAsync(id);
      toast.success('Product availability updated');
    } catch (error) {
      toast.error('Failed to update availability');
      console.error(error);
    }
  };

  const handleUpdateUpiId = async () => {
    try {
      await setAdminUpiId.mutateAsync(newUpiId);
      toast.success('UPI ID updated successfully');
      setIsUpiSettingsOpen(false);
      setNewUpiId('');
    } catch (error) {
      toast.error('Failed to update UPI ID');
      console.error(error);
    }
  };

  const handleSearchPrincipal = () => {
    const trimmed = principalInput.trim();
    if (!trimmed) {
      toast.error('Please enter a principal ID');
      return;
    }
    setSelectedPrincipal(trimmed);
  };

  const handleAssignModerator = async () => {
    if (!selectedPrincipal) {
      toast.error('Please search for a user first');
      return;
    }

    try {
      await assignModerator.mutateAsync(selectedPrincipal);
      toast.success('User promoted to Moderator successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to assign moderator role');
      console.error(error);
    }
  };

  const handleRevokeModerator = async () => {
    if (!selectedPrincipal) {
      toast.error('Please search for a user first');
      return;
    }

    try {
      await revokeModerator.mutateAsync(selectedPrincipal);
      toast.success('Moderator role revoked successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to revoke moderator role');
      console.error(error);
    }
  };

  const handlePromoteToAdmin = async () => {
    if (!selectedPrincipal) {
      toast.error('Please search for a user first');
      return;
    }

    if (!confirm('Are you sure you want to promote this user to Admin? This grants full access to all features.')) {
      return;
    }

    try {
      await promoteAdmin.mutateAsync(selectedPrincipal);
      toast.success('User promoted to Admin successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to promote to admin');
      console.error(error);
    }
  };

  const handleGenerateToken = async () => {
    try {
      const token = await generateToken.mutateAsync();
      toast.success('Admin token generated successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to generate token');
      console.error(error);
    }
  };

  const handleCopyTokenLink = (token: string) => {
    const link = `${window.location.origin}/admin-token/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Token link copied to clipboard');
  };

  const handleRevokeToken = async (token: string) => {
    if (!confirm('Are you sure you want to revoke this token?')) return;

    try {
      await revokeToken.mutateAsync(token);
      toast.success('Token revoked successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to revoke token');
      console.error(error);
    }
  };

  const handleProcessPendingPromotions = async () => {
    try {
      await processPending.mutateAsync();
      toast.success('Pending promotions processed successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to process promotions');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cupcake-pink/10 to-cupcake-cream/20 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold pixel-font text-cupcake-pink">
              Admin Dashboard
            </h1>
            <p className="text-white/80 mt-2">
              Manage products, orders, roles, and settings
            </p>
          </div>
          <Dialog open={isUpiSettingsOpen} onOpenChange={setIsUpiSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setNewUpiId(adminUpiId)} className="border-cupcake-pink/50 text-white hover:text-white">
                <Settings className="w-4 h-4 mr-2" />
                UPI Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>UPI Settings</DialogTitle>
                <DialogDescription>Configure the admin UPI ID for receiving payments</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="upiId">Admin UPI ID</Label>
                  <Input
                    id="upiId"
                    value={newUpiId}
                    onChange={(e) => setNewUpiId(e.target.value)}
                    placeholder="example@upi"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUpiSettingsOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateUpiId}
                  disabled={setAdminUpiId.isPending}
                  className="cupcake-gradient hover:cupcake-gradient-hover text-white"
                >
                  {setAdminUpiId.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="roles">Manage Roles</TabsTrigger>
            <TabsTrigger value="tokens">Admin Tokens</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-cupcake-pink">Products</h2>
              <Button
                onClick={() => handleOpenProductDialog()}
                className="cupcake-gradient hover:cupcake-gradient-hover text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>

            {productsLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-cupcake-pink" />
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {products.map((product) => (
                  <Card key={product.id} className="border-cupcake-pink/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-cupcake-pink">{product.name}</h3>
                            <Badge variant={product.available ? 'default' : 'destructive'}>
                              {product.available ? 'Available' : 'Unavailable'}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {product.category}
                            </Badge>
                          </div>
                          <p className="text-white/80 mb-2">{product.description}</p>
                          <p className="text-2xl font-bold text-cupcake-pink">
                            ₹{Number(product.upiAmount).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleToggleAvailability(product.id)}
                          >
                            {product.available ? '👁️' : '🚫'}
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleOpenProductDialog(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-cupcake-pink">Orders</h2>
              <div className="flex items-center gap-2">
                <Switch
                  id="show-hidden"
                  checked={showHidden}
                  onCheckedChange={setShowHidden}
                />
                <Label htmlFor="show-hidden" className="cursor-pointer text-white">
                  Show hidden
                </Label>
              </div>
            </div>

            {ordersLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-cupcake-pink" />
                </CardContent>
              </Card>
            ) : filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-white/70">
                    {showHidden ? 'No orders yet' : 'No visible orders'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-cupcake-pink">Manage Roles</h2>
            </div>

            <Card className="border-cupcake-pink/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <UserCog className="w-5 h-5" />
                  User Role Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="principal" className="text-white">User Principal ID</Label>
                    <div className="flex gap-2">
                      <Input
                        id="principal"
                        value={principalInput}
                        onChange={(e) => setPrincipalInput(e.target.value)}
                        placeholder="Enter user principal ID"
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSearchPrincipal}
                        disabled={!principalInput.trim()}
                        className="cupcake-gradient hover:cupcake-gradient-hover text-white"
                      >
                        Search
                      </Button>
                    </div>
                  </div>

                  {selectedPrincipal && (
                    <div className="bg-cupcake-cream/20 p-4 rounded-lg space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-white">Selected User:</p>
                        <code className="text-xs bg-muted px-2 py-1 rounded block break-all text-white">
                          {selectedPrincipal}
                        </code>
                      </div>

                      {userRoleLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-6 h-6 animate-spin text-cupcake-pink" />
                        </div>
                      ) : selectedUserRole ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">Current Role:</p>
                            {selectedUserRole.isAdmin && (
                              <Badge variant="default" className="cupcake-gradient">
                                <ShieldCheck className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                            {selectedUserRole.isModerator && !selectedUserRole.isAdmin && (
                              <Badge variant="outline">
                                <Shield className="w-3 h-3 mr-1" />
                                Moderator
                              </Badge>
                            )}
                            {!selectedUserRole.isAdmin && !selectedUserRole.isModerator && (
                              <Badge variant="secondary">User</Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {!selectedUserRole.isModerator && !selectedUserRole.isAdmin && (
                              <Button
                                onClick={handleAssignModerator}
                                disabled={assignModerator.isPending}
                                variant="outline"
                                className="border-cupcake-pink/50 text-white hover:text-white"
                              >
                                {assignModerator.isPending && (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                )}
                                <Shield className="w-4 h-4 mr-2" />
                                Promote to Moderator
                              </Button>
                            )}

                            {selectedUserRole.isModerator && !selectedUserRole.isAdmin && (
                              <Button
                                onClick={handleRevokeModerator}
                                disabled={revokeModerator.isPending}
                                variant="outline"
                                className="border-destructive/50 text-destructive hover:bg-destructive/10"
                              >
                                {revokeModerator.isPending && (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                )}
                                Revoke Moderator
                              </Button>
                            )}

                            {!selectedUserRole.isAdmin && (
                              <Button
                                onClick={handlePromoteToAdmin}
                                disabled={promoteAdmin.isPending}
                                className="cupcake-gradient hover:cupcake-gradient-hover text-white"
                              >
                                {promoteAdmin.isPending && (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                )}
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                Promote to Admin
                              </Button>
                            )}

                            {selectedUserRole.isAdmin && (
                              <p className="text-sm text-white/70 italic">
                                This user has full admin privileges
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-white/70">User not found or invalid principal</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-cupcake-pink/30 pt-4">
                  <h3 className="text-lg font-semibold mb-3 text-white">Current Moderators</h3>
                  {allModerators.length === 0 ? (
                    <p className="text-sm text-white/70">No moderators assigned yet</p>
                  ) : (
                    <div className="space-y-2">
                      {allModerators.map((principal) => (
                        <div
                          key={principal.toString()}
                          className="bg-cupcake-cream/20 p-3 rounded flex items-center justify-between"
                        >
                          <code className="text-xs break-all text-white">{principal.toString()}</code>
                          <Badge variant="outline">
                            <Shield className="w-3 h-3 mr-1" />
                            Moderator
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tokens" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-cupcake-pink">Admin Tokens</h2>
              <Button
                onClick={handleGenerateToken}
                disabled={generateToken.isPending}
                className="cupcake-gradient hover:cupcake-gradient-hover text-white"
              >
                {generateToken.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Generate Token
              </Button>
            </div>

            {pendingPromotions.length > 0 && (
              <Card className="border-yellow-500/50 bg-yellow-500/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    Pending Promotions ({pendingPromotions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-white/80">
                    There are {pendingPromotions.length} pending promotion request(s) waiting to be processed.
                  </p>
                  <Button
                    onClick={handleProcessPendingPromotions}
                    disabled={processPending.isPending}
                    className="cupcake-gradient hover:cupcake-gradient-hover text-white"
                  >
                    {processPending.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Process Pending Promotions
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="border-cupcake-pink/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <LinkIcon className="w-5 h-5" />
                  Active Admin Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tokensLoading ? (
                  <div className="py-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-cupcake-pink" />
                  </div>
                ) : activeTokens.length === 0 ? (
                  <div className="py-8 text-center">
                    <LinkIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-white/70">No active tokens</p>
                    <p className="text-sm text-white/50 mt-2">
                      Generate a token to create admin promotion links
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeTokens.map((token) => (
                      <div
                        key={token.token}
                        className="bg-cupcake-cream/20 p-4 rounded-lg space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/60 mb-1">Token:</p>
                            <code className="text-xs bg-muted px-2 py-1 rounded block break-all text-white">
                              {token.token}
                            </code>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleCopyTokenLink(token.token)}
                              title="Copy link"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRevokeToken(token.token)}
                              title="Revoke token"
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-white/60">
                          <span>
                            Created: {new Date(Number(token.createdAt) / 1000000).toLocaleString()}
                          </span>
                          <span>
                            Expires: {new Date(Number(token.expiresAt) / 1000000).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-cupcake-pink/50">
              <CardHeader>
                <CardTitle className="text-white">How to Use Admin Tokens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-white/80">
                <p>
                  1. Click "Generate Token" to create a new admin promotion link
                </p>
                <p>
                  2. Copy the token link using the copy button
                </p>
                <p>
                  3. Share the link with the user you want to promote to admin
                </p>
                <p>
                  4. The user must be logged in to use the link
                </p>
                <p>
                  5. After the user visits the link, process pending promotions to complete the promotion
                </p>
                <p className="text-yellow-500">
                  ⚠️ Tokens expire after 24 hours and can only be used once
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update product details' : 'Create a new product for the shop'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="id">Product ID</Label>
                <Input
                  id="id"
                  value={productForm.id}
                  onChange={(e) => setProductForm({ ...productForm, id: e.target.value })}
                  disabled={!!editingProduct}
                  placeholder="unique-product-id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Product Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Product description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={productForm.category}
                  onValueChange={(value) =>
                    setProductForm({ ...productForm, category: value as ProductCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ProductCategory.rank}>Rank</SelectItem>
                    <SelectItem value={ProductCategory.crateKey}>Crate Key</SelectItem>
                    <SelectItem value={ProductCategory.perk}>Perk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="upiAmount">Price (₹)</Label>
                <Input
                  id="upiAmount"
                  type="number"
                  step="0.01"
                  value={productForm.upiAmount}
                  onChange={(e) => setProductForm({ ...productForm, upiAmount: e.target.value })}
                  placeholder="100.00"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={productForm.available}
                  onChange={(e) => setProductForm({ ...productForm, available: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="available">Available for purchase</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveProduct}
                disabled={addProduct.isPending || updateProduct.isPending}
                className="cupcake-gradient hover:cupcake-gradient-hover text-white"
              >
                {(addProduct.isPending || updateProduct.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingProduct ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

