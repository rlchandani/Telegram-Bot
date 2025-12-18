
import axios from 'axios';

// Google Maps Geocoding Types
interface GeocodingResponse {
    results: {
        formatted_address: string;
        geometry: {
            location: {
                lat: number;
                lng: number;
            }
        };
        address_components: {
            long_name: string;
            short_name: string;
            types: string[];
        }[];
    }[];
    status: string;
}

// Google Weather API Types
interface WeatherCondition {
    type: string;
    description: {
        text: string;
    };
    iconBaseUri: string;
}

interface Temperature {
    degrees: number;
    unit: string;
}

interface Wind {
    speed: {
        value: number;
        unit: string; // KILOMETERS_PER_HOUR
    };
}

interface Visibility {
    distance: number;
    unit: string; // KILOMETERS
}

interface GoogleWeatherCurrent {
    weatherCondition: WeatherCondition;
    temperature: Temperature;
    feelsLikeTemperature: Temperature;
    relativeHumidity: number; // integer percent
    wind: Wind;
    visibility: Visibility;
    isDaytime: boolean; // Add this field
}

interface GoogleWeatherHourly {
    forecastHours: {
        interval: {
            startTime: string;
            endTime: string;
        };
        displayDateTime: {
            utcOffset: string;
        };
        temperature: Temperature;
        weatherCondition: WeatherCondition;
    }[];
}

interface GoogleWeatherDaily {
    forecastDays: {
        maxTemperature: Temperature;
        minTemperature: Temperature;
        weatherCondition: WeatherCondition;
    }[];
}

// Internal Shared Types
export interface WeatherData {
    city: string;
    country: string;
    temperature: number;
    unit: string;
    condition: string;
    icon: string | null;
    isDaytime: boolean; // Add this field
    utcOffsetSeconds: number; // New field for timezone handling
    details: {
        feelsLike: number;
        humidity: number;
        windSpeed: number;
        windUnit: string;
        visibility: number;
        visibilityUnit: string;
        high: number;
        low: number;
    };
    hourly: {
        time: string;
        temp: number;
        code: number;
        icon: string | null;
    }[];
}

// Map Google Weather Condition Types to WMO codes


export async function getWeatherData(query: string): Promise<WeatherData> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        throw new Error('GOOGLE_MAPS_API_KEY is not defined in environment variables');
    }

    try {
        // 1. Geocode
        const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
        const geoRes = await axios.get<GeocodingResponse>(geoUrl);

        if (geoRes.data.status !== 'OK' || geoRes.data.results.length === 0) {
            throw new Error(`Location not found: ${query}`);
        }

        const location = geoRes.data.results[0];
        const { lat, lng } = location.geometry.location;

        let city = location.address_components.find(c => c.types.includes('locality'))?.long_name;
        if (!city) city = location.address_components.find(c => c.types.includes('administrative_area_level_2'))?.long_name;
        if (!city) city = location.address_components.find(c => c.types.includes('administrative_area_level_1'))?.long_name;
        if (!city) city = query;

        const countryComponent = location.address_components.find(c => c.types.includes('country'));
        const country = countryComponent?.long_name || '';
        const countryCode = countryComponent?.short_name || '';

        // Determine system (US uses Imperial)
        // Liberia (LR) and Myanmar (MM) also officialy use non-metric but often mixed; we'll stick to US for strict Fahrenheit/Miles
        const isImperial = countryCode === 'US';

        // 2. Weather
        const baseUrl = 'https://weather.googleapis.com/v1';
        const locationParam = `location.latitude=${lat}&location.longitude=${lng}`;

        const [currentRes, hourlyRes, dailyRes] = await Promise.all([
            axios.get(`${baseUrl}/currentConditions:lookup?key=${apiKey}&${locationParam}`),
            axios.get(`${baseUrl}/forecast/hours:lookup?key=${apiKey}&${locationParam}`),
            axios.get(`${baseUrl}/forecast/days:lookup?key=${apiKey}&${locationParam}`)
        ]);

        const current = currentRes.data as GoogleWeatherCurrent;
        const hourly = hourlyRes.data as GoogleWeatherHourly;
        const daily = dailyRes.data as GoogleWeatherDaily;

        const todayForecast = daily.forecastDays?.[0];

        // Conversion Helpers
        const toF = (c: number) => (c * 9 / 5) + 32;
        const toMph = (kph: number) => kph * 0.621371;
        const toMiles = (km: number) => km * 0.621371;

        // Process Hourly (Next 24 hours)
        const hourlyData = (hourly.forecastHours || []).slice(0, 24).map(h => ({
            time: h.interval.startTime,
            temp: isImperial ? toF(h.temperature.degrees) : h.temperature.degrees,
            code: 0,
            icon: h.weatherCondition.iconBaseUri ? `${h.weatherCondition.iconBaseUri}.png` : null
        }));

        // Determine Timezone Offset
        let utcOffsetSeconds = 0;
        if (hourly.forecastHours && hourly.forecastHours.length > 0) {
            const offsetStr = hourly.forecastHours[0].displayDateTime.utcOffset;
            if (offsetStr && offsetStr.endsWith('s')) {
                utcOffsetSeconds = parseInt(offsetStr.slice(0, -1), 10);
            }
        }

        // Prepare Values
        const temp = isImperial ? toF(current.temperature.degrees) : current.temperature.degrees;
        const feelsLike = isImperial ? toF(current.feelsLikeTemperature.degrees) : current.feelsLikeTemperature.degrees;
        const high = isImperial ? toF(todayForecast?.maxTemperature.degrees ?? current.temperature.degrees) : (todayForecast?.maxTemperature.degrees ?? current.temperature.degrees);
        const low = isImperial ? toF(todayForecast?.minTemperature.degrees ?? current.temperature.degrees) : (todayForecast?.minTemperature.degrees ?? current.temperature.degrees);

        const windSpeed = isImperial ? toMph(current.wind.speed.value) : current.wind.speed.value;

        // Visibility: 'distance' typically in meters from API? Need to check. 
        // Debug script showed: "visibility": { "unit": "KILOMETERS", "distance": 16 }
        // If unit is KM, logic differs. Let's assume input is KILOMETERS if unit says so, or meters?
        // Debug output said unit: KILOMETERS.
        // If unit is KILOMETERS, we don't need to divide by 1000 for metric.
        // Let's protect against unit variation.
        let visibility = current.visibility.distance; // Assuming Matches unit in response
        // Actually, if response says KILOMETERS, let's use it.
        // If Imperial, convert KM -> Miles.
        if (current.visibility.unit === 'METERS') {
            visibility = visibility / 1000; // Convert meters to kilometers
        }

        // Now visibility is in KM.
        if (isImperial) {
            visibility = toMiles(visibility); // km to miles
        }

        return {
            city: city,
            country: country,
            temperature: temp,
            unit: isImperial ? 'F' : 'C',
            condition: current.weatherCondition.description.text,
            icon: current.weatherCondition.iconBaseUri ? `${current.weatherCondition.iconBaseUri}.png` : null,
            isDaytime: current.isDaytime, // Populate new field
            utcOffsetSeconds: utcOffsetSeconds,
            details: {
                feelsLike: feelsLike,
                humidity: current.relativeHumidity,
                windSpeed: windSpeed,
                windUnit: isImperial ? 'mph' : 'km/h',
                visibility: visibility,
                visibilityUnit: isImperial ? 'mi' : 'km',
                high: high,
                low: low
            },
            hourly: hourlyData
        };

    } catch (error: any) {
        console.error('Error fetching weather data from Google:', error?.response?.data || error.message || error);
        throw error;
    }
}
