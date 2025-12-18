import { generateCard } from './generator/card';
import * as fs from 'fs';
import * as path from 'path';
import { WeatherData } from './services/weather';
import { StockData } from './services/stock';

const OUTPUT_DIR = path.resolve(__dirname, '../../docs/screenshots');
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function main() {
    console.log('Generating assets to:', OUTPUT_DIR);

    // 1. Weather Day (Tokyo)
    const weatherDay: WeatherData = {
        city: 'Tokyo',
        country: 'Japan',
        temperature: 22,
        unit: 'C',
        condition: 'Mostly Sunny',
        isDaytime: true,
        icon: 'https://maps.gstatic.com/weather/v1/sunny.svg', // Mock URL
        utcOffsetSeconds: 32400, // +9h
        details: {
            feelsLike: 24,
            humidity: 45,
            windSpeed: 12,
            windUnit: 'km/h',
            visibility: 10,
            visibilityUnit: 'km',
            high: 25,
            low: 18
        },
        hourly: Array(24).fill(0).map((_, i) => ({
            time: new Date(Date.now() + (i * 3600000)).toISOString(),
            temp: 20 + Math.sin(i / 3) * 5,
            code: 0,
            icon: 'https://maps.gstatic.com/weather/v1/sunny.svg'
        }))
    };
    const weatherDayPng = await generateCard({ type: 'weather', weatherData: weatherDay });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'weather_day.png'), weatherDayPng);
    console.log('Generated weather_day.png');

    // 2. Weather Night (New York)
    const weatherNight: WeatherData = {
        city: 'New York',
        country: 'United States',
        temperature: 45,
        unit: 'F',
        condition: 'Clear',
        isDaytime: false,
        icon: 'https://maps.gstatic.com/weather/v1/cloudy.svg',
        utcOffsetSeconds: -18000, // -5h
        details: {
            feelsLike: 40,
            humidity: 60,
            windSpeed: 15,
            windUnit: 'mph',
            visibility: 10,
            visibilityUnit: 'mi',
            high: 50,
            low: 42
        },
        hourly: Array(24).fill(0).map((_, i) => ({
            time: new Date(Date.now() + (i * 3600000)).toISOString(),
            temp: 45 - Math.sin(i / 3) * 3,
            code: 0,
            icon: 'https://maps.gstatic.com/weather/v1/cloudy.svg'
        }))
    };
    const weatherNightPng = await generateCard({ type: 'weather', weatherData: weatherNight });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'weather_night.png'), weatherNightPng);
    console.log('Generated weather_night.png');

    // 3. Stock Single (NVDA)
    const stockNVDA: StockData = {
        symbol: 'NVDA',
        price: 135.50,
        currency: 'USD',
        change: 2.50,
        changePercent: 1.85,
        ytdChangePercent: 145.20,
        ytdChangeAbsolute: 80.00,
        spyYtdChangePercent: 20.50,
        ytdVsSpy: 124.70,
        longName: 'NVIDIA Corporation'
    };
    const stockSinglePng = await generateCard({ type: 'stock', stockData: stockNVDA });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'stock_single.png'), stockSinglePng);
    console.log('Generated stock_single.png');

    // 4. Stock Multi
    const stockMulti: StockData[] = [
        { ...stockNVDA, symbol: 'NVDA', price: 135.50, changePercent: 1.85 },
        {
            symbol: 'AAPL', price: 180.00, currency: 'USD', change: -1.20, changePercent: -0.66,
            ytdChangePercent: 15.00, ytdChangeAbsolute: 25.00, spyYtdChangePercent: 20.50, ytdVsSpy: -5.50, longName: 'Apple Inc.'
        },
        {
            symbol: 'TSLA', price: 230.00, currency: 'USD', change: 12.00, changePercent: 5.50,
            ytdChangePercent: -10.00, ytdChangeAbsolute: -25.00, spyYtdChangePercent: 20.50, ytdVsSpy: -30.50, longName: 'Tesla, Inc.'
        }
    ];
    const stockMultiPng = await generateCard({ type: 'multiStock', multiStockData: stockMulti });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'stock_multi.png'), stockMultiPng);
    console.log('Generated stock_multi.png');
}

main().catch(console.error);
