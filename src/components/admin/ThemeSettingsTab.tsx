'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, CheckCircle, Palette } from 'lucide-react';
import { useTheme, themes as availableThemesFromContext, type Theme as ThemeType } from '@/context/ThemeContext';
import { getDefaultSiteTheme, updateDefaultSiteTheme } from '@/services/siteSettingsService';
import { cn } from '@/lib/utils';

export default function ThemeSettingsTab() {
  const { toast } = useToast();
  const { theme: currentAppliedTheme, setTheme: applyThemeForPreview } = useTheme(); // For live preview

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentDefaultTheme, setCurrentDefaultTheme] = useState<ThemeType | null>(null);
  const [selectedThemeForDefault, setSelectedThemeForDefault] = useState<ThemeType | null>(null);

  useEffect(() => {
    const fetchDefaultTheme = async () => {
      setIsLoading(true);
      try {
        const defaultTheme = await getDefaultSiteTheme();
        setCurrentDefaultTheme(defaultTheme);
        setSelectedThemeForDefault(defaultTheme || availableThemesFromContext[0].value); // Initialize selection
      } catch (error) {
        console.error('Failed to fetch default theme:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load current default theme.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchDefaultTheme();
  }, [toast]);

  const handleSelectTheme = (themeValue: ThemeType) => {
    setSelectedThemeForDefault(themeValue);
    // Optionally, apply theme for preview immediately, though user's local setting will override
    // applyThemeForPreview(themeValue); 
  };

  const handleSaveChanges = async () => {
    if (!selectedThemeForDefault) {
      toast({ variant: 'destructive', title: 'No Theme Selected', description: 'Please select a theme to set as default.' });
      return;
    }
    setIsSaving(true);
    try {
      await updateDefaultSiteTheme(selectedThemeForDefault);
      setCurrentDefaultTheme(selectedThemeForDefault); // Update current default locally
      toast({ title: 'Default Theme Updated', description: `"${availableThemesFromContext.find(t => t.value === selectedThemeForDefault)?.label}" is now the site default.` });
    } catch (error) {
      console.error('Failed to save default theme:', error);
      toast({ variant: 'destructive', title: 'Save Error', description: 'Could not update the default theme.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-xl border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-primary flex items-center"><Palette className="w-6 h-6 mr-2" /> Theme Settings</CardTitle>
          <CardDescription>Manage the default appearance of the website for new visitors.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-primary flex items-center"><Palette className="w-6 h-6 mr-2" /> Site Theme Settings</CardTitle>
        <CardDescription>
          Choose the default theme for all users. Individual users can still override this with their own preference via the theme switcher in the footer.
          The currently set default is: <span className="font-semibold text-foreground">{currentDefaultTheme ? availableThemesFromContext.find(t => t.value === currentDefaultTheme)?.label : "System Default (Premium Anime Dark)"}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Select new default theme:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableThemesFromContext.map((themeOption) => (
              <button
                key={themeOption.value}
                onClick={() => handleSelectTheme(themeOption.value)}
                className={cn(
                  "relative p-4 rounded-lg border-2 transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  selectedThemeForDefault === themeOption.value ? 'border-primary shadow-lg scale-105' : 'border-border/50 hover:border-primary/70 bg-card/50 hover:bg-card/80'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground">{themeOption.label}</span>
                  {selectedThemeForDefault === themeOption.value && (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex space-x-2">
                  <div className="w-1/2 h-10 rounded" style={{ backgroundColor: themeOption.colors.primary }}></div>
                  <div className="w-1/2 h-10 rounded" style={{ backgroundColor: themeOption.colors.background }}></div>
                </div>
                 {currentDefaultTheme === themeOption.value && (
                    <div className="absolute top-1.5 right-1.5 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                        Current Default
                    </div>
                 )}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={handleSaveChanges} disabled={isSaving || selectedThemeForDefault === currentDefaultTheme} className="w-full sm:w-auto mt-8 btn-primary-gradient">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Default Theme
        </Button>
      </CardContent>
    </Card>
  );
}