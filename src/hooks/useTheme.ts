import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';
type ColorTheme = 'deep-teal' | 'lemon-yellow' | 'burnt-copper' | 'seamist';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'system';
    }
    return 'system';
  });

  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('colorTheme') as ColorTheme) || 'deep-teal';
    }
    return 'deep-teal';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-color-theme', colorTheme);
  }, [colorTheme]);

  const setThemeValue = (newTheme: Theme) => {
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  };

  const setColorThemeValue = (newColorTheme: ColorTheme) => {
    localStorage.setItem('colorTheme', newColorTheme);
    setColorTheme(newColorTheme);
  };

  return {
    theme,
    setTheme: setThemeValue,
    colorTheme,
    setColorTheme: setColorThemeValue,
  };
};