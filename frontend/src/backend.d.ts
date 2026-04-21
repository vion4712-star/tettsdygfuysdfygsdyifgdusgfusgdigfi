import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MinecraftOrder {
    id: string;
    paymentStatus: string;
    customer?: string;
    owner: Principal;
    totalAmount: bigint;
    timestamp: bigint;
    items: Array<CartItem>;
    upiPaymentReference?: string;
}
export interface UpiTransaction {
    transactionReference: string;
    owner: Principal;
    timestamp: bigint;
    upiId: string;
    amount: bigint;
}
export interface AdminToken {
    token: string;
    expiresAt: bigint;
    revoked: boolean;
    usedBy?: Principal;
    createdAt: bigint;
    createdBy: Principal;
    used: boolean;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ServerStatus {
    playerCount: bigint;
    message: string;
    timestamp: bigint;
    online: boolean;
}
export interface PendingPromotion {
    token: string;
    user: Principal;
    requestedAt: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface PaymentSuccessResponse {
    message: string;
    payment: {
        status: string;
        paymentMethod: {
            last4: string;
            brand: string;
        };
        currency: string;
        amount: bigint;
    };
}
export interface UserRoleInfo {
    isModerator: boolean;
    principal: Principal;
    isAdmin: boolean;
}
export interface UpiQrTransaction {
    status: string;
    transactionReference: string;
    owner: Principal;
    timestamp: bigint;
    amount: bigint;
    qrCode: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface PaymentCancelResponse {
    message: string;
    sessionId: string;
}
export interface CartItem {
    productId: string;
    quantity: bigint;
}
export interface Product {
    id: string;
    name: string;
    description: string;
    available: boolean;
    upiAmount: bigint;
    category: ProductCategory;
}
export interface UserProfile {
    name: string;
    email: string;
    minecraftUsername: string;
}
export enum ProductCategory {
    perk = "perk",
    rank = "rank",
    crateKey = "crateKey"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addProduct(id: string, name: string, description: string, category: ProductCategory, upiAmount: bigint, available: boolean): Promise<void>;
    addUpiTransaction(transactionReference: string, upiId: string, amount: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignModeratorRole(user: Principal): Promise<void>;
    confirmUpiPaymentUsingQr(transactionReference: string): Promise<void>;
    deleteProduct(id: string): Promise<void>;
    fetchServerStatus(): Promise<string>;
    generateAdminToken(): Promise<string>;
    generateUpiQr(cartItems: Array<CartItem>, customer: string): Promise<string>;
    getActiveAdminTokens(): Promise<Array<AdminToken>>;
    getActiveUpiQrs(): Promise<Array<UpiQrTransaction>>;
    getAdminToken(token: string): Promise<AdminToken>;
    getAdminUpiId(): Promise<string>;
    getAllAdminTokens(): Promise<Array<AdminToken>>;
    getAllModerators(): Promise<Array<Principal>>;
    getCachedStatus(): Promise<ServerStatus | null>;
    getCallerOrders(): Promise<Array<MinecraftOrder>>;
    getCallerRole(): Promise<UserRoleInfo>;
    getCallerUpiTransactions(): Promise<Array<UpiTransaction>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getOrder(id: string): Promise<MinecraftOrder>;
    getOrders(): Promise<Array<MinecraftOrder>>;
    getPendingPromotions(): Promise<Array<PendingPromotion>>;
    getPrincipalInfo(): Promise<string>;
    getProduct(id: string): Promise<Product>;
    getProducts(): Promise<Array<Product>>;
    getQrStatus(transactionReference: string): Promise<string>;
    getServerAddress(): Promise<string>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserRole(user: Principal): Promise<UserRoleInfo>;
    hasPendingPromotion(): Promise<boolean>;
    initializePrices(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isPrimaryAdminAccount(): Promise<boolean>;
    paymentCancel(sessionId: string): Promise<PaymentCancelResponse>;
    paymentSuccess(sessionId: string, accountId: string, caffeineCustomerId: string): Promise<PaymentSuccessResponse>;
    processPendingPromotions(): Promise<void>;
    promoteToAdmin(user: Principal): Promise<void>;
    revokeAdminToken(token: string): Promise<void>;
    revokeModeratorRole(user: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setAdminUpiId(newUpiId: string): Promise<void>;
    setCachedStatus(status: ServerStatus): Promise<void>;
    toggleProductAvailability(id: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateMinecraftUsername(minecraftUsername: string): Promise<void>;
    updateProduct(id: string, name: string, description: string, category: ProductCategory, upiAmount: bigint, available: boolean): Promise<void>;
    validateAndRequestPromotion(token: string): Promise<void>;
}
