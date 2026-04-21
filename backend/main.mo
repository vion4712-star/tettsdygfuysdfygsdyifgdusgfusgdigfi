import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import OutCall "http-outcalls/outcall";
import Stripe "stripe/Stripe";
import StripeMixin "stripe/StripeMixin";
import Nat "mo:core/Nat";
import Nat8 "mo:core/Nat8";
import Blob "mo:core/Blob";
import Random "mo:core/Random";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Integrate Stripe service for payment processing
  let stripe = Stripe.init(accessControlState, "inr");
  include StripeMixin(stripe);

  // Product category type
  public type ProductCategory = {
    #rank;
    #crateKey;
    #perk;
  };

  // Product (item) representation
  public type Product = {
    id : Text;
    name : Text;
    description : Text;
    category : ProductCategory;
    upiAmount : Nat;
    available : Bool;
  };

  // Server status information
  public type ServerStatus = {
    online : Bool;
    playerCount : Nat;
    message : Text;
    timestamp : Int;
  };

  // Shopping cart item
  public type CartItem = {
    productId : Text;
    quantity : Nat;
  };

  // User profile
  public type UserProfile = {
    name : Text;
    minecraftUsername : Text;
    email : Text;
  };

  // Order data structure
  public type MinecraftOrder = {
    id : Text;
    upiPaymentReference : ?Text;
    paymentStatus : Text;
    customer : ?Text;
    items : [CartItem];
    totalAmount : Nat;
    timestamp : Int;
    owner : Principal;
  };

  // UPI transaction data
  public type UpiTransaction = {
    upiId : Text;
    amount : Nat;
    transactionReference : Text;
    timestamp : Int;
    owner : Principal;
  };

  // UPI QR transaction data
  public type UpiQrTransaction = {
    qrCode : Text;
    amount : Nat;
    transactionReference : Text;
    timestamp : Int;
    status : Text;
    owner : Principal;
  };

  // Admin and role information
  public type UserRoleInfo = {
    principal : Principal;
    isAdmin : Bool;
    isModerator : Bool;
  };

  // Login input type
  public type LoginInput = {
    principal : Principal;
    minecraftUsername : Text;
  };

  // Product information type
  public type ProductInfo = {
    id : Text;
    name : Text;
    description : Text;
    price : Nat;
    category : ProductCategory;
  };

  // Admin token data
  public type AdminToken = {
    token : Text;
    createdBy : Principal;
    createdAt : Int;
    expiresAt : Int;
    used : Bool;
    revoked : Bool;
    usedBy : ?Principal;
  };

  // Pending promotion request
  public type PendingPromotion = {
    user : Principal;
    token : Text;
    requestedAt : Int;
  };

  // Product inventory management
  let products = Map.empty<Text, Product>();

  // Additional state management
  let orders = Map.empty<Text, MinecraftOrder>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let emailToPrincipal = Map.empty<Text, Principal>();
  let upiTransactions = Map.empty<Text, UpiTransaction>();
  let upiQrTransactions = Map.empty<Text, UpiQrTransaction>();
  let moderators = Map.empty<Principal, Bool>();
  let adminTokens = Map.empty<Text, AdminToken>();
  let pendingPromotions = Map.empty<Principal, PendingPromotion>();
  var lastTokenGenerationTime : Int = 0;
  var lastServerStatusFetch : Int = 0;

  var cachedStatus : ?ServerStatus = null;
  var adminUpiId : Text = "9971378629@mbk";
  let serverAddress = "epyc-m1.veltrionhost.fun:25576";
  let qrExpirationMillis : Nat = 5 * 60 * 1000000000; // 5 minutes

  let primaryAdminEmail : Text = "vion4712@gmail.com";
  let tokenExpirationMillis : Int = 24 * 60 * 60 * 1000000000; // 24 hours
  let tokenGenerationCooldown : Int = 60 * 1000000000; // 1 minute cooldown
  let serverStatusFetchCooldown : Int = 10 * 1000000000; // 10 seconds cooldown for server status

  // Predefined product prices
  let predefinedStripePrices = [
    {
      priceId = "iron_rank";
      name = "Iron Rank";
      description = "Unique Minecraft rank";
      unitAmount = 10000;
    },
    {
      priceId = "diamond_rank";
      name = "Diamond Rank";
      description = "Premium Minecraft rank";
      unitAmount = 25000;
    },
  ];

  // Check moderator status
  func isModerator(principal : Principal) : Bool {
    switch (moderators.get(principal)) {
      case (null) { false };
      case (?isMod) { isMod };
    };
  };

  // Check admin or moderator status
  func isAdminOrModerator(principal : Principal) : Bool {
    AccessControl.isAdmin(accessControlState, principal) or isModerator(principal);
  };

  // Verify primary admin status
  func isPrimaryAdmin(principal : Principal) : Bool {
    switch (userProfiles.get(principal)) {
      case (null) { false };
      case (?profile) {
        profile.email == primaryAdminEmail and AccessControl.isAdmin(accessControlState, principal);
      };
    };
  };

  // Check if user is authenticated via email-based system
  func isEmailAuthenticated(caller : Principal) : Bool {
    switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?profile) {
        // User has a profile with valid email, they are authenticated
        profile.email.size() > 0;
      };
    };
  };

  // Require admin authorization
  func requireAdmin(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  // Require admin or moderator authorization
  func requireAdminOrModerator(caller : Principal) {
    if (not isAdminOrModerator(caller)) {
      Runtime.trap("Unauthorized: Only admins or moderators can perform this action");
    };
  };

  // Require user authentication (prefers email-based)
  func requireAuthenticatedUser(caller : Principal) {
    if (isEmailAuthenticated(caller) or AccessControl.hasPermission(accessControlState, caller, #user)) {
      return;
    };
    Runtime.trap("Unauthorized: Only authenticated users can perform this action");
  };

  // Require primary admin privileges
  func requirePrimaryAdmin(caller : Principal) {
    if (not isPrimaryAdmin(caller)) {
      Runtime.trap("Unauthorized: Only the primary admin can perform this action");
    };
  };

  // Assign moderator role
  public shared ({ caller }) func assignModeratorRole(user : Principal) : async () {
    requireAdmin(caller);
    moderators.add(user, true);
  };

  // Revoke moderator role
  public shared ({ caller }) func revokeModeratorRole(user : Principal) : async () {
    requireAdmin(caller);
    moderators.remove(user);
  };

  // Promote user to admin
  public shared ({ caller }) func promoteToAdmin(user : Principal) : async () {
    requireAdmin(caller);
    checkEligibilityForAdmin(user);
    AccessControl.assignRole(accessControlState, caller, user, #admin);
  };

  // Check eligibility for admin promotion
  func checkEligibilityForAdmin(user : Principal) {
    let userProfile = switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) { profile };
    };

    // Prevent admins and moderators from being promoted
    if (isAdminOrModerator(user)) {
      Runtime.trap("Cannot promote admins or moderators");
    };

    // Prevent default admin promotion
    if (userProfile.email == primaryAdminEmail) {
      Runtime.trap("Primary admin cannot be re-promoted");
    };
  };

  // Get user role information
  public query ({ caller }) func getUserRole(user : Principal) : async UserRoleInfo {
    requireAuthenticatedUser(caller);

    {
      principal = user;
      isAdmin = AccessControl.isAdmin(accessControlState, user);
      isModerator = isModerator(user);
    };
  };

  // Get caller's role information
  public query ({ caller }) func getCallerRole() : async UserRoleInfo {
    requireAuthenticatedUser(caller);

    {
      principal = caller;
      isAdmin = AccessControl.isAdmin(accessControlState, caller);
      isModerator = isModerator(caller);
    };
  };

  // Get all moderators
  public query ({ caller }) func getAllModerators() : async [Principal] {
    requireAdmin(caller);
    moderators.keys().toArray();
  };

  // Initialize predefined Stripe prices
  public shared ({ caller }) func initializePrices() : async () {
    requireAdmin(caller);

    for (price in predefinedStripePrices.values()) {
      stripe.addStripePrice(caller, price);
    };
  };

  // Generate UPI QR code for cart items
  public shared ({ caller }) func generateUpiQr(cartItems : [CartItem], customer : Text) : async Text {
    requireAuthenticatedUser(caller);

    var totalAmount : Nat = 0;
    for (item in cartItems.values()) {
      switch (products.get(item.productId)) {
        case (null) {
          Runtime.trap("Product not found: " # item.productId);
        };
        case (?product) {
          if (not product.available) {
            Runtime.trap("Product not available: " # item.productId);
          };
          totalAmount += product.upiAmount * item.quantity;
        };
      };
    };

    let transactionReference = await generateTransactionReference();
    let currentTime : Int = Time.now();
    let qrCode = createUpiQrCode(totalAmount, transactionReference);

    let transaction : UpiQrTransaction = {
      qrCode;
      amount = totalAmount;
      transactionReference;
      timestamp = currentTime;
      status = "pending";
      owner = caller;
    };

    upiQrTransactions.add(transactionReference, transaction);

    // Store the corresponding order with pending status
    let newOrder : MinecraftOrder = {
      id = transactionReference;
      upiPaymentReference = ?transactionReference;
      paymentStatus = "pending";
      customer = ?customer;
      items = cartItems;
      totalAmount;
      timestamp = currentTime;
      owner = caller;
    };
    orders.add(transactionReference, newOrder);

    qrCode;
  };

  // Confirm UPI payment using QR transaction reference
  public shared ({ caller }) func confirmUpiPaymentUsingQr(transactionReference : Text) : async () {
    requireAuthenticatedUser(caller);

    let qrTransaction = switch (upiQrTransactions.get(transactionReference)) {
      case (null) {
        Runtime.trap("QR transaction not found");
      };
      case (?qrTx) { qrTx };
    };

    // Verify ownership: only the transaction owner can confirm their own payment
    if (qrTransaction.owner != caller) {
      Runtime.trap("Unauthorized: Can only confirm your own payments");
    };

    if (isQrExpired(qrTransaction.timestamp)) {
      Runtime.trap("QR code has expired. Please generate a new one.");
    };

    let order = switch (orders.get(transactionReference)) {
      case (null) {
        Runtime.trap("Order not found");
      };
      case (?ord) { ord };
    };

    // Verify order ownership matches transaction ownership and caller
    if (order.owner != qrTransaction.owner or order.owner != caller) {
      Runtime.trap("Unauthorized: Order ownership mismatch");
    };

    // Update order and QR transaction status
    orders.add(
      transactionReference,
      {
        order with
        paymentStatus = "confirmed";
      },
    );
    upiQrTransactions.add(
      transactionReference,
      {
        qrTransaction with
        status = "confirmed";
      },
    );
  };

  // Add UPI transaction (order payment record)
  public shared ({ caller }) func addUpiTransaction(transactionReference : Text, upiId : Text, amount : Nat) : async () {
    requireAuthenticatedUser(caller);

    let order = switch (orders.get(transactionReference)) {
      case (null) {
        Runtime.trap("Order not found for transaction reference");
      };
      case (?ord) { ord };
    };

    if (order.owner != caller) {
      Runtime.trap("Unauthorized: Can only add transactions for your own orders");
    };

    if (amount != order.totalAmount) {
      Runtime.trap("Transaction amount does not match order amount");
    };

    let transaction : UpiTransaction = {
      upiId;
      amount;
      transactionReference;
      timestamp = Time.now();
      owner = caller;
    };
    upiTransactions.add(transactionReference, transaction);
  };

  // Get the status of a QR transaction
  public query ({ caller }) func getQrStatus(transactionReference : Text) : async Text {
    requireAuthenticatedUser(caller);

    switch (upiQrTransactions.get(transactionReference)) {
      case (null) { "not_found" };
      case (?transaction) {
        // Only the owner or admin/moderator can check status
        if (transaction.owner != caller and not isAdminOrModerator(caller)) {
          Runtime.trap("Unauthorized: Can only check status of your own QR codes");
        };

        if (isQrExpired(transaction.timestamp)) {
          "expired";
        } else {
          transaction.status;
        };
      };
    };
  };

  // Create UPI QR code string (UPI URL)
  func createUpiQrCode(amount : Nat, transactionReference : Text) : Text {
    "upi://pay?pa=" # adminUpiId # "&pn=CupCake%20SMP%20Store&tr=" # transactionReference # "&tn=OrderPayment&am=" # amount.toText() # "&cu=INR";
  };

  // Get all active (non-expired) QR transactions
  public query ({ caller }) func getActiveUpiQrs() : async [UpiQrTransaction] {
    requireAdminOrModerator(caller);

    let currentTime = Time.now();

    let filterFunc = func(transaction : UpiQrTransaction) : Bool {
      (transaction.timestamp + qrExpirationMillis) > currentTime;
    };

    upiQrTransactions.values().toArray().filter<UpiQrTransaction>(filterFunc);
  };

  // Check if a QR code is expired based on creation time
  func isQrExpired(creationTime : Int) : Bool {
    let currentTime = Time.now();
    (currentTime - creationTime) > qrExpirationMillis;
  };

  // Generate unique transaction reference with cryptographic randomness
  func generateTransactionReference() : async Text {
    let timestamp = Time.now().toText();
    let randomBytes = await Random.blob();
    let randomPart = bytesToHex(randomBytes.toArray());
    timestamp.concat(randomPart);
  };

  // Convert bytes to hex string
  func bytesToHex(bytes : [Nat8]) : Text {
    var hex = "";
    for (byte in bytes.vals()) {
      hex := hex # natToHex(byte.toNat());
    };
    hex;
  };

  // Convert nat to hex (helper)
  func natToHex(n : Nat) : Text {
    let chars = "0123456789abcdef";
    if (n < 16) {
      let c = chars.chars().toArray()[n];
      Text.fromChar(c);
    } else {
      natToHex(n / 16) # natToHex(n % 16);
    };
  };

  // Set admin's UPI ID (admin-only)
  public shared ({ caller }) func setAdminUpiId(newUpiId : Text) : async () {
    requireAdmin(caller);
    adminUpiId := newUpiId;
  };

  // Get admin's UPI ID (admin-only)
  public query ({ caller }) func getAdminUpiId() : async Text {
    requireAdmin(caller);
    adminUpiId;
  };

  // Get caller's user profile
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    requireAuthenticatedUser(caller);
    userProfiles.get(caller);
  };

  // Save or update caller's user profile
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    // This function handles both registration (new users) and profile updates (existing users)

    // Validate Minecraft username
    if (profile.minecraftUsername.size() < 3) {
      Runtime.trap("Minecraft username must be at least 3 characters");
    };

    // Validate email format (basic check)
    if (profile.email.size() < 5 or not profile.email.contains(#text "@")) {
      Runtime.trap("Invalid email address");
    };

    // Check if this is an existing user updating their profile
    let isExistingUser = switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?_) { true };
    };

    // Check if email is already registered to another principal
    switch (emailToPrincipal.get(profile.email)) {
      case (null) {};
      case (?existingPrincipal) {
        if (existingPrincipal != caller) {
          Runtime.trap("Email already registered to another account");
        };
      };
    };

    // Remove old email mapping if user is updating email
    switch (userProfiles.get(caller)) {
      case (null) {};
      case (?oldProfile) {
        if (oldProfile.email != profile.email) {
          emailToPrincipal.remove(oldProfile.email);
        };
      };
    };

    // Add new email mapping
    emailToPrincipal.add(profile.email, caller);
    userProfiles.add(caller, profile);

    // Automatically promote primary admin if email matches
    if (profile.email == primaryAdminEmail) {
      if (not AccessControl.isAdmin(accessControlState, caller)) {
        AccessControl.assignRole(accessControlState, caller, caller, #admin);
      };
    };
  };

  // Update Minecraft username for the caller
  public shared ({ caller }) func updateMinecraftUsername(minecraftUsername : Text) : async () {
    requireAuthenticatedUser(caller);

    if (minecraftUsername.size() < 3) {
      Runtime.trap("Minecraft username must be at least 3 characters");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) {
        userProfiles.add(
          caller,
          {
            profile with
            minecraftUsername;
          },
        );
      };
    };
  };

  // Get user profile (view-only, restricted by roles)
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    requireAuthenticatedUser(caller);

    // Users can view their own profile, admins/mods can view any profile
    if (caller != user and not isAdminOrModerator(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Get all products (public access for browsing)
  public query func getProducts() : async [Product] {
    products.values().toArray();
  };

  // Get a specific product by ID (public access for browsing)
  public query func getProduct(id : Text) : async Product {
    switch (products.get(id)) {
      case (null) {
        Runtime.trap("Product not found");
      };
      case (?product) { product };
    };
  };

  // Add a new product (admin/moderator only)
  public shared ({ caller }) func addProduct(id : Text, name : Text, description : Text, category : ProductCategory, upiAmount : Nat, available : Bool) : async () {
    requireAdminOrModerator(caller);
    products.add(
      id,
      {
        id;
        name;
        description;
        category;
        upiAmount;
        available;
      },
    );
  };

  // Update an existing product (admin/moderator only)
  public shared ({ caller }) func updateProduct(id : Text, name : Text, description : Text, category : ProductCategory, upiAmount : Nat, available : Bool) : async () {
    requireAdminOrModerator(caller);
    switch (products.get(id)) {
      case (null) {
        Runtime.trap("Product not found");
      };
      case (?_) {
        products.add(
          id,
          {
            id;
            name;
            description;
            category;
            upiAmount;
            available;
          },
        );
      };
    };
  };

  // Delete a product (admin/moderator only)
  public shared ({ caller }) func deleteProduct(id : Text) : async () {
    requireAdminOrModerator(caller);
    switch (products.get(id)) {
      case (null) {
        Runtime.trap("Product not found");
      };
      case (?_) {
        products.remove(id);
      };
    };
  };

  // Toggle product availability (admin/moderator only)
  public shared ({ caller }) func toggleProductAvailability(id : Text) : async () {
    requireAdminOrModerator(caller);
    switch (products.get(id)) {
      case (null) {
        Runtime.trap("Product not found");
      };
      case (?product) {
        products.add(
          id,
          {
            product with
            available = not product.available;
          },
        );
      };
    };
  };

  // Get all orders (restricted to admin/mods)
  public query ({ caller }) func getOrders() : async [MinecraftOrder] {
    requireAdminOrModerator(caller);
    orders.values().toArray();
  };

  // Get order details (user can view own orders, admins/mods can view any)
  public query ({ caller }) func getOrder(id : Text) : async MinecraftOrder {
    requireAuthenticatedUser(caller);

    switch (orders.get(id)) {
      case (null) {
        Runtime.trap("Order not found");
      };
      case (?order) {
        // Only the order owner or admin/mod can view order
        if (order.owner != caller and not isAdminOrModerator(caller)) {
          Runtime.trap("Unauthorized: Can only view your own orders");
        };
        order;
      };
    };
  };

  // Get all orders for the caller (user)
  public query ({ caller }) func getCallerOrders() : async [MinecraftOrder] {
    requireAuthenticatedUser(caller);

    orders.values().toArray().filter<MinecraftOrder>(
      func(order) { order.owner == caller },
    );
  };

  // Get caller's UPI transactions
  public query ({ caller }) func getCallerUpiTransactions() : async [UpiTransaction] {
    requireAuthenticatedUser(caller);

    upiTransactions.values().toArray().filter<UpiTransaction>(
      func(transaction) { transaction.owner == caller },
    );
  };

  // Get server IP address (public)
  public query func getServerAddress() : async Text {
    serverAddress;
  };

  // HTTP outcall transformation helper (required for HTTP outcalls)
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Fetch server status via HTTP outcall (rate-limited to prevent abuse)
  public shared ({ caller }) func fetchServerStatus() : async Text {
    // Rate limiting: prevent abuse of HTTP outcalls
    let currentTime = Time.now();
    if (currentTime - lastServerStatusFetch < serverStatusFetchCooldown) {
      Runtime.trap("Rate limit exceeded: Please wait before fetching server status again");
    };
    lastServerStatusFetch := currentTime;

    let url = "https://api.mcsrvstat.us/2/" # serverAddress;
    await OutCall.httpGetRequest(url, [], transform);
  };

  // Get cached server status (public)
  public query func getCachedStatus() : async ?ServerStatus {
    cachedStatus;
  };

  // Set cached server status (admin-only)
  public shared ({ caller }) func setCachedStatus(status : ServerStatus) : async () {
    requireAdmin(caller);
    cachedStatus := ?status;
  };

  // Get principal (caller) info
  public query ({ caller }) func getPrincipalInfo() : async Text {
    requireAuthenticatedUser(caller);
    caller.toText();
  };

  // Check if caller is primary admin
  public query ({ caller }) func isPrimaryAdminAccount() : async Bool {
    requireAuthenticatedUser(caller);
    isPrimaryAdmin(caller);
  };

  // Admin Token System

  // Generate admin token (admin-only with rate limiting)
  public shared ({ caller }) func generateAdminToken() : async Text {
    requireAdmin(caller);

    // Rate limiting: enforce cooldown between token generations
    let currentTime = Time.now();
    if (currentTime - lastTokenGenerationTime < tokenGenerationCooldown) {
      Runtime.trap("Rate limit exceeded: Please wait before generating another token");
    };
    lastTokenGenerationTime := currentTime;

    let token = await generateRandomToken();
    let expiresAt = currentTime + tokenExpirationMillis;

    let adminToken : AdminToken = {
      token;
      createdBy = caller;
      createdAt = currentTime;
      expiresAt;
      used = false;
      revoked = false;
      usedBy = null;
    };

    adminTokens.add(token, adminToken);
    token;
  };

  // Validate and request admin promotion using token
  public shared ({ caller }) func validateAndRequestPromotion(token : Text) : async () {
    requireAuthenticatedUser(caller);

    // Check if user is already an admin
    if (AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("User is already an admin");
    };

    let adminToken = switch (adminTokens.get(token)) {
      case (null) {
        Runtime.trap("Invalid or expired token");
      };
      case (?t) { t };
    };

    if (adminToken.used) {
      Runtime.trap("Token has already been used");
    };

    if (adminToken.revoked) {
      Runtime.trap("Token has been revoked");
    };

    let currentTime = Time.now();
    if (currentTime > adminToken.expiresAt) {
      Runtime.trap("Token has expired");
    };

    // Verify token creator is still an admin
    if (not AccessControl.isAdmin(accessControlState, adminToken.createdBy)) {
      Runtime.trap("Token creator is no longer an admin");
    };

    // Check if user already has a pending promotion
    switch (pendingPromotions.get(caller)) {
      case (?existing) {
        Runtime.trap("User already has a pending promotion request");
      };
      case (null) {};
    };

    // Store pending promotion request
    let promotion : PendingPromotion = {
      user = caller;
      token;
      requestedAt = currentTime;
    };
    pendingPromotions.add(caller, promotion);

    // Mark token as used and record who used it
    let updatedToken = {
      adminToken with
      used = true;
      usedBy = ?caller;
    };
    adminTokens.add(token, updatedToken);
  };

  // Process pending promotions (admin-only)
  public shared ({ caller }) func processPendingPromotions() : async () {
    requireAdmin(caller);

    for ((user, promotion) in pendingPromotions.entries()) {
      // Verify token is still valid and matches the promotion request
      switch (adminTokens.get(promotion.token)) {
        case (null) {
          // Token not found, skip this promotion
        };
        case (?token) {
          // Verify token creator is still an admin at processing time
          let creatorIsAdmin = AccessControl.isAdmin(accessControlState, token.createdBy);
          
          // Verify user is not already an admin
          let userNotAdmin = not AccessControl.isAdmin(accessControlState, user);
          
          // Verify token was used by the correct user
          let correctUser = switch (token.usedBy) {
            case (null) { false };
            case (?usedBy) { usedBy == user };
          };

          // Verify token is used and not revoked
          let validToken = token.used and not token.revoked;

          if (creatorIsAdmin and userNotAdmin and correctUser and validToken) {
            // Promote user to admin
            AccessControl.assignRole(accessControlState, caller, user, #admin);
          };
        };
      };
      // Remove processed promotion
      pendingPromotions.remove(user);
    };
  };

  // Get pending promotions (admin-only)
  public query ({ caller }) func getPendingPromotions() : async [PendingPromotion] {
    requireAdmin(caller);
    pendingPromotions.values().toArray();
  };

  // Check if user has a pending promotion request
  public query ({ caller }) func hasPendingPromotion() : async Bool {
    requireAuthenticatedUser(caller);
    switch (pendingPromotions.get(caller)) {
      case (null) { false };
      case (?_) { true };
    };
  };

  // Revoke admin token (admin-only)
  public shared ({ caller }) func revokeAdminToken(token : Text) : async () {
    requireAdmin(caller);

    let adminToken = switch (adminTokens.get(token)) {
      case (null) {
        Runtime.trap("Token not found");
      };
      case (?t) { t };
    };

    if (adminToken.used) {
      Runtime.trap("Cannot revoke a token that has already been used");
    };

    let updatedToken = {
      adminToken with
      revoked = true;
    };
    adminTokens.add(token, updatedToken);
  };

  // Get active admin tokens (admin-only)
  public query ({ caller }) func getActiveAdminTokens() : async [AdminToken] {
    requireAdmin(caller);

    let currentTime = Time.now();

    let filterFunc = func(token : AdminToken) : Bool {
      not token.used and not token.revoked and token.expiresAt > currentTime
    };

    adminTokens.values().toArray().filter<AdminToken>(filterFunc);
  };

  // Get all admin tokens (admin-only)
  public query ({ caller }) func getAllAdminTokens() : async [AdminToken] {
    requireAdmin(caller);
    adminTokens.values().toArray();
  };

  // Get details of a specific admin token (admin-only)
  public query ({ caller }) func getAdminToken(token : Text) : async AdminToken {
    requireAdmin(caller);

    switch (adminTokens.get(token)) {
      case (null) {
        Runtime.trap("Token not found");
      };
      case (?t) { t };
    };
  };

  // Generate cryptographically secure random token string
  func generateRandomToken() : async Text {
    let timestamp = Time.now().toText();
    let randomBytes = await Random.blob();
    let randomPart = bytesToHex(randomBytes.toArray());
    "token_" # timestamp # "_" # randomPart;
  };
};
