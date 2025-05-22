"use client"

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LocationData } from "@/store/services/events.api";
import { toast } from "sonner";

interface LocationAutosuggestProps {
  onLocationSelect: (location: LocationData) => void;
  placeholder?: string;
  initialValue?: string;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export function LocationAutosuggest({
  onLocationSelect,
  placeholder = "Enter city, ZIP code...",
  initialValue = ""
}: LocationAutosuggestProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch suggestions as the user types
  useEffect(() => {
    if (inputValue.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set a new timer to fetch suggestions after 300ms of user inactivity
    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Use our proxy API route instead of calling Google directly
        const response = await fetch(
          `/api/places/autocomplete?input=${encodeURIComponent(inputValue)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();

        if (data.status === 'OK') {
          setSuggestions(data.predictions);
        } else if (data.status === 'ZERO_RESULTS') {
          setSuggestions([]);
        } else {
          // Handle specific error cases
          if (data.status === 'REQUEST_DENIED' && data.error_message?.includes('enable Billing')) {
            toast.error("API Configuration Error",{
              description: "Google Maps API billing is not enabled. Please contact support.",
            });
          } else {
            toast.error("Error", {
              description: "Failed to fetch location suggestions. Please try again.",
            });
          }
          console.error('Google Places API error:', data.status, data.error_message);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        toast("Network Error", {
          description: "Failed to connect to location service. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue, toast]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // If Enter is pressed and we have suggestions, select the first one
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        const firstSuggestion = suggestions[0];
        handleSelectLocation(firstSuggestion.place_id, firstSuggestion.description);
      } else if (inputValue.trim().length > 0) {
        // Manual location setting when no suggestions are available
        const displayName = inputValue.trim();
        // Create location data with default New York coordinates
        const locationData: LocationData = {
          displayName: displayName,
          coordinates: [-74.0059728, 40.7127753] // New York coordinates as default
        };

        onLocationSelect(locationData);
        setInputValue(displayName);
        setOpen(false);
      }
    }
    // If Escape is pressed, close the popover
    else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleSelectLocation = async (placeId: string, description: string) => {
    try {
      setLoading(true);
      // Use our proxy API route instead of calling Google directly
      const response = await fetch(
        `/api/places/details?place_id=${placeId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch location details');
      }

      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const result = data.result;
        const { lat, lng } = result.geometry.location;

        // Create location data with the geocoded coordinates
        // Note: API requires [longitude, latitude] format
        const locationData: LocationData = {
          displayName: description.split(',')[0].trim(), // Use the main part of the description as display name
          coordinates: [lng, lat]
        };

        onLocationSelect(locationData);
        setInputValue(description.split(',')[0].trim());
        setOpen(false);
      } else {
        throw new Error('Invalid place details results');
      }
    } catch (error) {
      console.error('Error getting location details:', error);
      toast("Location Error", {
        description: "Could not get details for this location. Please try another one.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-2 w-full relative">
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (e.target.value.length >= 2) {
              setOpen(true);
            } else {
              setOpen(false);
            }
          }}
          onFocus={() => {
            if (inputValue.length >= 2) {
              setOpen(true);
            }
          }}
          onBlur={() => {
            // Delay closing to allow clicking on suggestions
            setTimeout(() => {
              if (!document.activeElement?.closest('[data-suggestion-item]')) {
                setOpen(false);
              }
            }, 200);
          }}
          onKeyDown={handleKeyDown}
          className="w-full"
          autoFocus
          aria-label="Location search"
        />

        <Button
          type="submit"
          size="sm"
          className="shrink-0"
          disabled={loading}
          onClick={() => {
            if (suggestions.length > 0) {
              const firstSuggestion = suggestions[0];
              handleSelectLocation(firstSuggestion.place_id, firstSuggestion.description);
            } else if (inputValue.trim().length > 0) {
              // Manual location setting when no suggestions are available
              const displayName = inputValue.trim();
              // Create location data with default New York coordinates
              const locationData: LocationData = {
                displayName: displayName,
                coordinates: [-74.0059728, 40.7127753] // New York coordinates as default
              };

              onLocationSelect(locationData);
              setInputValue(displayName);
              setOpen(false);
            }
          }}
        >
          Set
        </Button>
      </div>

      {open && (
        <div
          className="absolute z-50 mt-1 p-0 border border-input bg-background shadow-md rounded-md w-[calc(100%-3.5rem)] max-w-[calc(100vw-2rem)]"
          style={{ left: 0 }}
        >
          <Command className="rounded-md border-none bg-transparent">
            <CommandList className="max-h-[200px] overflow-auto">
              {loading ? (
                <CommandEmpty className="p-3 text-sm text-muted-foreground">Loading suggestions...</CommandEmpty>
              ) : suggestions.length === 0 ? (
                <CommandEmpty className="p-3 text-sm text-muted-foreground">No locations found</CommandEmpty>
              ) : (
                <CommandGroup className="p-1">
                  {suggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion.place_id}
                      onSelect={() => handleSelectLocation(suggestion.place_id, suggestion.description)}
                      className="flex items-center gap-2 cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                      data-suggestion-item
                    >
                      <MapPin className="h-4 w-4 text-primary" />
                      <div className="flex flex-col">
                        <span className="font-medium">{suggestion.structured_formatting.main_text}</span>
                        <span className="text-xs text-muted-foreground">
                          {suggestion.structured_formatting.secondary_text}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
