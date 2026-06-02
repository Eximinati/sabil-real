'use client';

import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
  useState,
  type ReactNode,
} from 'react';

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

interface ReflectionContextValue {
  text: string;
  status: SaveStatus;
  updateText: (text: string) => void;
  save: () => Promise<boolean>;
}

const ReflectionContext = createContext<ReflectionContextValue | null>(null);

const AUTOSAVE_MS = 3000;
const SAVED_FLASH_MS = 2000;

export function ReflectionProvider({
  lessonId,
  dayNumber,
  initialReflection = '',
  children,
}: {
  lessonId: string;
  dayNumber: number;
  initialReflection?: string;
  children: ReactNode;
}) {
  const [text, setText] = useState(initialReflection);
  const [status, setStatus] = useState<SaveStatus>('idle');

  const lastSavedRef = useRef(initialReflection);
  const textRef = useRef(text);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savePromiseRef = useRef<Promise<boolean> | null>(null);
  const mountedRef = useRef(true);
  const savedFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  textRef.current = text;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedFlashRef.current) clearTimeout(savedFlashRef.current);
      const currentText = textRef.current;
      if (currentText !== lastSavedRef.current) {
        try {
          const payload = JSON.stringify({
            lessonId,
            dayNumber,
            reflectionText: currentText,
          });
          navigator.sendBeacon('/api/journey/reflection', payload);
        } catch {
        }
      }
    };
  }, [lessonId, dayNumber]);

  useEffect(() => {
    if (text !== lastSavedRef.current) {
      if (status === 'idle' || status === 'saved') {
        setStatus('dirty');
      }
    }
  }, [text]);

  useEffect(() => {
    if (text === lastSavedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSave(textRef.current);
    }, AUTOSAVE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const currentText = textRef.current;
        if (currentText !== lastSavedRef.current) {
          performSave(currentText);
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  const performSave = useCallback(async (saveText: string): Promise<boolean> => {
    if (savePromiseRef.current) return savePromiseRef.current;

    if (!saveText.trim()) {
      lastSavedRef.current = saveText;
      setStatus('idle');
      return true;
    }

    const promise = (async () => {
      setStatus('saving');
      try {
        const res = await fetch('/api/journey/reflection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId, dayNumber, reflectionText: saveText }),
        });
        if (res.ok) {
          lastSavedRef.current = saveText;
          setStatus('saved');
          if (savedFlashRef.current) clearTimeout(savedFlashRef.current);
          savedFlashRef.current = setTimeout(() => {
            if (mountedRef.current) setStatus('idle');
          }, SAVED_FLASH_MS);
          return true;
        }
        setStatus('error');
        return false;
      } catch {
        setStatus('error');
        return false;
      } finally {
        savePromiseRef.current = null;
      }
    })();

    savePromiseRef.current = promise;
    return promise;
  }, [lessonId, dayNumber]);

  const save = useCallback(async (): Promise<boolean> => {
    const currentText = textRef.current;
    if (currentText === lastSavedRef.current) return true;
    if (savePromiseRef.current) return savePromiseRef.current;
    return performSave(currentText);
  }, [performSave]);

  const updateText = useCallback((newText: string) => {
    setText(newText);
    if (status === 'error') setStatus('dirty');
  }, []);

  return (
    <ReflectionContext.Provider value={{ text, status, updateText, save }}>
      {children}
    </ReflectionContext.Provider>
  );
}

export function useReflection(): ReflectionContextValue {
  const ctx = useContext(ReflectionContext);
  if (!ctx) {
    throw new Error('useReflection must be used within a ReflectionProvider');
  }
  return ctx;
}
