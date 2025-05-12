
'use client';

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getDefaultSiteTheme } from '@/services/siteSettingsService'; 

export type Theme = 'dark-purple-premium' | 'light-pale-purple' | 'kawaii-pink-vibe' | 'futuristic-cyberpunk';

export interface ThemeOption {
  value: Theme;
  label: string;
  colors: {
    primary: string;
    background: string;
    secondary?: string; // Optional, for themes that define it explicitly for gradients etc.
    highlight?: string; // Optional
  };
}

export const themes: ThemeOption[] = [
  { 
    value: 'dark-purple-premium', 
    label: 'Premium Anime Dark', // Label can be updated if desired
    colors: { 
      primary: '#A064FF', // New Primary
      background: '#0E0E10', // New Background
      secondary: '#8B5CF6', // New Secondary (old primary)
      highlight: '#4F46E5' // New Highlight
    }
  },
  { 
    value: 'light-pale-purple', 
    label: 'Elegant Light', 
    colors: { 
      primary: '#6366F1', 
      background: '#F9FAFB',
      secondary: '#14B8A6', // Teal for button gradient
      highlight: '#A78BFA'
    }
  },
  {
    value: 'kawaii-pink-vibe',
    label: 'Kawaii Pink Vibe',
    colors: { 
      primary: '#EC4899', 
      background: '#1A0A1E',
      secondary: '#FB7185', // Secondary used in gradient or as fallback
      highlight: '#E879F9'  // Highlight for gradient
    }
  },
  { 
    value: 'futuristic-cyberpunk', 
    label: 'Futuristic Cyberpunk',
    colors: { 
      primary: '#00FFFF', 
      background: '#0F0F1A',
      secondary: '#FF00FF', // Used in gradient
      highlight: '#7C3AED' 
    }
  },
];

const FALLBACK_DEFAULT_THEME: Theme = 'dark-purple-premium'; 

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  availableThemes: ThemeOption[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(FALLBACK_DEFAULT_THEME);
  const [isInitialThemeLoaded, setIsInitialThemeLoaded] = useState(false);

  useEffect(() => {
    const determineInitialTheme = async () => {
      let initialTheme = FALLBACK_DEFAULT_THEME;
      if (typeof window !== 'undefined') {
        const storedUserTheme = localStorage.getItem('qentai-theme') as Theme | null;
        
        if (storedUserTheme && themes.some(t => t.value === storedUserTheme)) {
          initialTheme = storedUserTheme;
        } else {
          try {
            const siteDefaultTheme = await getDefaultSiteTheme();
            if (siteDefaultTheme && themes.some(t => t.value === siteDefaultTheme)) {
              initialTheme = siteDefaultTheme;
            }
          } catch (error) {
            console.error("Failed to fetch site default theme, using fallback:", error);
          }
        }
      }
      setThemeState(initialTheme);
      setIsInitialThemeLoaded(true);
    };

    determineInitialTheme();
  }, []);


  useEffect(() => {
    if (!isInitialThemeLoaded) return; 

    const root = window.document.documentElement;
    root.setAttribute('data-theme', theme);
    
    const storedUserTheme = localStorage.getItem('qentai-theme') as Theme | null;
    if (storedUserTheme !== theme) {
      localStorage.setItem('qentai-theme', theme);
    }

    const currentThemeDetails = themes.find(t => t.value === theme);
    if (currentThemeDetails) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.setAttribute('name', 'theme-color');
            document.getElementsByTagName('head')[0].appendChild(metaThemeColor);
        }
        metaThemeColor.setAttribute('content', currentThemeDetails.colors.background);
    }

  }, [theme, isInitialThemeLoaded]);

  const setTheme = useCallback((newTheme: Theme) => {
    if (themes.some(t => t.value === newTheme)) {
      setThemeState(newTheme);
      if (typeof window !== 'undefined') {
        localStorage.setItem('qentai-theme', newTheme);
      }
    } else {
      console.warn(`Attempted to set invalid theme: ${newTheme}`);
    }
  }, []);

  if (!isInitialThemeLoaded) {
    return null; 
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes: themes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
