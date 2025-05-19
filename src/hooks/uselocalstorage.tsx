"use client";

import { useState, useCallback } from 'react';

/**
 * A custom hook for persisting and retrieving values from localStorage
 * 
 * @param key - The localStorage key to use for storing the value
 * @param initialValue - The default value to use if no value exists in localStorage
 * @returns [storedValue, setValue] - The current value and a function to update it
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
    // Helper function to get the initial value from localStorage or use the provided default
    const getInitialValue = (): T => {
        // Check if we're in the browser environment
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = localStorage.getItem(key);

            // Return parsed stored json or if null return initialValue
            return item ? JSON.parse(item) as T : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    };

    // State to store our value
    const [storedValue, setStoredValue] = useState<T>(getInitialValue);

    // Return a wrapped version of useState's setter function that persists the new value to localStorage
    const setValue = useCallback((value: T) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;

            // Save state
            setStoredValue(valueToStore);

            // Save to localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    // Note: We're not using an effect to listen for storage events
    // Values will only change when the user explicitly calls setValue

    return [storedValue, setValue];
}