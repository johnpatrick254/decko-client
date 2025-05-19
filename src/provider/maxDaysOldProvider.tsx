"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Define the context type
type MaxDaysOldContextType = {
  maxDaysOld: number;
  setMaxDaysOld: (days: number) => void;
};

// Create the context with default values
const MaxDaysOldContext = createContext<MaxDaysOldContextType>({
  maxDaysOld: 7, // Default to 7 days
  setMaxDaysOld: () => {},
});

// Storage key for localStorage
const MAX_DAYS_OLD_STORAGE_KEY = "max-days-old";

// Provider component
export const MaxDaysOldProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage or default to 7 days
  const [maxDaysOld, setMaxDaysOldState] = useState<number>(7);

  // Load the saved value from localStorage on initial render
  useEffect(() => {
    const savedValue = localStorage.getItem(MAX_DAYS_OLD_STORAGE_KEY);
    if (savedValue) {
      const parsedValue = parseInt(savedValue, 10);
      if (!isNaN(parsedValue)) {
        setMaxDaysOldState(parsedValue);
      }
    }
  }, []);

  // Update function that also saves to localStorage
  const setMaxDaysOld = (days: number) => {
    setMaxDaysOldState(days);
    localStorage.setItem(MAX_DAYS_OLD_STORAGE_KEY, days.toString());
  };

  return (
    <MaxDaysOldContext.Provider value={{ maxDaysOld, setMaxDaysOld }}>
      {children}
    </MaxDaysOldContext.Provider>
  );
};

// Custom hook for using the context
export const useMaxDaysOld = () => useContext(MaxDaysOldContext);
