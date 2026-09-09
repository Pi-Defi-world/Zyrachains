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
  User, 
  CheckCircle, 
  AlertCircle, 
  CreditCard, 
  Loader2,
  Twitter,
  MessageCircle
} from 'lucide-react';
import { usePageMetadata } from "@/context/pagemetadataContext";
import { usePiNetwork } from '@/context/PiNetworkContext';
import { LISTING_PAYMENTS } from '@/lib/pi-network';

interface InfluencerFormData {
  name: string;
  bio: string;
  expertise: string;
  contactEmail: string;
  twitter: string;
  youtube: string;
  instagram: string;
}

const InfluencerListingPage: React.FC = () => {
  const { setHeading, setTitle, setDescription } = usePageMetadata();
  const { isAuthenticated, user, authenticate, syncUser, createListingPayment } = usePiNetwork();
  const [formData, setFormData] = useState<InfluencerFormData>({
    name: '',
    bio: '',
    expertise: '',
    contactEmail: '',
    twitter: '',
    youtube: '',
    instagram: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'payment' | 'success' | 'error'>('idle');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  React.useEffect(() => {
    setHeading('Influencer Listing');
    setTitle('Influencer Listing - Pi Network Explorer');
    setDescription('List yourself as a Pi Network influencer and connect with the community');
  }, [setHeading, setTitle, setDescription]);

  const handleInputChange = (field: keyof InfluencerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.bio || !formData.expertise || !formData.contactEmail) {
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
          bio: formData.bio,
          expertise: formData.expertise,
        contactEmail: formData.contactEmail,
        twitter: formData.twitter || undefined,
        youtube: formData.youtube || undefined,
        instagram: formData.instagram || undefined
      };

      // Process Pi payment
      const paymentResult = await createListingPayment(
        'influencer',
        listingData,
        { email: formData.contactEmail, name: formData.name }
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
      console.error('Influencer listing submission error:', error);
      setPaymentStatus('error');
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const expertiseOptions = [
    'Blockchain Technology', 'Cryptocurrency Trading', 'DeFi', 'NFTs',
    'Mining', 'Technical Analysis', 'Pi Network', 'Education',
    'Content Creation', 'Community Building', 'Other'
  ];

  const influencerPrice = LISTING_PAYMENTS.influencer.amount;

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
                      <p>💰 Amount: {influencerPrice} Pi</p>
                      <p>📝 Influencer listing fee for Clubhouse Pi ecosystem</p>
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
                  Influencer Listed Successfully!
                </h1>
                <p className="text-green-700 dark:text-green-400 mb-6">
                  Your payment has been processed and your profile has been instantly approved and added to our Pi Network influencer directory!
                </p>
                <div className="space-y-2 text-sm text-green-600 dark:text-green-400 mb-6">
                  <p>✅ Payment: {influencerPrice} Pi processed successfully</p>
                  <p>👤 Influencer profile approved instantly</p>
                  <p>📧 Confirmation sent to: {formData.contactEmail}</p>
                  <p>🎯 Your profile will be live in our directory in 48 hours</p>
                </div>
                <div className="flex gap-4 justify-center">
                  <Button asChild variant="outline">
                    <Link href="/directory/influencers">View influencer listings</Link>
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
            <User className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Influencer Listing</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            List yourself as a Pi Network influencer and connect with the community. Share your expertise and grow your audience.
          </p>
          <div className="mt-4">
            <Badge variant="secondary" className="text-sm">
              <CreditCard className="h-4 w-4 mr-1" />
              Listing Fee: 50 Pi • Instant Approval
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
                <User className="h-6 w-6 mr-2" />
                Influencer Information
            </CardTitle>
          </CardHeader>
                    <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your full name"
                    required
                  />
                </div>

                  <div>
                  <Label htmlFor="expertise">Area of Expertise *</Label>
                  <select
                    id="expertise"
                    value={formData.expertise}
                      onChange={(e) => handleInputChange('expertise', e.target.value)}
                      className="w-full p-2 border border-input rounded-md bg-background"
                    required
                  >
                      <option value="">Select your expertise</option>
                      {expertiseOptions.map((expertise) => (
                        <option key={expertise} value={expertise}>
                          {expertise}
                        </option>
                      ))}
                  </select>
                </div>

                  <div className="md:col-span-2">
                <Label htmlFor="bio">Bio *</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Tell us about yourself, your experience, and what you bring to the Pi Network community"
                  rows={4}
                      maxLength={300}
                  required
                />
                    <p className="text-sm text-muted-foreground mt-1">
                      {formData.bio.length}/300 characters
                    </p>
                </div>
              </div>

                {/* Contact Information */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Contact Information
                  </h3>
                  <div>
                    <Label htmlFor="contactEmail">Email Address *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Twitter className="h-5 w-5 mr-2" />
                    Social Media Links (Optional)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                    <Label htmlFor="twitter">Twitter/X</Label>
                    <Input
                      id="twitter"
                        value={formData.twitter}
                        onChange={(e) => handleInputChange('twitter', e.target.value)}
                        placeholder="@yourusername"
                      />
                    </div>

                    <div>
                      <Label htmlFor="youtube">YouTube</Label>
                      <Input
                        id="youtube"
                        value={formData.youtube}
                        onChange={(e) => handleInputChange('youtube', e.target.value)}
                        placeholder="https://youtube.com/@yourchannel"
                    />
                  </div>

                    <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                        value={formData.instagram}
                        onChange={(e) => handleInputChange('instagram', e.target.value)}
                        placeholder="@yourusername"
                    />
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
                        Submit Influencer Listing (48 Pi)
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

export default InfluencerListingPage; 