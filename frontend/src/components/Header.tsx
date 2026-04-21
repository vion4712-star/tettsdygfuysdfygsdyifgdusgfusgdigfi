import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ShoppingCart, User, LogOut, Shield, History } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../hooks/useAuth';
import { useGetCallerRole } from '../hooks/useQueries';
import AuthDialog from './AuthDialog';

export default function Header() {
  const navigate = useNavigate();
  const { items } = useCartStore();
  const { isAuthenticated, logout, userProfile } = useAuth();
  const { data: roleInfo } = useGetCallerRole();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + Number(item.quantity), 0);
  const isAdmin = roleInfo?.isAdmin || false;
  const isAdminOrModerator = roleInfo?.isAdmin || roleInfo?.isModerator || false;

  const handleLogout = async () => {
    await logout();
  };

  const handleLogin = () => {
    setShowAuthDialog(true);
  };

  const displayName = userProfile?.name || 'My Account';

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-cupcake-pink/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/assets/generated/cupcake-logo-transparent.dim_64x64.png"
              alt="CupCakeMC"
              className="h-10 w-10 pixelated transition-transform group-hover:scale-110"
            />
            <span className="text-xl font-bold pixel-font text-cupcake-pink group-hover:opacity-80 transition-opacity">
              CupCakeMC
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-white transition-colors hover:text-cupcake-pink"
            >
              Home
            </Link>
            <Link
              to="/shop"
              className="text-sm font-medium text-white transition-colors hover:text-cupcake-pink"
            >
              Shop
            </Link>
            <a
              href="#vote-section"
              className="text-sm font-medium text-white transition-colors hover:text-cupcake-pink"
            >
              Vote
            </a>
            <a
              href="https://discord.gg/bHrMWEYg7E"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-white transition-colors hover:text-cupcake-pink"
            >
              Discord
            </a>
            {isAuthenticated && (
              <Link
                to="/payment-history"
                className="text-sm font-medium text-white transition-colors hover:text-cupcake-pink"
              >
                Payment History
              </Link>
            )}
            {isAuthenticated && isAdminOrModerator && (
              <Link
                to="/admin"
                className="text-sm font-medium text-white transition-colors hover:text-cupcake-pink"
              >
                Admin Dashboard
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Shopping Cart */}
            <Link to="/shop">
              <Button variant="ghost" size="icon" className="relative text-white hover:text-cupcake-pink hover:bg-white/10">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-cupcake-pink text-xs text-white flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>

            {/* Auth */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:text-cupcake-pink hover:bg-white/10">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
                  {userProfile?.email && (
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                      {userProfile.email}
                    </DropdownMenuLabel>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: '/payment-history' })}>
                    <History className="mr-2 h-4 w-4" />
                    Payment History
                  </DropdownMenuItem>
                  {isAdminOrModerator && (
                    <DropdownMenuItem onClick={() => navigate({ to: '/admin' })}>
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={handleLogin}
                className="cupcake-gradient hover:cupcake-gradient-hover text-white"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </>
  );
}
