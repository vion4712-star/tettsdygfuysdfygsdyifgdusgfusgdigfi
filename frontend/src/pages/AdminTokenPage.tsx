import { useEffect, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { useValidateAndRequestPromotion, useProcessPendingPromotions, useGetCallerRole } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';

export default function AdminTokenPage() {
  const navigate = useNavigate();
  const params = useParams({ from: '/admin-token/$token' });
  const token = params.token;
  
  const { identity, login, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;
  
  const validatePromotion = useValidateAndRequestPromotion();
  const processPending = useProcessPendingPromotions();
  const { data: roleInfo, refetch: refetchRole } = useGetCallerRole();
  
  const [status, setStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isAuthenticated && token && status === 'idle') {
      handleValidateToken();
    }
  }, [isAuthenticated, token, status]);

  const handleValidateToken = async () => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid token URL');
      return;
    }

    setStatus('validating');
    
    try {
      // First, validate and request promotion
      await validatePromotion.mutateAsync(token);
      
      // Then process pending promotions (admin action)
      await processPending.mutateAsync();
      
      // Refetch role to get updated status
      await refetchRole();
      
      setStatus('success');
      toast.success('Successfully promoted to Admin!');
      
      // Redirect to admin dashboard after 2 seconds
      setTimeout(() => {
        navigate({ to: '/admin' });
      }, 2000);
    } catch (error: any) {
      setStatus('error');
      const message = error?.message || 'Failed to validate token';
      setErrorMessage(message);
      toast.error(message);
    }
  };

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      toast.error('Login failed');
      console.error(error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cupcake-pink/10 to-cupcake-cream/20 py-12 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 border-cupcake-pink/50">
          <CardHeader>
            <CardTitle className="text-center text-white flex items-center justify-center gap-2">
              <ShieldCheck className="w-6 h-6 text-cupcake-pink" />
              Admin Promotion Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription className="text-white">
                You must be logged in to use this admin promotion link.
              </AlertDescription>
            </Alert>
            <Button
              onClick={handleLogin}
              disabled={loginStatus === 'logging-in'}
              className="w-full cupcake-gradient hover:cupcake-gradient-hover text-white"
            >
              {loginStatus === 'logging-in' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login to Continue'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cupcake-pink/10 to-cupcake-cream/20 py-12 flex items-center justify-center">
      <Card className="max-w-md w-full mx-4 border-cupcake-pink/50">
        <CardHeader>
          <CardTitle className="text-center text-white flex items-center justify-center gap-2">
            <ShieldCheck className="w-6 h-6 text-cupcake-pink" />
            Admin Promotion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'validating' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-cupcake-pink mb-4" />
              <p className="text-white">Validating token and processing promotion...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Success!</h3>
              <p className="text-white/80 mb-4">
                You have been successfully promoted to Admin.
              </p>
              <p className="text-sm text-white/60">
                Redirecting to Admin Dashboard...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <XCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Promotion Failed</h3>
                <p className="text-white/80">{errorMessage}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => navigate({ to: '/' })}
                  variant="outline"
                  className="flex-1 border-cupcake-pink/50 text-white hover:text-white"
                >
                  Go Home
                </Button>
                <Button
                  onClick={() => {
                    setStatus('idle');
                    handleValidateToken();
                  }}
                  className="flex-1 cupcake-gradient hover:cupcake-gradient-hover text-white"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
