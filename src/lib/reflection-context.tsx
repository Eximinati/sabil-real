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
import { csrfHeader } from '@/lib/csrf-client';

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
  initialReflectionUpdatedAt,
  children,
}: {
  lessonId: string;
  dayNumber: number;
  initialReflection?: string;
  initialReflectionUpdatedAt?: string | null;
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
  const updatedAtRef = useRef<string | null>(initialReflectionUpdatedAt ?? null);

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
            lastUpdatedAt: updatedAtRef.current,
          });
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon('/api/journey/reflection', blob);
        } catch (e) {
          console.error('sendBeacon failed for reflection save:', e);
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
      performSave(textRef.current).catch((e) => {
        console.error('Autosave failed:', e);
      });
    }, AUTOSAVE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text]);

  const performSaveInternal = useCallback(async (saveText: string) => {
    setStatus('saving');
    try {
      const res = await fetch('/api/journey/reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({
          lessonId,
          dayNumber,
          reflectionText: saveText,
          lastUpdatedAt: updatedAtRef.current,
        }),
      });
      if (res.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return false;
      }
      if (res.status === 409) {
        setStatus('error');
        console.error('Conflict: reflection was modified by another session');
        return false;
      }
      if (res.ok) {
        const body = await res.json();
        lastSavedRef.current = saveText;
        if (body.updatedAt) {
          updatedAtRef.current = body.updatedAt;
        }
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
    }
  }, [lessonId, dayNumber]);

  const performSave = useCallback(async (saveText: string): Promise<boolean> => {
    if (!saveText.trim()) {
      lastSavedRef.current = saveText;
      updatedAtRef.current = null;
      setStatus('idle');
      try {
        const res = await fetch('/api/journey/reflection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...csrfHeader() },
          body: JSON.stringify({
            lessonId,
            dayNumber,
            reflectionText: saveText,
            lastUpdatedAt: updatedAtRef.current,
          }),
        });
        if (res.ok) {
          const body = await res.json();
          if (body.updatedAt) {
            updatedAtRef.current = body.updatedAt;
          }
        }
      } catch {
        setStatus('error');
        return false;
      }
      return true;
    }

    if (savePromiseRef.current) {
      await savePromiseRef.current;
      if (saveText === lastSavedRef.current) return true;
    }

    const promise = performSaveInternal(saveText).finally(() => {
      savePromiseRef.current = null;
    });
    savePromiseRef.current = promise;
    return promise;
  }, [performSaveInternal, lessonId, dayNumber]);

  const save = useCallback(async (): Promise<boolean> => {
    const currentText = textRef.current;
    if (currentText === lastSavedRef.current) return true;
    return performSave(currentText);
  }, [performSave]);

  useEffect(() => {
    const onSave = () => {
      const currentText = textRef.current;
      if (currentText !== lastSavedRef.current) {
        performSave(currentText).catch((e) => {
          console.error('Pagehide/visibility save failed:', e);
        });
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') onSave();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onSave);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onSave);
    };
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