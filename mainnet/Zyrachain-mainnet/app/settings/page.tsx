"use client";
import React from 'react';
import { useLanguage, languageNames } from '@/context/languagecontext';
import { useTheme } from '@/components/theme-provider';

const SettingsPage: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background p-4 pb-20 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Settings</h1>

      {/* Language Selection */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2 text-foreground">Language</h2>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(languageNames).map(([code, name]) => (
            <button
              key={code}
              className={`px-4 py-2 rounded-lg border font-medium transition-colors ${language === code ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-foreground border-border hover:bg-muted/70'}`}
              onClick={() => setLanguage(code as any)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Theme Selection */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2 text-foreground">Theme</h2>
        <div className="flex gap-3">
          <button
            className={`px-4 py-2 rounded-lg border font-medium transition-colors ${theme === 'light' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-foreground border-border hover:bg-muted/70'}`}
            onClick={() => setTheme('light')}
          >
            Light
          </button>
          <button
            className={`px-4 py-2 rounded-lg border font-medium transition-colors ${theme === 'dark' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-foreground border-border hover:bg-muted/70'}`}
            onClick={() => setTheme('dark')}
          >
            Dark
          </button>
          <button
            className={`px-4 py-2 rounded-lg border font-medium transition-colors ${theme === 'system' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-foreground border-border hover:bg-muted/70'}`}
            onClick={() => setTheme('system')}
          >
            System
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 