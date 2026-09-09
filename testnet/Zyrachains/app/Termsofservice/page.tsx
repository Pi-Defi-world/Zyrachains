"use client";

import React, { useEffect } from "react";
import { usePageMetadata } from "@/context/pagemetadataContext";
import { useLanguage } from "@/context/languagecontext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Shield, AlertTriangle } from "lucide-react";

export default function TermsOfService() {
  const { t } = useLanguage();
  const { setHeading, setTitle, setDescription } = usePageMetadata();

  useEffect(() => {
    setHeading(String(t('terms.heading')));
    setTitle(String(t('terms.title')));
    setDescription(t('terms.description') as string);
  }, [setHeading, setTitle, t, setDescription]);

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-foreground">{t('terms.heading')}</h1>
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
              Legal Document
            </Badge>
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
              <Calendar className="h-3 w-3 mr-1" />
              Updated Regularly
            </Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Terms of Service</CardTitle>
            <p className="text-muted-foreground">
              Please read these terms carefully before using our services.
            </p>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            {/* Important Notice */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg mb-6 flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Important Notice</p>
                <p className="text-sm mt-1">
                  By accessing and using Zyrachain, you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use our services.
                </p>
              </div>
            </div>

            {/* Terms Sections */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="bg-emerald-500/10 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                {t('terms.section1.title')}
              </h2>
              <p className="mb-4 leading-relaxed">{t('terms.section1.content')}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="bg-emerald-500/10 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                {t('terms.section2.title')}
              </h2>
              <p className="mb-4 leading-relaxed">{t('terms.section2.content')}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="bg-emerald-500/10 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                {t('terms.section3.title')}
              </h2>
              <p className="mb-4 leading-relaxed">{t('terms.section3.content')}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="bg-emerald-500/10 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
                {t('terms.section4.title')}
              </h2>
              <p className="mb-4 leading-relaxed">{t('terms.section4.content')}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="bg-emerald-500/10 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">5</span>
                {t('terms.section5.title')}
              </h2>
              <p className="mb-4 leading-relaxed">{t('terms.section5.content')}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="bg-emerald-500/10 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">6</span>
                {t('terms.section6.title')}
              </h2>
              <p className="mb-4 leading-relaxed">{t('terms.section6.content')}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="bg-emerald-500/10 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">7</span>
                {t('terms.section7.title')}
              </h2>
              <p className="mb-4 leading-relaxed">{t('terms.section7.content')}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="bg-emerald-500/10 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">8</span>
                {t('terms.section8.title')}
              </h2>
              <p className="mb-4 leading-relaxed">{t('terms.section8.content')}</p>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="bg-emerald-500/10 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">9</span>
                {t('terms.contact.title')}
              </h2>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="mb-2">{t('terms.contact.content')}</p>
                <a 
                  href={`mailto:${t('contact.email')}`} 
                  className="text-primary hover:text-primary/90 underline font-medium"
                >
                  {t('contact.email')}
                </a>
              </div>
            </section>

            {/* Additional Legal Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Additional Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-emerald-800 dark:text-emerald-200">Data Protection</h3>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    We are committed to protecting your privacy. Please review our Privacy Policy for details on how we collect, use, and protect your information.
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-green-800 dark:text-green-200">Security</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    We implement industry-standard security measures to protect your data and ensure the integrity of our services.
                  </p>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-muted-foreground text-center">
                These terms are effective as of the date listed above and apply to all users of Zyrachain services.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
