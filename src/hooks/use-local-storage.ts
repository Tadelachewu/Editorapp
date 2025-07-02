"use client";
    
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Step 1: Initialize state with the default value.
  // This ensures the server render and the initial client render are identical,
  // which is crucial for preventing hydration errors.
  const [value, setValue] = useState<T>(defaultValue);
  
  // A flag to ensure we don't try to save to localStorage on the server or
  // before we have loaded the initial value.
  const [hasMounted, setHasMounted] = useState(false);

  // Step 2: On mount, read the persisted value from localStorage.
  useEffect(() => {
    setHasMounted(true);
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading from localStorage for key "${key}":`, error);
    }
  }, [key]);

  // Step 3: When the value changes, save it to localStorage, but only after mounting.
  useEffect(() => {
    if (hasMounted) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Error writing to localStorage for key "${key}":`, error);
      }
    }
  }, [key, value, hasMounted]);

  return [value, setValue];
}
