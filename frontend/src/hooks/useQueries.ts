import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import {
  Product,
  ServerStatus,
  MinecraftOrder,
  UserProfile,
  CartItem,
  ProductCategory,
  UpiTransaction,
  UserRoleInfo,
  AdminToken,
  PendingPromotion,
} from '../backend';
import { Principal } from '@icp-sdk/core/principal';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetCallerRole() {
  const { actor, isFetching } = useActor();

  return useQuery<UserRoleInfo>({
    queryKey: ['callerRoleInfo'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserProfile(userPrincipal: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', userPrincipal?.toString()],
    queryFn: async () => {
      if (!actor || !userPrincipal) return null;
      return actor.getUserProfile(userPrincipal);
    },
    enabled: !!actor && !isFetching && !!userPrincipal,
  });
}

export function useGetUserRole(userPrincipal: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserRoleInfo | null>({
    queryKey: ['userRoleInfo', userPrincipal],
    queryFn: async () => {
      if (!actor || !userPrincipal) return null;
      try {
        const principal = Principal.fromText(userPrincipal);
        return actor.getUserRole(principal);
      } catch (error) {
        console.error('Invalid principal:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!userPrincipal,
  });
}

// Role Management Mutations
export function useAssignModeratorRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userPrincipal: string) => {
      if (!actor) throw new Error('Actor not initialized');
      const principal = Principal.fromText(userPrincipal);
      return actor.assignModeratorRole(principal);
    },
    onSuccess: (_, userPrincipal) => {
      queryClient.invalidateQueries({ queryKey: ['userRoleInfo', userPrincipal] });
      queryClient.invalidateQueries({ queryKey: ['allModerators'] });
    },
  });
}

export function useRevokeModeratorRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userPrincipal: string) => {
      if (!actor) throw new Error('Actor not initialized');
      const principal = Principal.fromText(userPrincipal);
      return actor.revokeModeratorRole(principal);
    },
    onSuccess: (_, userPrincipal) => {
      queryClient.invalidateQueries({ queryKey: ['userRoleInfo', userPrincipal] });
      queryClient.invalidateQueries({ queryKey: ['allModerators'] });
    },
  });
}

export function usePromoteToAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userPrincipal: string) => {
      if (!actor) throw new Error('Actor not initialized');
      const principal = Principal.fromText(userPrincipal);
      return actor.promoteToAdmin(principal);
    },
    onSuccess: (_, userPrincipal) => {
      queryClient.invalidateQueries({ queryKey: ['userRoleInfo', userPrincipal] });
    },
  });
}

export function useGetAllModerators() {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ['allModerators'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllModerators();
    },
    enabled: !!actor && !isFetching,
  });
}

// Admin Token Management
export function useGenerateAdminToken() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.generateAdminToken();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeAdminTokens'] });
      queryClient.invalidateQueries({ queryKey: ['allAdminTokens'] });
    },
  });
}

export function useGetActiveAdminTokens() {
  const { actor, isFetching } = useActor();

  return useQuery<AdminToken[]>({
    queryKey: ['activeAdminTokens'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getActiveAdminTokens();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllAdminTokens() {
  const { actor, isFetching } = useActor();

  return useQuery<AdminToken[]>({
    queryKey: ['allAdminTokens'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAdminTokens();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRevokeAdminToken() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.revokeAdminToken(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeAdminTokens'] });
      queryClient.invalidateQueries({ queryKey: ['allAdminTokens'] });
    },
  });
}

export function useValidateAndRequestPromotion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.validateAndRequestPromotion(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerRoleInfo'] });
      queryClient.invalidateQueries({ queryKey: ['hasPendingPromotion'] });
    },
  });
}

export function useHasPendingPromotion() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['hasPendingPromotion'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.hasPendingPromotion();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPendingPromotions() {
  const { actor, isFetching } = useActor();

  return useQuery<PendingPromotion[]>({
    queryKey: ['pendingPromotions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingPromotions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useProcessPendingPromotions() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.processPendingPromotions();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingPromotions'] });
      queryClient.invalidateQueries({ queryKey: ['callerRoleInfo'] });
    },
  });
}

// Product Queries
export function useGetProducts() {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProduct(id: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Product | null>({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getProduct(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: {
      id: string;
      name: string;
      description: string;
      category: ProductCategory;
      upiAmount: bigint;
      available: boolean;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addProduct(
        product.id,
        product.name,
        product.description,
        product.category,
        product.upiAmount,
        product.available
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: {
      id: string;
      name: string;
      description: string;
      category: ProductCategory;
      upiAmount: bigint;
      available: boolean;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateProduct(
        product.id,
        product.name,
        product.description,
        product.category,
        product.upiAmount,
        product.available
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteProduct(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useToggleProductAvailability() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.toggleProductAvailability(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Server Status Queries
export function useGetServerAddress() {
  const { actor, isFetching } = useActor();

  return useQuery<string>({
    queryKey: ['serverAddress'],
    queryFn: async () => {
      if (!actor) return '';
      return actor.getServerAddress();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCachedStatus() {
  const { actor, isFetching } = useActor();

  return useQuery<ServerStatus | null>({
    queryKey: ['serverStatus'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCachedStatus();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

// Order Queries
export function useGetOrders() {
  const { actor, isFetching } = useActor();

  return useQuery<MinecraftOrder[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCallerOrders() {
  const { actor, isFetching } = useActor();

  return useQuery<MinecraftOrder[]>({
    queryKey: ['callerOrders'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCallerOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

// UPI Queries
export function useGetAdminUpiId() {
  const { actor, isFetching } = useActor();

  return useQuery<string>({
    queryKey: ['adminUpiId'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAdminUpiId();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetAdminUpiId() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newUpiId: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.setAdminUpiId(newUpiId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUpiId'] });
    },
  });
}

export function useGenerateUpiQr() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cartItems,
      customer,
    }: {
      cartItems: CartItem[];
      customer: string | null;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.generateUpiQr(cartItems, customer || '');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerOrders'] });
    },
  });
}

export function useGetQrStatus(transactionReference: string) {
  const { actor, isFetching } = useActor();

  return useQuery<string>({
    queryKey: ['qrStatus', transactionReference],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getQrStatus(transactionReference);
    },
    enabled: !!actor && !isFetching && !!transactionReference,
    refetchInterval: 3000,
  });
}

export function useConfirmUpiPaymentUsingQr() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionReference: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.confirmUpiPaymentUsingQr(transactionReference);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['callerOrders'] });
      queryClient.invalidateQueries({ queryKey: ['callerUpiTransactions'] });
    },
  });
}

export function useGetCallerUpiTransactions() {
  const { actor, isFetching } = useActor();

  return useQuery<UpiTransaction[]>({
    queryKey: ['callerUpiTransactions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCallerUpiTransactions();
    },
    enabled: !!actor && !isFetching,
  });
}
