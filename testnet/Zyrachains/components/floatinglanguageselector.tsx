"use client";
import React, { useState, useRef, useEffect } from "react";
import { useLanguage, Language, languageNames, languageCodes } from "@/context/languagecontext";
import { FiGlobe, FiX, FiMoon, FiMove } from "react-icons/fi";
import { ModeToggle } from "@/components/ui/mode-toggle"

// Tab types for settings panel
type SettingsTab = 'language' | 'appearance';

interface Position {
  x: number;
  y: number;
}

const FloatingLanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('language');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [position, setPosition] = useState<Position>({ x: 20, y: 100 }); // Default to top-left area
  const menuRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLButtonElement>(null);

  // Load position from localStorage on mount
  useEffect(() => {
    const savedPosition = localStorage.getItem('floating-selector-position');
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        setPosition(parsed);
      } catch (e) {
        // Use default position if parsing fails
      }
    }
  }, []);

  // Save position to localStorage
  const savePosition = (newPosition: Position) => {
    setPosition(newPosition);
    localStorage.setItem('floating-selector-position', JSON.stringify(newPosition));
  };

  // Constrain position within viewport bounds
  const constrainPosition = (pos: Position): Position => {
    const buttonSize = window.innerWidth < 1024 ? 56 : 48; // Larger on mobile
    const margin = 10;
    
    return {
      x: Math.max(margin, Math.min(pos.x, window.innerWidth - buttonSize - margin)),
      y: Math.max(margin + (window.innerWidth < 1024 ? 48 : 0), Math.min(pos.y, window.innerHeight - buttonSize - margin)) // Account for ticker on mobile
    };
  };

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return; // Don't drag when menu is open
    
    setIsDragging(true);
    const rect = dragRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    e.preventDefault();
  };

  // Handle touch start for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isOpen) return;
    
    setIsDragging(true);
    const rect = dragRef.current?.getBoundingClientRect();
    const touch = e.touches[0];
    if (rect && touch) {
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
    }
    e.preventDefault();
  };

  // Handle drag move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newPosition = constrainPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
      
      setPosition(newPosition);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      
      const touch = e.touches[0];
      if (touch) {
        const newPosition = constrainPosition({
          x: touch.clientX - dragOffset.x,
          y: touch.clientY - dragOffset.y
        });
        
        setPosition(newPosition);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        savePosition(position);
      }
    };

    const handleTouchEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        savePosition(position);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragOffset, position]);

  const toggleMenu = () => {
    if (!isDragging) {
      setIsOpen(!isOpen);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div 
      className="fixed z-50 select-none" 
      ref={menuRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <button 
        ref={dragRef}
        className={`w-12 h-12 lg:w-12 lg:h-12 md:w-14 md:h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center relative group border-2 border-primary-foreground/20 ${
          isOpen ? 'scale-110' : 'hover:scale-105'
        } ${isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab'}`}
        onClick={toggleMenu}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        aria-label={String(t('settings.aria_label'))}
      >
        {isOpen ? <FiX size={20} /> : <FiGlobe size={20} />}
        
        {/* Drag indicator */}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-5 h-5 lg:w-4 lg:h-4 bg-muted/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <FiMove size={12} className="text-muted-foreground lg:w-3 lg:h-3" />
          </div>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-64 bg-card border border-border shadow-xl rounded-xl overflow-hidden">
          <div className="flex border-b border-border">
            <button 
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'language' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveTab('language')}
            >
              <FiGlobe size={14} />
              <span>{t('settings.language')}</span>
            </button>
            <button 
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'appearance' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveTab('appearance')}
            >
              <FiMoon size={14} />
              <span>{t('settings.appearance')}</span>
            </button>
          </div>
          
          <div className="p-4">
            {activeTab === 'language' && (
              <div className="space-y-2">
                {(Object.keys(languageNames) as Language[]).map((lang) => (
                  <button 
                    key={lang}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${language === lang ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`}
                    onClick={() => handleLanguageChange(lang)}
                  >
                    <span className="text-lg">{languageCodes[lang]}</span>
                    <span>{languageNames[lang]}</span>
                  </button>
                ))}
              </div>
            )}
            
            {activeTab === 'appearance' && (
              <div className="flex justify-center">
                <ModeToggle />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingLanguageSelector;
