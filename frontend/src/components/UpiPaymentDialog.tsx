import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGenerateUpiQr, useGetQrStatus, useConfirmUpiPaymentUsingQr } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw, Clock, Shield } from 'lucide-react';
import { CartItem } from '../backend';
import { useAuth } from '../hooks/useAuth';

interface UpiPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: Array<{ productId: string; productName: string; price: bigint; quantity: bigint }>;
  totalAmount: number;
  onSuccess: () => void;
}

export default function UpiPaymentDialog({
  open,
  onOpenChange,
  cartItems,
  totalAmount,
  onSuccess,
}: UpiPaymentDialogProps) {
  const [step, setStep] = useState<'qr' | 'success'>('qr');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [transactionRef, setTransactionRef] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [isExpired, setIsExpired] = useState(false);
  const [qrError, setQrError] = useState<string>('');
  const [upiString, setUpiString] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const qrLibLoadedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const qrGenerationTimeRef = useRef<number>(0);

  const { isAuthenticated, userProfile } = useAuth();
  const generateQr = useGenerateUpiQr();
  const confirmPayment = useConfirmUpiPaymentUsingQr();
  const { data: qrStatus } = useGetQrStatus(transactionRef);

  // Load QRCode.js library from CDN
  useEffect(() => {
    if (!qrLibLoadedRef.current && typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
      script.async = true;
      script.onload = () => {
        qrLibLoadedRef.current = true;
      };
      script.onerror = () => {
        setQrError('Failed to load QR code library. Please refresh the page.');
        toast.error('Failed to load QR code library');
      };
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (open && step === 'qr' && !transactionRef) {
      // Verify authentication before generating QR
      if (!isAuthenticated || !userProfile || !userProfile.email) {
        setQrError('Authentication required. Please login to continue.');
        toast.error('Please login to generate payment QR code');
        return;
      }
      handleGenerateQr();
    }
  }, [open, isAuthenticated, userProfile]);

  useEffect(() => {
    if (!open) {
      resetDialog();
    }
  }, [open]);

  // Countdown timer with precise 1-second intervals
  useEffect(() => {
    if (step === 'qr' && transactionRef && !isExpired && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsExpired(true);
            toast.error('QR code has expired. Please generate a new one.', {
              duration: 5000,
            });
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [step, transactionRef, isExpired, timeRemaining]);

  // Check QR status from backend
  useEffect(() => {
    if (qrStatus === 'expired' && !isExpired) {
      setIsExpired(true);
      toast.error('QR code has expired. Please generate a new one.', {
        duration: 5000,
      });
    } else if (qrStatus === 'not_found' && transactionRef) {
      setQrError('Transaction not found. Please try again.');
      toast.error('Transaction not found');
    }
  }, [qrStatus, isExpired, transactionRef]);

  const generateQRCode = (text: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        if (!qrLibLoadedRef.current) {
          reject(new Error('QR code library not loaded yet. Please wait...'));
          return;
        }

        // Create temporary container for QRCode.js
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);

        try {
          // @ts-ignore - QRCode is loaded from CDN
          const qrcode = new window.QRCode(tempDiv, {
            text: text,
            width: 160,
            height: 160,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: 2, // H level for better error correction
          });

          // Wait for QR code image to be generated
          setTimeout(() => {
            const img = tempDiv.querySelector('img');
            if (img && img.src) {
              resolve(img.src);
              document.body.removeChild(tempDiv);
            } else {
              document.body.removeChild(tempDiv);
              reject(new Error('Failed to generate QR code image'));
            }
          }, 200);
        } catch (error) {
          document.body.removeChild(tempDiv);
          reject(error);
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleGenerateQr = async () => {
    setQrError('');
    setQrCodeDataUrl('');
    
    // Verify authentication before proceeding
    if (!isAuthenticated || !userProfile || !userProfile.email) {
      const errorMsg = 'Authentication required. Please login with your email to continue.';
      setQrError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    try {
      const backendCartItems: CartItem[] = cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      // Pass customer email from authenticated user profile
      const customerEmail = userProfile.email;

      const qrCodeString = await generateQr.mutateAsync({
        cartItems: backendCartItems,
        customer: customerEmail,
      });

      setUpiString(qrCodeString);
      qrGenerationTimeRef.current = Date.now();

      // Extract transaction reference from UPI string
      const parts = qrCodeString.split('tr=');
      if (parts.length > 1) {
        const refPart = parts[1].split('&')[0];
        setTransactionRef(refPart);
      } else {
        throw new Error('Invalid QR code format: transaction reference not found');
      }

      // Validate QR code format
      if (!qrCodeString.startsWith('upi://pay?')) {
        throw new Error('Invalid UPI QR code format');
      }

      // Wait a bit for QR library to load if needed
      let retries = 0;
      const maxRetries = 10;
      
      const tryGenerateQR = async () => {
        if (!qrLibLoadedRef.current && retries < maxRetries) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 300));
          return tryGenerateQR();
        }
        
        if (!qrLibLoadedRef.current) {
          throw new Error('QR code library failed to load. Please refresh the page.');
        }

        const qrDataUrl = await generateQRCode(qrCodeString);
        setQrCodeDataUrl(qrDataUrl);
        setTimeRemaining(300);
        setIsExpired(false);
        setStep('qr');
      };

      await tryGenerateQR();
    } catch (error: any) {
      console.error('QR generation error:', error);
      let errorMessage = 'Failed to generate QR code. Please try again.';
      
      // Handle specific authentication errors
      if (error.message && error.message.includes('Unauthorized')) {
        errorMessage = 'Authentication failed. Please logout and login again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setQrError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleRefreshQr = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTransactionRef('');
    setQrCodeDataUrl('');
    setQrError('');
    setUpiString('');
    setTimeRemaining(300);
    setIsExpired(false);
    qrGenerationTimeRef.current = 0;
    handleGenerateQr();
  };

  const handleDoneClick = () => {
    if (isExpired) {
      toast.error('QR code has expired. Please generate a new one.');
      return;
    }
    
    // Check if QR is still valid (within 5 minutes)
    const elapsedSeconds = Math.floor((Date.now() - qrGenerationTimeRef.current) / 1000);
    if (elapsedSeconds >= 300) {
      setIsExpired(true);
      toast.error('QR code has expired. Please generate a new one.');
      return;
    }
    
    setShowConfirmDialog(true);
  };

  const handleConfirmYes = async () => {
    if (!transactionRef) {
      toast.error('Transaction reference not found');
      return;
    }

    if (isExpired) {
      toast.error('QR code has expired. Cannot confirm payment.');
      return;
    }

    try {
      await confirmPayment.mutateAsync(transactionRef);
      
      setShowConfirmDialog(false);
      
      // Show success toast
      toast.success('Payment marked as pending. Please wait for confirmation.', {
        duration: 3000,
      });
      
      // Close dialog and trigger success callback
      onSuccess();
      onOpenChange(false);
      
      // Automatically refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Payment confirmation error:', error);
      const errorMessage = error.message || 'Failed to confirm payment. Please try again.';
      toast.error(errorMessage);
      setShowConfirmDialog(false);
    }
  };

  const handleConfirmNo = () => {
    setShowConfirmDialog(false);
  };

  const resetDialog = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setStep('qr');
    setQrCodeDataUrl('');
    setTransactionRef('');
    setTimeRemaining(300);
    setIsExpired(false);
    setQrError('');
    setUpiString('');
    setShowConfirmDialog(false);
    qrGenerationTimeRef.current = 0;
  };

  const handleClose = () => {
    if (step !== 'success') {
      resetDialog();
    }
    onOpenChange(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm bg-black/95 text-white border-pink-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <img src="/assets/generated/qr-code-icon-transparent.dim_64x64.png" alt="QR Code" className="w-5 h-5" />
              UPI Payment
            </DialogTitle>
            <DialogDescription className="text-gray-300 text-sm">
              Scan the QR code with any UPI app to pay CupCakeMC Store
            </DialogDescription>
          </DialogHeader>

          {step === 'qr' && (
            <div className="space-y-3">
              {generateQr.isPending ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-3">
                  <Loader2 className="w-10 h-10 animate-spin text-pink-400" />
                  <p className="text-gray-300 text-sm">Generating secure QR code...</p>
                </div>
              ) : qrError ? (
                <div className="space-y-3">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{qrError}</AlertDescription>
                  </Alert>
                  <Button
                    className="w-full bg-pink-500 hover:bg-pink-600 text-white"
                    onClick={handleRefreshQr}
                    disabled={generateQr.isPending}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center space-y-3">
                    {qrCodeDataUrl && (
                      <div className="relative">
                        <img
                          src={qrCodeDataUrl}
                          alt="UPI QR Code - Pay to CupCakeMC Store"
                          className={`w-[160px] h-[160px] rounded-lg border-3 border-pink-500 ${isExpired ? 'opacity-30' : ''}`}
                        />
                        {isExpired && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold text-sm">
                              EXPIRED
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-lg font-bold">
                      <Clock className={`w-5 h-5 ${timeRemaining < 60 ? 'text-red-400 animate-pulse' : 'text-pink-400'}`} />
                      <span className={timeRemaining < 60 ? 'text-red-400' : 'text-pink-400'}>
                        {formatTime(timeRemaining)}
                      </span>
                    </div>
                  </div>

                  {isExpired ? (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        This QR code has expired. Please generate a new one to continue.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <Alert className="bg-gray-900/50 border-pink-500/30 py-2">
                        <AlertDescription className="text-sm text-gray-200">
                          <strong className="text-pink-400">Pay to CupCakeMC Store</strong>
                          <br />
                          Scan using Google Pay, PhonePe, Paytm, or any UPI app to pay ₹{totalAmount.toFixed(2)}.
                        </AlertDescription>
                      </Alert>
                      
                      <Alert className="bg-gray-900/50 border-pink-500/20 py-2">
                        <Shield className="h-4 w-4 text-pink-400" />
                        <AlertDescription className="text-xs text-gray-300">
                          <strong className="text-pink-400">Privacy Protected:</strong> Your UPI app will show "CupCakeMC Store" as the payee.
                        </AlertDescription>
                      </Alert>
                    </>
                  )}

                  <div className="p-3 bg-gray-900/50 rounded-lg space-y-1.5 border border-pink-500/20">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Items:</span>
                      <span className="font-medium text-white">{cartItems.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Pay to:</span>
                      <span className="font-bold text-pink-400">CupCakeMC Store</span>
                    </div>
                    <div className="flex justify-between text-base font-bold">
                      <span className="text-white">Total Amount:</span>
                      <span className="text-pink-400">₹{totalAmount.toFixed(2)}</span>
                    </div>
                    {transactionRef && (
                      <div className="flex justify-between text-xs pt-1.5 border-t border-gray-700">
                        <span className="text-gray-500">Transaction Ref:</span>
                        <code className="text-xs font-mono text-gray-400">{transactionRef.substring(0, 16)}...</code>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {isExpired ? (
                      <Button
                        className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
                        onClick={handleRefreshQr}
                        disabled={generateQr.isPending}
                      >
                        {generateQr.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Generate New QR Code
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
                        onClick={handleDoneClick}
                        disabled={!qrCodeDataUrl || confirmPayment.isPending}
                      >
                        {confirmPayment.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Done'
                        )}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-6 space-y-4">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
              <div>
                <h3 className="text-xl font-bold mb-2 text-white">Payment Confirmed!</h3>
                <p className="text-gray-300">
                  Your payment to CupCakeMC Store has been confirmed. You'll receive your items shortly.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-black/95 text-white border-pink-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Have you completed the payment?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Please confirm that you have successfully completed the payment using your UPI app. Your order will be marked as pending and processed once we receive confirmation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleConfirmNo} className="bg-gray-800 text-white hover:bg-gray-700 border-gray-600">No</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmYes}
              className="bg-pink-500 hover:bg-pink-600 text-white"
              disabled={confirmPayment.isPending}
            >
              {confirmPayment.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Yes'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
