'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { 
  Send, 
  Rocket, 
  CheckCircle, 
  AlertCircle, 
} from 'lucide-react';
import { usePageMetadata } from "@/context/pagemetadataContext";
import apiClient from '@/lib/api-client';

interface FormData {
  projectName: string;
  tagline: string;
  category: string;
  description: string;
  website: string;
  twitter: string;
  github: string;
  discord: string;
  telegram: string;
  documentation: string;
  walletAddress: string;
  teamSize: string;
  launchStatus: string;
  piIntegration: string;
  contactEmail: string;
  contactName: string;
  contactRole: string;
  additionalInfo: string;
}

const GetListedPage: React.FC = () => {
  const { setHeading, setTitle, setDescription } = usePageMetadata();
  const [formData, setFormData] = useState<FormData>({
    projectName: '',
    tagline: '',
    category: '',
    description: '',
    website: '',
    twitter: '',
    github: '',
    discord: '',
    telegram: '',
    documentation: '',
    walletAddress: '',
    teamSize: '',
    launchStatus: '',
    piIntegration: '',
    contactEmail: '',
    contactName: '',
    contactRole: '',
    additionalInfo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  React.useEffect(() => {
    setHeading('Get Listed');
    setTitle('Get Listed - Pi Network Explorer');
    setDescription('Submit your Pi Network project to be featured on our ecosystem explorer');
  }, [setHeading, setTitle, setDescription]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const submitData = {
        projectName: formData.projectName,
        tagline: formData.tagline,
        description: formData.description,
        category: formData.category,
        piIntegration: formData.piIntegration,
        links: {
          website: formData.website || '',
          github: formData.github || '',
          twitter: formData.twitter || '',
          discord: formData.discord || '',
          telegram: formData.telegram || '',
          documentation: formData.documentation || '',
        },
        piWalletAddress: formData.walletAddress,
        contactInfo: {
          email: formData.contactEmail,
          name: formData.contactName,
          role: formData.contactRole,
          additionalInfo: formData.additionalInfo || undefined,
        },
      };

      const result = await apiClient.submitProjectListing(submitData);

      if (!result.success) {
        throw new Error(result.error || 'Submission failed');
      }

      setSubmitStatus('success');
    } catch (error: any) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    'DeFi', 'Gaming', 'NFT/Metaverse', 'Social', 
    'Tools', 'Education', 'Entertainment', 'Productivity', 'Other'
  ];

  const launchStatuses = [
    'In Development', 'Beta Testing', 'Launched', 'Planning'
  ];

  const teamSizes = [
    '1-3', '4-10', '11-25', '26-50', '50+'
  ];

  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-4">
                  Application Submitted Successfully!
                </h1>
                <p className="text-green-700 dark:text-green-400 mb-6">
                  Thank you for submitting your project! Our team will review your application and get back to you within 3-5 business days.
                </p>
                <Button asChild>
                                      <Link href="/">Return to Home</Link>
                </Button>
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
            <Rocket className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Get Listed</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Join the Pi Network ecosystem! Submit your project to be featured on our ecosystem and connect with the growing Pi community.
          </p>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="h-5 w-5 mr-2" />
                Project Submission Form
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Project Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="projectName">Project Name *</Label>
                      <Input
                        id="projectName"
                        value={formData.projectName}
                        onChange={(e) => handleInputChange('projectName', e.target.value)}
                        placeholder="Enter your project name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                        required
                      >
                        <option value="">Select category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="tagline">Project Tagline *</Label>
                    <Input
                      id="tagline"
                      value={formData.tagline}
                      onChange={(e) => handleInputChange('tagline', e.target.value)}
                      placeholder="A brief, compelling description of your project (max 200 characters)"
                      maxLength={200}
                      required
                    />
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="description">Project Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Provide a detailed description of your project, its purpose, and value proposition"
                      rows={4}
                      required
                    />
                  </div>
                </div>

                {/* Links & Social */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Links & Social Media</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="website">Website URL</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://yourproject.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="twitter">Twitter/X Handle</Label>
                      <Input
                        id="twitter"
                        value={formData.twitter}
                        onChange={(e) => handleInputChange('twitter', e.target.value)}
                        placeholder="@yourproject"
                      />
                    </div>
                    <div>
                      <Label htmlFor="github">GitHub Repository</Label>
                      <Input
                        id="github"
                        type="url"
                        value={formData.github}
                        onChange={(e) => handleInputChange('github', e.target.value)}
                        placeholder="https://github.com/yourproject"
                      />
                    </div>
                    <div>
                      <Label htmlFor="discord">Discord Server</Label>
                      <Input
                        id="discord"
                        value={formData.discord}
                        onChange={(e) => handleInputChange('discord', e.target.value)}
                        placeholder="https://discord.gg/yourserver"
                      />
                    </div>
                    <div>
                      <Label htmlFor="telegram">Telegram</Label>
                      <Input
                        id="telegram"
                        value={formData.telegram}
                        onChange={(e) => handleInputChange('telegram', e.target.value)}
                        placeholder="https://t.me/yourchannel"
                      />
                    </div>
                    <div>
                      <Label htmlFor="documentation">Documentation</Label>
                      <Input
                        id="documentation"
                        type="url"
                        value={formData.documentation}
                        onChange={(e) => handleInputChange('documentation', e.target.value)}
                        placeholder="https://docs.yourproject.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Pi Integration */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Pi Network Integration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="walletAddress">Pi Wallet Address *</Label>
                      <Input
                        id="walletAddress"
                        value={formData.walletAddress}
                        onChange={(e) => handleInputChange('walletAddress', e.target.value)}
                        placeholder="Your Pi wallet address"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="piIntegration">Pi Integration Type *</Label>
                      <select
                        id="piIntegration"
                        value={formData.piIntegration}
                        onChange={(e) => handleInputChange('piIntegration', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                        required
                      >
                        <option value="">Select integration type</option>
                        <option value="payments">Payments</option>
                        <option value="rewards">Rewards</option>
                        <option value="governance">Governance</option>
                        <option value="staking">Staking</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Project Status */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Project Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="launchStatus">Launch Status *</Label>
                      <select
                        id="launchStatus"
                        value={formData.launchStatus}
                        onChange={(e) => handleInputChange('launchStatus', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                        required
                      >
                        <option value="">Select status</option>
                        {launchStatuses.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="teamSize">Team Size</Label>
                      <select
                        id="teamSize"
                        value={formData.teamSize}
                        onChange={(e) => handleInputChange('teamSize', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      >
                        <option value="">Select team size</option>
                        {teamSizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="contactName">Contact Name *</Label>
                      <Input
                        id="contactName"
                        value={formData.contactName}
                        onChange={(e) => handleInputChange('contactName', e.target.value)}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactEmail">Contact Email *</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactRole">Your Role *</Label>
                      <Input
                        id="contactRole"
                        value={formData.contactRole}
                        onChange={(e) => handleInputChange('contactRole', e.target.value)}
                        placeholder="e.g., Founder, CEO, Developer"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="additionalInfo">Additional Information</Label>
                    <Textarea
                      id="additionalInfo"
                      value={formData.additionalInfo}
                      onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                      placeholder="Any additional information you'd like to share"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      Review typically takes 3-5 business days
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="px-8"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Application'}
                      <Send className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>Need help? Contact us at <a href="mailto:zyrachains@gmail.com" className="text-primary hover:underline">zyrachains@gmail.com</a></p>
        </div>
      </div>
    </div>
  );
};

export default GetListedPage; 