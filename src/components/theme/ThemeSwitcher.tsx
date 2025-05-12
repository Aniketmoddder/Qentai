
'use client';

import { useTheme, type ThemeOption } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Check, Palette } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export default function ThemeSwitcher() {
  const { theme, setTheme, availableThemes } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="text-muted-foreground border-border/50 hover:bg-primary/10">
          <Palette size={14} className="mr-1.5" /> Theme
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-2 bg-popover border-border shadow-xl">
        <div className="grid gap-1">
          {availableThemes.map((option: ThemeOption) => (
            <Button
              key={option.value}
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start text-left h-auto py-2 px-3 text-sm",
                theme === option.value ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/50"
              )}
              onClick={() => setTheme(option.value)}
            >
              <div className="flex items-center w-full">
                <div className="flex items-center mr-2">
                  <span 
                    className="w-3 h-3 rounded-full mr-1.5 border border-border/50" 
                    style={{ backgroundColor: option.colors.primary }}
                  ></span>
                  <span 
                    className="w-3 h-3 rounded-full border border-border/50" 
                    style={{ backgroundColor: option.colors.background }}
                  ></span>
                </div>
                <span className="flex-grow">{option.label}</span>
                {theme === option.value && <Check className="h-4 w-4 text-primary" />}
              </div>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}