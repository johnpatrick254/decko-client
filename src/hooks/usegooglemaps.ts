// hooks/useGoogleMaps.ts
import { useEffect, useState } from 'react';

// Global state to track loading
let isLoading = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

// Extend Window interface for Google Maps
declare global {
    interface Window {
        google: typeof google;
        initGoogleMaps: () => void;
    }
}

export function useGoogleMaps() {
    const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadGoogleMaps = async () => {
            // If already loaded, update state immediately
            if (isLoaded && window.google && window.google.maps) {
                setIsGoogleMapsLoaded(true);
                return;
            }

            // If currently loading, wait for existing promise
            if (isLoading && loadPromise) {
                try {
                    await loadPromise;
                    setIsGoogleMapsLoaded(true);
                } catch (err) {
                    setError('Failed to load Google Maps');
                }
                return;
            }

            // Start new loading process
            isLoading = true;

            loadPromise = new Promise<void>((resolve, reject) => {
                // Check if API key exists
                if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
                    const errorMsg = 'Google Maps API key not found';
                    setError(errorMsg);
                    reject(new Error(errorMsg));
                    return;
                }

                // Set up callback function
                window.initGoogleMaps = () => {
                    isLoaded = true;
                    isLoading = false;
                    setIsGoogleMapsLoaded(true);
                    resolve();
                };

                // Create and append script
                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async&callback=initGoogleMaps`;
                script.async = true;
                script.defer = true;
                script.onerror = () => {
                    isLoading = false;
                    const errorMsg = 'Failed to load Google Maps';
                    setError(errorMsg);
                    reject(new Error(errorMsg));
                };

                // Check if script already exists
                const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
                if (existingScript) {
                    // Script already exists, check if Google Maps is available
                    if (window.google && window.google.maps) {
                        isLoaded = true;
                        isLoading = false;
                        setIsGoogleMapsLoaded(true);
                        resolve();
                    } else {
                        // Script exists but not loaded yet, wait for it
                        existingScript.addEventListener('load', () => {
                            isLoaded = true;
                            isLoading = false;
                            setIsGoogleMapsLoaded(true);
                            resolve();
                        });
                    }
                    return;
                }

                document.head.appendChild(script);
            });

            try {
                await loadPromise;
            } catch (err) {
                console.error('Google Maps loading error:', err);
                setError('Failed to load Google Maps');
            }
        };

        loadGoogleMaps();
    }, []);

    return { isGoogleMapsLoaded, error };
}