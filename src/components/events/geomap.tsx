"use client";

import { useEffect, useRef, useState } from "react";
import { MapPinIcon } from "lucide-react";
import { useGoogleMaps } from "@/hooks/usegooglemaps";

interface GoogleMapProps {
    coordinates: [number, number] | null; // [longitude, latitude]
    title?: string;
    venue?: string;
    address?: string;
    zoom?: number;
    height?: string;
    className?: string;
}

export default function GoogleMap({
    coordinates,
    title = "Event Location",
    venue,
    address,
    zoom = 16,
    height = "256px",
    className = ""
}: GoogleMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const { isGoogleMapsLoaded, error: loadError } = useGoogleMaps();
    const [mapError, setMapError] = useState<string | null>(null);

    // Initialize map when Google Maps is loaded and coordinates are available
    useEffect(() => {
        if (!isGoogleMapsLoaded || !coordinates || !mapRef.current || loadError) return;

        try {
            const [longitude, latitude] = coordinates;

            // Validate coordinates
            if (isNaN(latitude) || isNaN(longitude)) {
                throw new Error('Invalid coordinates');
            }

            // Create map with better visibility
            const mapInstance = new google.maps.Map(mapRef.current, {
                center: { lat: latitude, lng: longitude },
                zoom: zoom,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                disableDefaultUI: false,
                zoomControl: true,
                streetViewControl: true,
                fullscreenControl: true,
                styles: [
                    {
                        featureType: "poi.business",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }]
                    }
                ]
            });

            // Add prominent marker
            const marker = new google.maps.Marker({
                position: { lat: latitude, lng: longitude },
                map: mapInstance,
                title: title,
                animation: google.maps.Animation.DROP
            });

            // Create info window content
            const infoContent = `
                <div style="padding: 8px; max-width: 250px;">
                    <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">
                        ${title}
                    </h3>
                    ${venue ? `
                        <p style="margin: 0 0 4px 0; color: #6b7280;">
                            📍 ${venue}
                        </p>
                    ` : ''}
                    ${address ? `
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">
                            ${address}
                        </p>
                    ` : ''}
                </div>
            `;

            // Add info window
            const infoWindow = new google.maps.InfoWindow({
                content: infoContent
            });

            // Show info window on marker click
            marker.addListener('click', () => {
                infoWindow.open(mapInstance, marker);
            });

            // Auto-open info window if we have additional info
            if (venue || address) {
                infoWindow.open(mapInstance, marker);
            }

            setMap(mapInstance);
            setMapError(null); // Clear any previous errors
        } catch (error) {
            console.error('Error initializing map:', error);
            setMapError('Failed to initialize map');
        }
    }, [isGoogleMapsLoaded, coordinates, title, venue, address, zoom, loadError]);

    // Handle loading state
    if (!isGoogleMapsLoaded && !loadError && !mapError) {
        return (
            <div
                className={`relative bg-gray-100 dark:bg-gray-800 ${className}`}
                style={{ height }}
            >
                {/* Map skeleton */}
                <div className="absolute inset-0 animate-pulse">
                    {/* Simulated map background */}
                    <div className="h-full w-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />

                    {/* Simulated roads/streets */}
                    <div className="absolute inset-0">
                        <div className="absolute top-1/4 left-0 right-0 h-1 bg-gray-300 dark:bg-gray-600 opacity-60" />
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300 dark:bg-gray-600 opacity-40" />
                        <div className="absolute top-3/4 left-0 right-0 h-1 bg-gray-300 dark:bg-gray-600 opacity-60" />
                        <div className="absolute top-0 bottom-0 left-1/4 w-0.5 bg-gray-300 dark:bg-gray-600 opacity-40" />
                        <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-gray-300 dark:bg-gray-600 opacity-60" />
                        <div className="absolute top-0 bottom-0 left-3/4 w-0.5 bg-gray-300 dark:bg-gray-600 opacity-40" />
                    </div>

                    {/* Simulated marker */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-6 h-6 bg-red-400 dark:bg-red-500 rounded-full opacity-80" />
                        <div className="w-3 h-3 bg-red-500 dark:bg-red-600 rounded-full absolute top-1.5 left-1.5" />
                    </div>

                    {/* Simulated zoom controls */}
                    <div className="absolute bottom-4 right-4 space-y-1">
                        <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded shadow-sm opacity-60" />
                        <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded shadow-sm opacity-60" />
                    </div>

                    {/* Simulated street view control */}
                    <div className="absolute bottom-4 right-16">
                        <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded shadow-sm opacity-60" />
                    </div>

                    {/* Loading indicator overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center">
                        <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-lg">
                            <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                <span className="text-sm text-gray-600 dark:text-gray-300">Loading map...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Handle error state
    if (loadError || mapError || !coordinates) {
        return (
            <div
                className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className}`}
                style={{ height }}
            >
                <div className="text-center">
                    <MapPinIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">
                        {loadError || mapError || 'Location not available'}
                    </p>
                    {!coordinates && (
                        <p className="text-xs text-gray-400 mt-1">No coordinates provided</p>
                    )}
                </div>
            </div>
        );
    }

    // Render map container
    return (
        <div
            ref={mapRef}
            className={`w-full ${className}`}
            style={{
                height,
                background: '#f3f4f6' // Fallback background
            }}
        />
    );
}