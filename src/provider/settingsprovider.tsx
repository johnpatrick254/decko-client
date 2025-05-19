"use client";
import { useLocalStorage } from '@/hooks/uselocalstorage';
import React, { createContext, useContext, ReactNode } from 'react';
import { SEARCH_LOCATIONS, DEFAULT_LOCATIONS, LocationData } from '@/store/services/events.api';

type LocationMethod = 'geolocation' | 'manual';

type SettingContextType = {
    showSwipeIcons: boolean;
    setShowSwipeIcons: (value: boolean) => void;
    textSize: 'sm' | 'md' | 'lg';
    setTextSize: (value: 'sm' | 'md' | 'lg') => void;
    locationMethod: LocationMethod;
    setLocationMethod: (value: LocationMethod) => void;
    manualLocation: SEARCH_LOCATIONS;
    setManualLocation: (value: SEARCH_LOCATIONS) => void;
};

const SettingContext = createContext<SettingContextType | undefined>(undefined);

interface SettingsProviderProps {
    children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
    const [textSize, setTextSize] = useLocalStorage<'sm' | 'md' | 'lg'>('text_size', 'sm');
    const [showSwipeIcons, setShowSwipeIcons] = useLocalStorage<boolean>('show_swipe_icons', true);
    const [locationMethod, setLocationMethod] = useLocalStorage<LocationMethod>('location_method', 'manual');
    const [manualLocation, setManualLocation] = useLocalStorage<SEARCH_LOCATIONS>('manual_location', DEFAULT_LOCATIONS.FORT_LAUDERDALE);

    const value: SettingContextType = {
        textSize,
        setTextSize,
        showSwipeIcons,
        setShowSwipeIcons,
        locationMethod,
        setLocationMethod,
        manualLocation,
        setManualLocation
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
    }

    return context;
}