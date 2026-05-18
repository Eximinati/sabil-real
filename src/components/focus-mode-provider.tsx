'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FocusModeContextValue {
  isFocusMode: boolean;
  toggleFocusMode: () => void;
  setFocusMode: (value: boolean) => void;
}

const FocusModeContext = createContext<FocusModeContextValue>({
  isFocusMode: false,
  toggleFocusMode: () => {},
  setFocusMode: () => {},
});

const STORAGE_KEY = 'sabil-focus-mode';

export function FocusModeProvider({ children }: { children: ReactNode }) {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') {
      setIsFocusMode(true);
    }
  }, []);

  const toggleFocusMode = () => {
    const newValue = !isFocusMode;
    setIsFocusMode(newValue);
    try {
      localStorage.setItem(STORAGE_KEY, newValue.toString());
    } catch (e) {
      // localStorage might be unavailable
    }
  };

  const setFocusMode = (value: boolean) => {
    setIsFocusMode(value);
    try {
      localStorage.setItem(STORAGE_KEY, value.toString());
    } catch (e) {
      // localStorage might be unavailable
    }
  };

  return (
    <FocusModeContext.Provider value={{ isFocusMode, toggleFocusMode, setFocusMode }}>
      {children}
    </FocusModeContext.Provider>
  );
}

export function useFocusMode() {
  return useContext(FocusModeContext);
}