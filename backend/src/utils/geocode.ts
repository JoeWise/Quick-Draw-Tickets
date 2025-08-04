import { getClientIp } from "./getClientIP";

export async function attemptGeocode(location: string, ipAddress: string): Promise<{ lat: number; lon: number } | null>
{
    let lat, lon;

    if (location)
    {
        // Geocode location and set lat and lon.
        const geocoded = await geocodeLocation(location);
        if (geocoded)
        {
            lat = geocoded.lat;
            lon = geocoded.lon;
        }
    }
    
    // If location geocoding failed, try IP address.
    if (!lat || !lon)
    {
        // geolocate IP address.
        if (ipAddress)
        {
            const geocoded = await geocodeIP(ipAddress)
            if (geocoded)
            {
                lat = geocoded.lat;
                lon = geocoded.lon;
            }
        }
    }

    // If IP address failed, return null.
    if (!lat || !lon)
        return null;
    else
        return { lat, lon };
}

export async function geocodeLocation(location: string): Promise<{ lat: number; lon: number } | null> 
{
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', location);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');

    try 
    {
        const response = await fetch(url.toString(), 
            {
                headers: {
                            'User-Agent': 'QuickDraw/1.0 (joethehobo2006@gmail.com)'
                         }
            });

        if (!response.ok) 
        {
            console.error('Geocoding failed with status:', response.status);
            return null;
        }

        const data = await response.json();
        const result = data[0];

        if (!result) 
            return null;

        return {
            lat: result.lat,
            lon: result.lon
        };
    }
    catch (error)
    {
        console.error('Fetch error:', error);
        return null;
    }
}

export async function geocodeIP(ip: string): Promise<{ lat: number; lon: number } | null>
{
    const url = `https://ipapi.co/${ip}/json/`;

    try
    {
        const response = await fetch(url);
        if (!response.ok)
        {
            console.error('Failed to fetch IP geolocation:', response.status);
            return null;
        }

        const data = await response.json();
        if (data.latitude && data.longitude)
        {
            return { lat: data.latitude, lon: data.longitude };
        }

        return null;
    }
    catch (error)
    {
        console.error('Error during IP geolocation:', error);
        return null;
    }
}

