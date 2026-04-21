import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogIn, Sparkles } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { login, loginStatus } = useInternetIdentity();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
      onOpenChange(false);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const isLoading = isLoggingIn || loginStatus === 'logging-in';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="fixed left-[32%] top-[20%] -translate-x-0 -translate-y-0 w-[90vw] max-w-[500px] bg-black/95 backdrop-blur-sm border-2 border-cupcake-pink/50 shadow-cupcake-lg p-6 sm:p-8 animate-slide-up"
      >
        <DialogHeader className="mb-6">
          <DialogTitle className="text-white text-3xl sm:text-4xl text-center font-bold pixel-font">
            Welcome to CupCake SMP
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm sm:text-base text-center mt-2">
            Sign in with Internet Identity to access your account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-white/5 border border-cupcake-pink/30 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-cupcake-pink flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-semibold text-sm">Secure Authentication</h4>
                <p className="text-white/70 text-xs mt-1">
                  Internet Identity provides secure, passwordless authentication on the Internet Computer
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-cupcake-pink flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-semibold text-sm">Privacy First</h4>
                <p className="text-white/70 text-xs mt-1">
                  Your identity is cryptographically secured and never shared
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-cupcake-pink flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-semibold text-sm">One-Click Access</h4>
                <p className="text-white/70 text-xs mt-1">
                  After first setup, sign in instantly across all devices
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-cupcake-pink hover:bg-cupcake-pink/90 text-white font-semibold transition-all duration-200 shadow-cupcake hover:shadow-cupcake-lg h-12 border border-cupcake-pink/50"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Connecting...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Sign In with Internet Identity
              </>
            )}
          </Button>

          <p className="text-xs text-white/50 text-center">
            New to Internet Identity? You'll be guided through a quick setup process.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
