'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  Phone,
  Globe,
  Clock,
  Star,
  Shield,
  Users,
  CreditCard,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { usePageMetadata } from "@/context/pagemetadataContext";
import { usePiNetwork } from '@/context/PiNetworkContext';
import { LISTING_PAYMENTS } from '@/lib/pi-network';

interface BusinessFormData {
  name: string;
  category: string;
  description: string;
  city: string;
  country: string;
  email: string;
  website: string;
  piWalletAddress: string;
  acceptsPiPayments: boolean;
}

const BusinessListingPage: React.FC = () => {
  const { setHeading, setTitle, setDescription } = usePageMetadata();
  const { isAuthenticated, user, authenticate, syncUser, createListingPayment } = usePiNetwork();
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    category: '',
    description: '',
    city: '',
    country: '',
    email: '',
    website: '',
    piWalletAddress: '',
    acceptsPiPayments: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'payment' | 'success' | 'error'>('idle');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  React.useEffect(() => {
    setHeading('Business Listing');
    setTitle('Business Listing - Clubhouse Pi');
    setDescription('List your local or online business that accepts Pi payments in our business directory');
  }, [setHeading, setTitle, setDescription]);

  const handleInputChange = (field: keyof BusinessFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.description || !formData.city || !formData.country || !formData.email) {
      setErrorMessage('Please fill in all required fields');
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
      if (!user?._id) { await syncUser(); }
 
      const listingData = {
        name: formData.name,
          category: formData.category,
          description: formData.description,
          city: formData.city,
          country: formData.country,
        email: formData.email,
        website: formData.website || undefined,
          piWalletAddress: formData.piWalletAddress || undefined,
        acceptsPiPayments: formData.acceptsPiPayments
      };
  
      const paymentResult = await createListingPayment(
        'business',
        listingData,
        { email: formData.email, name: formData.name }
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
      console.error('Business listing submission error:', error);
      setPaymentStatus('error');
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    'Restaurant & Food', 'Retail & Shopping', 'Health & Wellness', 'Beauty & Personal Care',
    'Automotive', 'Home & Garden', 'Professional Services', 'Financial Services',
    'Real Estate', 'Travel & Tourism', 'Entertainment', 'Sports & Recreation',
    'Education & Training', 'Technology', 'Manufacturing', 'Construction',
    'Transportation', 'Agriculture', 'Non-Profit', 'Government', 'Other'
  ];

  const businessPrice = LISTING_PAYMENTS.business.amount;

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
                      <p>💰 Amount: {businessPrice} Pi</p>
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
                  Business Listed Successfully!
                </h1>
                <p className="text-green-700 dark:text-green-400 mb-6">
                Thank you for submitting your business! Our team will review your application and get back to you within 3-5 business days.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild variant="outline">
                    <Link href="/ecology">View Ecosystem</Link>
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
            <Store className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Business Listing</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            List your local or online business that accepts Pi payments in our comprehensive business directory. Connect with the Pi Network community.
          </p>
          <div className="mt-4">
            <Badge variant="secondary" className="text-sm">
              <CreditCard className="h-4 w-4 mr-1" />
              Pi Payment Required • Instant Approval • Professional Directory
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
                <Store className="h-6 w-6 mr-2" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Label htmlFor="name">Business Name *</Label>
                  <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your business name"
                    required
                  />
              </div>
              
              <div>
                    <Label htmlFor="category">Business Category *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full p-2 border border-input rounded-md bg-background"
                  required
                >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                  ))}
                </select>
              </div>

              <div>
                    <Label htmlFor="email">Contact Email *</Label>
                <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="contact@business.com"
                  required
                />
              </div>
                </div>

                {/* Location */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                    Location
                  </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Enter city"
                    required
                  />
              </div>

                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                        placeholder="Enter country"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="border-t pt-6">
                  <Label htmlFor="description">Business Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your business, services, and what makes you unique..."
                    rows={4}
                    maxLength={500}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.description.length}/500 characters
                  </p>
                </div>

                {/* Contact & Payment */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    Contact & Payment Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                      <Label htmlFor="website">Website</Label>
                  <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://yourbusiness.com"
                      />
              </div>

                <div>
                  <Label htmlFor="piWalletAddress">Pi Wallet Address</Label>
                  <Input
                    id="piWalletAddress"
                    value={formData.piWalletAddress}
                    onChange={(e) => handleInputChange('piWalletAddress', e.target.value)}
                        placeholder="Enter your Pi wallet address"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="acceptsPiPayments"
                        checked={formData.acceptsPiPayments}
                        onCheckedChange={(checked) => handleInputChange('acceptsPiPayments', checked as boolean)}
                      />
                      <Label htmlFor="acceptsPiPayments">
                        My business accepts Pi payments
                      </Label>
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
                        Submit Business Listing ({businessPrice} Pi)
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Payment required for listing approval. Your business will be instantly approved after payment.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
              </div>
      </div>
    </div>
  );
};

export default BusinessListingPage; 