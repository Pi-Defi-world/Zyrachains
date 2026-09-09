"use client";

import React, { useEffect } from "react";
import { usePageMetadata } from "@/context/pagemetadataContext";
import { useLanguage } from "@/context/languagecontext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Calendar, Eye, Lock, CheckCircle } from "lucide-react";

export default function PrivacyPolicy() {
  const { t } = useLanguage();
  const { setHeading, setTitle, setDescription } = usePageMetadata();

  useEffect(() => {
    setHeading(String(t('privacy.heading')));
    setTitle(String(t('privacy.title')));
    setDescription(t('privacy.description') as string);
  }, [setTitle, setDescription, setHeading, t]);

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-foreground">{t('privacy.heading')}</h1>
          </div>
          <p className="text-lg text-muted-foreground mb-4">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <Shield className="h-3 w-3 mr-1" />
              Privacy Protection
            </Badge>
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
              <Calendar className="h-3 w-3 mr-1" />
              GDPR Compliant
            </Badge>
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
              <Lock className="h-3 w-3 mr-1" />
              Data Secure
            </Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Privacy Policy</CardTitle>
            <p className="text-muted-foreground">
              We are committed to protecting your privacy and ensuring transparency in how we handle your data.
            </p>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            {/* Important Notice */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-lg mb-6 flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Your Privacy Matters</p>
                <p className="text-sm mt-1">
                  We are committed to protecting your personal information and being transparent about our data practices. 
                  This policy explains how we collect, use, and protect your data.
                </p>
              </div>
            </div>

            {/* Privacy Sections */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="bg-emerald-500/10 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                {t('privacy.section1.title')}
              </h2>
              <p className="mb-4 leading-relaxed">{t('privacy.section1.content')}</p>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-4">
                <h4 className="font-semibold mb-2">Information we collect:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Account information (name, email, wallet addresses)</li>
                  <li>Usage data (pages visited, features used)</li>
                  <li>Technical data (IP address, browser type, device information)</li>
                  <li>Communication data (support requests, feedback)</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="bg-emerald-500/10 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                {t('privacy.section2.title')}
              </h2>
              <p className="mb-4 leading-relaxed">{t('privacy.section2.content')}</p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-1">Service Provision</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">To provide and maintain our blockchain explorer and ecosystem services</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
                  <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-1">Communication</h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">To respond to your inquiries and provide customer support</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-1">Improvement</h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300">To improve our services and develop new features</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Security</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">To protect against fraud and ensure platform security</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="bg-emerald-500/10 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                {t('privacy.section3.title')}
              </h2>
              <p className="mb-4 leading-relaxed">{t('privacy.section3.content')}</p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg mt-4">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">We do not sell your data</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  We do not sell, trade, or rent your personal information to third parties. 
                  We only share data when necessary for service provision or when required by law.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="bg-emerald-500/10 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
                {t('privacy.section4.title')}
              </h2>
              <p className="mb-4 leading-relaxed">{t('privacy.section4.content')}</p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    Encryption
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    All data is encrypted in transit and at rest using industry-standard protocols.
                  </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Access Control
                  </h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    Strict access controls and authentication mechanisms protect your data.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="bg-emerald-500/10 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">5</span>
                {t('privacy.section5.title')}
              </h2>
              <p className="mb-4 leading-relaxed">{t('privacy.section5.content')}</p>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-4">
                <h4 className="font-semibold mb-2">Cookie Types We Use:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Essential cookies:</strong> Required for basic site functionality</li>
                  <li><strong>Analytics cookies:</strong> Help us understand how visitors use our site</li>
                  <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
                </ul>
              </div>
            </section>

            {/* <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="bg-emerald-500/10 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">6</span>
                {t('privacy.section6.title')}
              </h2>
              <p className="mb-4 leading-relaxed">{t('privacy.section6.content')}</p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-1">Access</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">Request a copy of your personal data</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
                  <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-1">Correction</h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">Update or correct inaccurate information</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-1">Deletion</h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Request deletion of your personal data</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Opt-out</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Unsubscribe from communications</p>
                </div>
              </div>
            </section> */}

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="bg-emerald-500/10 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">7</span>
                {t('privacy.section7.title')}
              </h2>
              <p className="mb-4 leading-relaxed">{t('privacy.section7.content')}</p>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg mt-4">
                <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2">Notification Process</h4>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  When we make significant changes to this policy, we will notify you through:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                  <li>Email notification to registered users</li>
                  <li>Prominent notice on our website</li>
                  <li>Updated "Last updated" date at the top of this policy</li>
                </ul>
              </div>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="bg-emerald-500/10 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">8</span>
                {t('privacy.contact.title')}
              </h2>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="mb-2">{t('privacy.contact.content')}</p>
                <a 
                  href={`mailto:${t('contact.email')}`} 
                  className="text-primary hover:text-primary/90 underline font-medium"
                >
                  {t('contact.email')}
                </a>
              </div>
            </section>

            {/* Additional Privacy Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Additional Privacy Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-green-800 dark:text-green-200 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    GDPR Compliance
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    We comply with the General Data Protection Regulation (GDPR) and other applicable privacy laws.
                  </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-emerald-800 dark:text-emerald-200 flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    Transparency
                  </h3>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    We believe in transparency and will always be clear about how we handle your data.
                  </p>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-muted-foreground text-center">
                This privacy policy is effective as of the date listed above. We encourage you to review this policy regularly.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
