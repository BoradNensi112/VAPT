import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const AVAILABLE_THEMES = [
  { id: 'dark', name: 'Dark Mode', icon: '🌙', label: 'Dark' },
  { id: 'light', name: 'Light Mode', icon: '☀️', label: 'Light' }
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('vapt_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vapt_theme', theme);
  }, [theme]);

  const toggleTheme = (event) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    // View Transition ripple if supported
    if (!document.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    const x = event?.clientX ?? window.innerWidth - 100;
    const y = event?.clientY ?? 40;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      setTheme(nextTheme);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`
      ];

      document.documentElement.animate(
        {
          clipPath: clipPath
        },
        {
          duration: 480,
          easing: 'cubic-bezier(0.2, 0, 0, 1)',
          pseudoElement: '::view-transition-new(root)'
        }
      );
    });
  };

  const changeTheme = (targetTheme, event) => {
    if (targetTheme !== 'dark' && targetTheme !== 'light') return;
    if (targetTheme === theme) return;
    toggleTheme(event);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        changeTheme,
        isDark: theme === 'dark',
        isLight: theme === 'light',
        availableThemes: AVAILABLE_THEMES
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
