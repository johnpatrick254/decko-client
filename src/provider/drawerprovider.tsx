"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type DrawerContextType = {
    isOpen: boolean;
    openDrawer: () => void;
    closeDrawer: () => void;
    toggleDrawer: () => void;
};

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

interface DrawerProviderProps {
    children: ReactNode;
}

export function DrawerProvider({ children }: DrawerProviderProps) {
    const [isOpen, setIsOpen] = useState(false);

    const openDrawer = () => setIsOpen(true);
    const closeDrawer = () => setIsOpen(false);
    const toggleDrawer = () => setIsOpen(prev => !prev);

    const value = {
        isOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer
    };

    return (
        <DrawerContext.Provider value={value}>
            {children}
        </DrawerContext.Provider>
    );
}

export function useDrawer() {
    const context = useContext(DrawerContext);

    if (context === undefined) {
        throw new Error('useDrawer must be used within a DrawerProvider');
    }

    return context;
}