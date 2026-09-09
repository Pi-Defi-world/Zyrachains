'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  CheckCircle, 
  AlertCircle, 
  CreditCard,
  Loader2,
  RefreshCw,
  MessageCircle
} from 'lucide-react';
import { usePageMetadata } from "@/context/pagemetadataContext";
import { usePiNetwork } from '@/context/PiNetworkContext';

interface UpdateFormData {
  projectName: string;
  email: string;
  updatedInfo: {
  description: string;
  website: string;
    piWalletAddress: string;
  };
  changeReason: string;
}

const UpdateListingPage: React.FC = () => {
  const { setHeading, setTitle, setDescription } = usePageMetadata();
  const { isAuthenticated, user, authenticate, syncUser, createListingPayment } = usePiNetwork();
  const [formData, setFormData] = useState<UpdateFormData>({
    projectName: '',
    email: '',
    updatedInfo: {
      description: '',
      website: '',
      piWalletAddress: ''
    },
    changeReason: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'payment' | 'success' | 'error'>('idle');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  React.useEffect(() => {
    setHeading('Update Listing');
    setTitle('Listing Update On Zyrachain');
    setDescription('Update your existing listing information in our Pi Network ecosystem Data center');
  }, [setHeading, setTitle, setDescription]);

  const handleInputChange = (field: keyof UpdateFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdatedInfoChange = (field: keyof UpdateFormData['updatedInfo'], value: string) => {
    setFormData(prev => ({
      ...prev,
      updatedInfo: { ...prev.updatedInfo, [field]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.projectName || !formData.email || !formData.changeReason) {
      setErrorMessage('Please fill in all required fields');
      setSubmitStatus('error');
      return;
    }

    // Check if at least one update field is provided
    const hasUpdates = formData.updatedInfo.description || formData.updatedInfo.website || formData.updatedInfo.piWalletAddress;
    if (!hasUpdates) {
      setErrorMessage('Please provide at least one piece of information to update');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('payment');
    setPaymentStatus('processing');
    
    try {
      if (!isAuthenticated) {
        await authenticate();
        if (!isAuthenticated) {
          setErrorMessage('Authentication required. Please connect your Pi wallet.');
          setSubmitStatus('error');
          setIsSubmitting(false);
          return;
        }
      }
      if (!user?._id) {
        await syncUser();
      }

      // Prepare listing data
      const listingData = {
        projectName: formData.projectName,
        email: formData.email,
        updatedInfo: {
          description: formData.updatedInfo.description || undefined,
          website: formData.updatedInfo.website || undefined,
          piWalletAddress: formData.updatedInfo.piWalletAddress || undefined
        },
        changeReason: formData.changeReason
      };

      // Process Pi payment
      const paymentResult = await createListingPayment(
        'update',
        listingData,
        {
          email: formData.email,
          name: formData.projectName
        }
      );

      if (paymentResult.success) {
        setPaymentStatus('success');
        setSubmitStatus('success');
      } else {
        setPaymentStatus('error');
        setSubmitStatus('error');
        setErrorMessage(paymentResult.error || 'Payment failed');
      }

    } catch (error: any) {
      console.error('Update listing submission error:', error);
      setPaymentStatus('error');
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Payment processing state
  if (submitStatus === 'payment') {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-8">
                {paymentStatus === 'processing' && (
                  <>
                    <Loader2 className="h-16 w-16 text-emerald-500 mx-auto mb-4 animate-spin" />
                    <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mb-4">
                      Processing Pi Payment
                    </h1>
                    <p className="text-emerald-700 dark:text-emerald-400 mb-6">
                      Please complete the payment process in the Pi Wallet modal.
                    </p>
                    <div className="space-y-2 text-sm text-emerald-600 dark:text-emerald-400">
                      <p>Amount: 80 Pi</p>
                      <p>Update listing fee for Clubhouse Pi ecosystem</p>
                      <p>⚡ Instant approval after payment</p>
                    </div>
                  </>
                )}
                {paymentStatus === 'error' && (
                  <>
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-red-800 dark:text-red-300 mb-4">
                      Payment Failed
                    </h1>
                    <p className="text-red-700 dark:text-red-400 mb-6">
                      {errorMessage}
                    </p>
                    <Button onClick={() => setSubmitStatus('idle')} variant="outline">
                      Try Again
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-4">
                  Update Request Submitted Successfully!
                </h1>
                <p className="text-green-700 dark:text-green-400 mb-6">
                  Your payment has been processed and your update request has been submitted. We'll review and apply your changes within 24 hours.
                </p>
                <div className="space-y-2 text-sm text-green-600 dark:text-green-400 mb-6">
                  <p>  Payment: 80 Pi processed successfully</p>
                  <p>  Update request submitted</p>
                  <p>  Confirmation sent to: {formData.email}</p>
                  <p>  Changes will be applied within 48 hours</p>
                </div>
                <div className="flex gap-4 justify-center">
                  <Button asChild variant="outline">
                    <Link href="/ecosystem">View Ecosystem</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/">Return to Home</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Edit className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Update Listing</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Update your existing listing information in our Pi Network ecosystem directory. Keep your information current and accurate.
          </p>
          <div className="mt-4">
            <Badge variant="secondary" className="text-sm">
              <CreditCard className="h-4 w-4 mr-1" />
              Update Fee: 80 Pi • 24-hour Processing
            </Badge>
          </div>
        </div>

        {/* Error Message */}
        {submitStatus === 'error' && (
          <div className="max-w-4xl mx-auto mb-8">
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700 dark:text-red-400">{errorMessage}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Form */}
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                <Edit className="h-6 w-6 mr-2" />
                Update Request Information
                </CardTitle>
              </CardHeader>
              <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Project Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Label htmlFor="projectName">Project/Business Name *</Label>
                    <Input
                      id="projectName"
                      value={formData.projectName}
                      onChange={(e) => handleInputChange('projectName', e.target.value)}
                      placeholder="Enter the exact name of your listed project or business"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                        <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your.email@example.com"
                      required
                        />
                      </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="changeReason">Reason for Update *</Label>
                    <Textarea
                      id="changeReason"
                      value={formData.changeReason}
                      onChange={(e) => handleInputChange('changeReason', e.target.value)}
                      placeholder="Explain why you're requesting this update (e.g., new features, contact changes, etc.)"
                      rows={3}
                      maxLength={300}
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      {formData.changeReason.length}/300 characters
                    </p>
                      </div>
                    </div>

                {/* Updated Information */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Information to Update
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Fill in only the fields you want to update. Leave blank if no change is needed.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="description">Updated Description</Label>
                      <Textarea
                        id="description"
                        value={formData.updatedInfo.description}
                        onChange={(e) => handleUpdatedInfoChange('description', e.target.value)}
                        placeholder="New or updated description of your project/business"
                        rows={3}
                        maxLength={500}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {formData.updatedInfo.description.length}/500 characters
                      </p>
                  </div>

                  <div>
                      <Label htmlFor="website">Updated Website</Label>
                        <Input
                          id="website"
                          type="url"
                        value={formData.updatedInfo.website}
                        onChange={(e) => handleUpdatedInfoChange('website', e.target.value)}
                        placeholder="https://Zyrachain.app"
                      />
                  </div>

                  <div>
                      <Label htmlFor="piWalletAddress">Updated Pi Wallet Address</Label>
                        <Input
                        id="piWalletAddress"
                        value={formData.updatedInfo.piWalletAddress}
                        onChange={(e) => handleUpdatedInfoChange('piWalletAddress', e.target.value)}
                        placeholder="G..."
                        pattern="G[A-Z0-9]{55}"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Your new Pi wallet address for receiving payments
                      </p>
                    </div>
                    </div>
                  </div>

                {/* Submit Button */}
                <div className="border-t pt-6">
                        <Button 
                          type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Submit Update Request (80 Pi)
                      </>
                    )}
                        </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default UpdateListingPage; 