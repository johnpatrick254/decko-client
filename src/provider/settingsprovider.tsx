"use client";
import { useLocalStorage } from '@/hooks/uselocalstorage';
import React, { createContext, useContext, ReactNode } from 'react';

export type Location = 'Nairobi' | 'San Francisco' | 'Fort Lauderdale';

type SettingContextType = {
    showSwipeIcons: boolean;
    setShowSwipeIcons: (value: boolean) => void;
    textSize: 'sm' | 'md' | 'lg';
    setTextSize: (value: 'sm' | 'md' | 'lg') => void;
    location: Location;
    setLocation: (value: Location) => void;
};

const SettingContext = createContext<SettingContextType | undefined>(undefined);

interface SettingsProviderProps {
    children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
    const [textSize, setTextSize] = useLocalStorage<'sm' | 'md' | 'lg'>('text_size', 'sm');
    const [showSwipeIcons, setShowSwipeIcons] = useLocalStorage<boolean>('show_swipe_icons', true);
    const [location, setLocation] = useLocalStorage<Location>('location', 'Fort Lauderdale');

    const value: SettingContextType = {
        textSize,
        setTextSize,
        showSwipeIcons,
        setShowSwipeIcons,
        location,
        setLocation,
    };
    return (
        <SettingContext.Provider value={value}>
            {children}
        </SettingContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    };

    return context;
}