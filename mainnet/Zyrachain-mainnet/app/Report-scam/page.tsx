"use client";

import React, { useEffect, useState } from "react";
import { usePageMetadata } from "@/context/pagemetadataContext";
import { useLanguage } from "@/context/languagecontext";
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, CheckCircle, AlertCircle, Users, } from "lucide-react";

export default function ReportScamWallet() {
  const { t } = useLanguage();
  const { setHeading, setTitle, setDescription } = usePageMetadata();
  const [formData, setFormData] = useState({
    walletAddress: "",
    description: "",
    evidence: "",
    reporterContact: "",
    scamType: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Helper function to safely get translation string
  const getTranslation = (key: string): string => {
    const translation = t(key);
    return Array.isArray(translation) ? translation[0] : translation;
  };

  useEffect(() => {
    const heading = t('report.heading');
    const title = t('report.title');
    const description = t('report.description');
    
    setHeading(Array.isArray(heading) ? heading[0] : heading);
    setTitle(Array.isArray(title) ? title[0] : title);
    setDescription(Array.isArray(description) ? description[0] : description);
  }, [setTitle, setDescription, setHeading, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const result = await apiClient.submitScamReport(formData);

      if (result.success) {
        setSubmitted(true);
        console.log("Report Submitted Successfully:", result);
      } else {
        setSubmitError(result.error || 'Failed to submit report');
        console.error("Failed to submit the report:", result.error);
      }
    } catch (error) {
      setSubmitError('Network error. Please try again.');
      console.error("Failed to submit the report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scamTypes = [
    { value: "fake_project", label: "Fake Pi Network Project/Application" },
    { value: "phishing", label: "Phishing Attempt or Fake Website" },
    { value: "suspicious_wallet", label: "Suspicious Wallet Address" },
    { value: "fake_giveaway", label: "Fake Giveaway or Airdrop" },
    { value: "impersonation", label: "Impersonation of Official Accounts" },
    { value: "other", label: "Other Fraudulent Activity" }
  ];

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
            <h1 className="text-4xl font-bold text-foreground">{getTranslation('report.heading')}</h1>
          </div>
          <p className="text-lg text-muted-foreground mb-4 max-w-2xl mx-auto">
            {getTranslation('report.intro')}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20">
              <Shield className="h-3 w-3 mr-1" />
              Security Report
            </Badge>
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <Users className="h-3 w-3 mr-1" />
              Community Protection
            </Badge>
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Anonymous Reporting
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Information Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                  {getTranslation('report.info.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {getTranslation('report.info.description')}
                </p>
                <div className="space-y-3">
                  {(() => {
                    const items = t('report.info.items');
                    const itemsArray = Array.isArray(items) ? items : [];
                    return itemsArray.map((item: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm">{item}</p>
                      </div>
                    ));
                  })()}
                </div>
                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    {getTranslation('report.info.note')}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-500" />
                  Security Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Never share your private keys or seed phrases</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Verify official Pi Network communications</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Be cautious of unsolicited offers</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Double-check wallet addresses before sending</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center">
                  <AlertTriangle className="h-6 w-6 mr-2 text-red-500" />
                  Report Suspicious Activity
                </CardTitle>
                <p className="text-muted-foreground">
                  Help protect the Pi Network community by reporting scams and fraudulent activities.
                </p>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-6 py-4 rounded-lg mb-6">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <h3 className="text-lg font-semibold mb-2">Report Submitted Successfully!</h3>
                      <p>{getTranslation('report.success_message')}</p>
                    </div>
                    <Button 
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({
                          walletAddress: "",
                          description: "",
                          evidence: "",
                          reporterContact: "",
                          scamType: ""
                        });
                      }}
                      variant="outline"
                    >
                      Submit Another Report
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {submitError && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        {submitError}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label htmlFor="scamType" className="block text-sm font-medium text-foreground">
                        Type of Scam/Fraud *
                      </label>
                      <select
                        id="scamType"
                        name="scamType"
                        value={formData.scamType}
                        onChange={handleChange}
                        required
                        className="w-full p-3 border border-input rounded-md bg-background text-foreground"
                        disabled={isSubmitting}
                      >
                        <option value="">Select the type of scam...</option>
                        {scamTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="walletAddress" className="block text-sm font-medium text-foreground">
                        {getTranslation('report.form.wallet_address')}
                      </label>
                      <Input
                        type="text"
                        id="walletAddress"
                        name="walletAddress"
                        value={formData.walletAddress}
                        onChange={handleChange}
                        className="w-full"
                        placeholder={getTranslation('report.form.wallet_address_placeholder')}
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave blank if not applicable to your report
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="description" className="block text-sm font-medium text-foreground">
                        {getTranslation('report.form.description')} *
                      </label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        className="w-full"
                        placeholder={getTranslation('report.form.description_placeholder')}
                        rows={4}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="evidence" className="block text-sm font-medium text-foreground">
                        {getTranslation('report.form.evidence')}
                      </label>
                      <Textarea
                        id="evidence"
                        name="evidence"
                        value={formData.evidence}
                        onChange={handleChange}
                        className="w-full"
                        placeholder={getTranslation('report.form.evidence_placeholder')}
                        rows={4}
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground">
                        Include screenshots, links, or any other evidence that supports your report
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="reporterContact" className="block text-sm font-medium text-foreground">
                        {getTranslation('report.form.contact')}
                      </label>
                      <Input
                        type="email"
                        id="reporterContact"
                        name="reporterContact"
                        value={formData.reporterContact}
                        onChange={handleChange}
                        className="w-full"
                        placeholder={getTranslation('report.form.contact_placeholder')}
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground">
                        {getTranslation('report.form.email_note')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <p className="text-sm text-muted-foreground">
                        * Required fields
                      </p>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="min-w-[140px]"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            {getTranslation('report.form.submit')}
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 
