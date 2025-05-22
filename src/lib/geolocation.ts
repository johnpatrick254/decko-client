import { toast } from "sonner";

const getLocationFromIP = async () => {
    try {
        console.log('Getting location from IP address');
        const response = await fetch('https://ipinfo.io/json');

        if (!response.ok) {
            console.error('Failed to fetch IP location data, status:', response.status);
            toast.error("Network Error", {
                description: "Failed to connect to IP location service. Using default location.",
            });
            throw new Error('Failed to fetch IP location data');
        }

        const data = await response.json();
        console.log('IP geolocation response:', data);

        if (!data.city || !data.loc) {
            console.error('City or coordinates not found in IP geolocation data:', data);
            toast.error("Location Error", {
                
                description: "Could not determine your location from IP address. Using default location.",
            });
            throw new Error('City or coordinates not found in IP geolocation data');
        }

        console.log('Detected city from IP:', data.city);
        const [latitude, longitude] = data.loc.split(',').map(parseFloat);

        localStorage.setItem('user_coordinates', JSON.stringify([latitude, longitude]))
    } catch (error) {
        console.error('Error getting location from IP:', error);
        toast.error("Location Error", {
            description: "Could not detect your location from IP address. Distance tags will not be shown.",
        });
    }
};

export const handleGeolocation = async () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    localStorage.setItem('user_coordinates', JSON.stringify([latitude, longitude]))
                } catch (error) {
                    console.error('Error in geolocation handling:', error);
                    toast.error("Location Error", {
                        description: "Error processing your location. Falling back to IP-based detection.",
                    });
                }
            },
            (error) => {
                console.log('Geolocation error:', error);
                toast.error("Location Permission Denied", {
                    description: "Could not access your location. Falling back to IP-based detection.",
                });
            },
            { timeout: 10000 }
        );
    } else {
        toast.info("Geolocation Not Supported", {
            description: "Your device doesn't support geolocation. Using IP-based detection instead.",
        });
        getLocationFromIP()
    }
};


export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const earthRadius = 3958.8;
    const latRad1 = toRadians(lat1);
    const lonRad1 = toRadians(lon1);
    const latRad2 = toRadians(lat2);
    const lonRad2 = toRadians(lon2);

    const latDiff = latRad2 - latRad1;
    const lonDiff = lonRad2 - lonRad1;

    // Haversine formula
    const a = Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
        Math.cos(latRad1) * Math.cos(latRad2) *
        Math.sin(lonDiff / 2) * Math.sin(lonDiff / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;

    return Math.floor(distance);
}

function toRadians(degrees: number) {
    return degrees * (Math.PI / 180);
  }