import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Gamepad2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { UserProfile } from '../backend';

interface ProfileSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileSetupDialog({ open, onOpenChange }: ProfileSetupDialogProps) {
  const saveProfile = useSaveCallerUserProfile();
  const [formData, setFormData] = useState({
    name: '',
    minecraftUsername: '',
    email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({ name: '', minecraftUsername: '', email: '' });
      setErrors({});
    }
  }, [open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.minecraftUsername.trim()) {
      newErrors.minecraftUsername = 'Minecraft username is required';
    } else if (formData.minecraftUsername.trim().length < 3) {
      newErrors.minecraftUsername = 'Minecraft username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const profile: UserProfile = {
        name: formData.name.trim(),
        minecraftUsername: formData.minecraftUsername.trim(),
        email: formData.email.trim().toLowerCase(),
      };

      await saveProfile.mutateAsync(profile);
      
      // Check if this is the primary admin email
      if (profile.email === 'vion4712@gmail.com') {
        toast.success('Welcome, Primary Admin! Your account has been set up with full administrative privileges.');
      } else {
        toast.success('Profile created successfully!');
      }
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Profile setup error:', error);
      toast.error(error?.message || 'Failed to create profile. Please try again.');
    }
  };

  // Prevent closing the dialog by clicking outside or pressing escape
  const handleOpenChange = (newOpen: boolean) => {
    // Only allow closing if the form is being submitted successfully
    if (!newOpen && !saveProfile.isPending) {
      // Don't allow manual closing - user must complete the form
      return;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[500px] max-h-[85vh] bg-black/95 backdrop-blur-sm border-2 border-cupcake-pink/50 shadow-cupcake-lg overflow-y-auto p-6 sm:p-8 animate-slide-up"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="mb-6">
          <DialogTitle className="text-white text-3xl sm:text-4xl text-center font-bold pixel-font">
            Complete Your Profile
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm sm:text-base text-center mt-2">
            Please provide your details to continue using CupCake SMP
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white text-sm font-medium flex items-center">
              <User className="w-4 h-4 mr-2 text-cupcake-pink" />
              Name
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your name"
              className="bg-white/5 border-cupcake-pink/30 text-white placeholder:text-white/40 focus:border-cupcake-pink focus:ring-cupcake-pink/50 transition-all h-11"
              disabled={saveProfile.isPending}
            />
            {errors.name && (
              <p className="text-xs text-red-300">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white text-sm font-medium flex items-center">
              <Mail className="w-4 h-4 mr-2 text-cupcake-pink" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your.email@example.com"
              className="bg-white/5 border-cupcake-pink/30 text-white placeholder:text-white/40 focus:border-cupcake-pink focus:ring-cupcake-pink/50 transition-all h-11"
              disabled={saveProfile.isPending}
            />
            {errors.email && (
              <p className="text-xs text-red-300">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="minecraftUsername" className="text-white text-sm font-medium flex items-center">
              <Gamepad2 className="w-4 h-4 mr-2 text-cupcake-pink" />
              Minecraft Username
            </Label>
            <Input
              id="minecraftUsername"
              type="text"
              value={formData.minecraftUsername}
              onChange={(e) => setFormData({ ...formData, minecraftUsername: e.target.value })}
              placeholder="Your Minecraft username"
              className="bg-white/5 border-cupcake-pink/30 text-white placeholder:text-white/40 focus:border-cupcake-pink focus:ring-cupcake-pink/50 transition-all h-11"
              disabled={saveProfile.isPending}
            />
            {errors.minecraftUsername && (
              <p className="text-xs text-red-300">{errors.minecraftUsername}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={saveProfile.isPending}
            className="w-full bg-cupcake-pink hover:bg-cupcake-pink/90 text-white font-semibold transition-all duration-200 shadow-cupcake hover:shadow-cupcake-lg h-11 border border-cupcake-pink/50"
          >
            {saveProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Profile...
              </>
            ) : (
              'Create Profile'
            )}
          </Button>

          <p className="text-xs text-white/50 text-center pt-2">
            Your profile information will be used to manage your orders and in-game perks.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
