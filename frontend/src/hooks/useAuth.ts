import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile } from './useQueries';
import { useActor } from './useActor';

/**
 * Authentication hook for email-based authentication
 * Uses actor availability and user profile to determine authentication state
 */
export function useAuth() {
  const { actor } = useActor();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const queryClient = useQueryClient();

  // User is authenticated if:
  // 1. Actor is available (connection to backend established)
  // 2. User profile exists with valid email (email-based authentication)
  const isAuthenticated = !!actor && !!userProfile && !!userProfile.email;

  const logout = useCallback(async () => {
    try {
      // Clear all cached queries
      queryClient.clear();
      
      // Clear any stored session data
      localStorage.removeItem('emailAuthSession');
      
      // Reload the page to reset authentication state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [queryClient]);

  return {
    isAuthenticated,
    email: userProfile?.email || null,
    currentUser: userProfile,
    userProfile,
    profileLoading,
    isLoading: profileLoading,
    isFetched,
    logout,
  };
}
