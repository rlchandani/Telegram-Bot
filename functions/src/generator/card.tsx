import * as fs from 'fs';
import * as path from 'path';

import React from 'react';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

import { StockData } from '../services/stock';
import { WeatherData } from '../services/weather';
import { ThermometerIcon, WindIcon, HumidityIcon, VisibilityIcon, LargeWeatherIcon, SmallWeatherIcon, LocationIcon } from './icons';

export interface CardProps {
    type: 'stock' | 'weather' | 'multiStock';
    stockData?: StockData;
    multiStockData?: StockData[];
    weatherData?: WeatherData;
}

// Helper to load font
const loadFont = (): Buffer => {
    const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'Roboto-Regular.woff');
    return fs.readFileSync(fontPath);
};

const fontData = loadFont();

const colors = {
    bg: '#161e2b',
    boxBg: 'rgba(255, 255, 255, 0.03)',
    boxBorder: 'rgba(255, 255, 255, 0.1)',
    textDim: '#8b949e',
    textMain: '#ffffff',
    red: '#ff3b30',
    green: '#34c759'
};

const renderArrow = (isNeg: boolean) => (
    <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill={isNeg ? colors.red : colors.green}
        style={{ marginRight: '10px' }}
    >
        {isNeg ? (
            <path d="M12 17L4 8h16z" />
        ) : (
            <path d="M12 7l8 9H4z" />
        )}
    </svg>
);

const StockCard = ({ data }: { data: StockData }) => {
    const isChangeNeg = data.changePercent < 0;
    const isYtdNeg = data.ytdChangePercent < 0;
    const isVsSpyNeg = data.ytdVsSpy < 0;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '600px',
            height: '600px',
            backgroundColor: colors.bg,
            color: colors.textMain,
            padding: '40px',
            borderRadius: '24px',
            fontFamily: 'Roboto',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '8px' }}>
                <span style={{ color: colors.textDim, fontSize: '18px', letterSpacing: '1px' }}>TICKER</span>
                <span style={{ color: colors.textDim, fontSize: '18px', letterSpacing: '1px' }}>PRICE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'baseline', marginBottom: '4px' }}>
                <span style={{ fontSize: '64px', fontWeight: 'bold' }}>{data.symbol}</span>
                <span style={{ fontSize: '64px', fontWeight: 'bold' }}>${data.price.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', color: colors.textDim, fontSize: '24px', marginBottom: '32px' }}>
                {data.longName}
            </div>

            {/* Change and YTD Row */}
            <div style={{ display: 'flex', width: '100%', gap: '20px', marginBottom: '20px' }}>
                {/* Change Box */}
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    backgroundColor: colors.boxBg, border: `1px solid ${colors.boxBorder}`,
                    borderRadius: '20px', padding: '24px'
                }}>
                    <span style={{ color: colors.textDim, fontSize: '18px', marginBottom: '12px' }}>CHANGE</span>
                    <div style={{ display: 'flex', alignItems: 'center', color: isChangeNeg ? colors.red : colors.green, fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
                        {renderArrow(isChangeNeg)}
                        {Math.abs(data.changePercent).toFixed(2)}%
                    </div>
                    <span style={{ color: colors.textDim, fontSize: '20px' }}>
                        {isChangeNeg ? '-' : '+'}${Math.abs(data.change).toFixed(2)}
                    </span>
                </div>

                {/* YTD Box */}
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    backgroundColor: colors.boxBg, border: `1px solid ${colors.boxBorder}`,
                    borderRadius: '20px', padding: '24px'
                }}>
                    <span style={{ color: colors.textDim, fontSize: '18px', marginBottom: '12px' }}>YTD</span>
                    <div style={{ display: 'flex', alignItems: 'center', color: isYtdNeg ? colors.red : colors.green, fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
                        {renderArrow(isYtdNeg)}
                        {Math.abs(data.ytdChangePercent).toFixed(2)}%
                    </div>
                    <span style={{ color: colors.textDim, fontSize: '20px' }}>
                        {isYtdNeg ? '-' : '+'}${Math.abs(data.ytdChangeAbsolute).toFixed(2)}
                    </span>
                </div>
            </div>

            {/* YTD VS SPY Box */}
            <div style={{
                display: 'flex', width: '100%', flexDirection: 'column',
                backgroundColor: colors.boxBg, border: `1px solid ${colors.boxBorder}`,
                borderRadius: '20px', padding: '24px', marginBottom: '32px'
            }}>
                <span style={{ color: colors.textDim, fontSize: '18px', marginBottom: '12px' }}>YTD VS SPY</span>
                <div style={{ display: 'flex', alignItems: 'center', color: isVsSpyNeg ? colors.red : colors.green, fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {renderArrow(isVsSpyNeg)}
                    {Math.abs(data.ytdVsSpy).toFixed(2)}%
                </div>
                <div style={{ display: 'flex', color: colors.textDim, fontSize: '20px' }}>
                    Stock YTD: {data.ytdChangePercent > 0 ? '+' : ''}{data.ytdChangePercent.toFixed(2)}% • SPY YTD: {data.spyYtdChangePercent > 0 ? '+' : ''}{data.spyYtdChangePercent.toFixed(2)}%
                </div>
            </div>

            <div style={{ display: 'flex', alignSelf: 'flex-end', color: colors.textDim, fontSize: '14px', letterSpacing: '2px' }}>
                IREDLOF INTELLIGENCE
            </div>
        </div>
    );
};

const MultiStockCard = ({ data }: { data: StockData[] }) => {
    const verticalPadding = 40; // Top and bottom padding (symmetrical)
    const horizontalPadding = 40;
    const headerHeight = 30; // TICKER/PRICE header
    const rowHeight = 140; // Height per stock row
    const cardHeight = (verticalPadding * 2) + headerHeight + (data.length * rowHeight);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '600px',
            height: `${cardHeight}px`,
            backgroundColor: colors.bg,
            color: colors.textMain,
            padding: `${verticalPadding}px ${horizontalPadding}px`,
            borderRadius: '24px',
            fontFamily: 'Roboto',
        }}>
            {/* Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
                <span style={{ color: colors.textDim, fontSize: '18px', letterSpacing: '1px' }}>TICKER</span>
                <span style={{ color: colors.textDim, fontSize: '18px', letterSpacing: '1px' }}>PRICE</span>
            </div>

            {data.map((stock, index) => {
                const isChangeNeg = stock.changePercent < 0;
                const isYtdNeg = stock.ytdChangePercent < 0;
                const isVsSpyNeg = stock.ytdVsSpy < 0;

                return (
                    <div key={stock.symbol} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        paddingTop: index === 0 ? '0' : '16px',
                        paddingBottom: '16px',
                        borderBottom: index < data.length - 1 ? `1px solid ${colors.boxBorder}` : 'none',
                    }}>
                        {/* Row 1: Symbol & Price on left, Change % on right */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '42px', fontWeight: 'bold' }}>{stock.symbol}</span>
                                <span style={{ color: colors.textDim, fontSize: '20px', marginTop: '2px' }}>
                                    {stock.longName || stock.symbol}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ fontSize: '42px', fontWeight: 'bold' }}>${stock.price.toFixed(2)}</span>
                                <span style={{
                                    color: isChangeNeg ? colors.red : colors.green,
                                    fontSize: '24px',
                                    marginTop: '2px'
                                }}>
                                    {isChangeNeg ? '' : '+'}{stock.changePercent.toFixed(2)}%
                                </span>
                            </div>
                        </div>

                        {/* Row 2: YTD and YTD vs SPY */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            marginTop: '8px',
                            fontSize: '18px',
                        }}>
                            <span style={{ color: colors.textMain }}>YTD: </span>
                            <span style={{ color: isYtdNeg ? colors.red : colors.green, marginLeft: '4px' }}>
                                {isYtdNeg ? '' : '+'}{stock.ytdChangePercent.toFixed(2)}%
                            </span>
                            <span style={{ margin: '0 12px', color: colors.textMain }}>|</span>
                            <span style={{ color: colors.textMain }}>YTD vs SPY: </span>
                            <span style={{ color: isVsSpyNeg ? colors.red : colors.green, marginLeft: '4px' }}>
                                {isVsSpyNeg ? '' : '+'}{stock.ytdVsSpy.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Helper to draw smooth curve for hourly forecast
const drawTrendLine = (data: { temp: number }[], width: number, height: number, min: number, max: number) => {
    if (data.length < 2) return '';

    // Normalize Y
    const getY = (temp: number) => {
        const range = max - min || 1;
        // Invert Y because SVG 0 is top
        return height - ((temp - min) / range) * height;
    };

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = getY(d.temp);
        return [x, y];
    });

    return points.map((p, i) =>
        i === 0 ? `M ${p[0]},${p[1]}` : `L ${p[0]},${p[1]}`
    ).join(' ');
};

const drawTrendFill = (data: { temp: number }[], width: number, height: number, min: number, max: number) => {
    if (data.length < 2) return '';
    const linePath = drawTrendLine(data, width, height, min, max);
    return `${linePath} L ${width},${height} L 0,${height} Z`;
};

const WeatherCard = ({ data }: { data: WeatherData }) => {
    // Define Themes
    const darkTheme = {
        bg: colors.bg,             // #161e2b
        cardBg: colors.boxBg,      // rgba(255, 255, 255, 0.03)
        textMain: colors.textMain, // #ffffff
        textDim: colors.textDim,   // #8b949e
        accent: '#F4D03F',         // Gold
        chart: '#4FC3F7',          // Light blue
        border: colors.boxBorder   // rgba(255, 255, 255, 0.1)
    };

    const lightTheme = {
        bg: '#FFFFFF',
        cardBg: '#F8F9FA',         // Light gray for cards
        textMain: '#202124',       // Dark gray for text
        textDim: '#5F6368',        // Medium gray
        accent: '#F4B400',         // Darker Gold for visibility on white
        chart: '#1A73E8',          // Google Blue
        border: '#DADCE0'
    };

    // Select Colors
    const wColors = data.isDaytime ? lightTheme : darkTheme;

    // Calculate chart range
    const chartData = data.hourly.slice(1, 7); // Next 6 hours
    const temps = chartData.map(d => d.temp);
    const minTemp = Math.min(...temps) - 2;
    const maxTemp = Math.max(...temps) + 2;

    const formattedTime = (isoTime: string) => {
        try {
            const date = new Date(isoTime);
            if (isNaN(date.getTime())) return '';

            // Adjust to target location's timezone
            // date.getTime() is UTC ms. Add offsetSeconds * 1000 to get "Local UTC" ms.
            const localDate = new Date(date.getTime() + (data.utcOffsetSeconds * 1000));

            // Format using UTC methods to avoid server timezone interference
            let hours = localDate.getUTCHours();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            return `${hours} ${ampm}`;
        } catch (e) {
            return '';
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '600px',
            height: '1000px', // Taller card for all details
            backgroundColor: wColors.bg,
            padding: '40px',
            borderRadius: '24px',
            fontFamily: 'Roboto',
            color: wColors.textMain,
        }}>
            {/* 1. Header Section */}
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '40px' }}>
                {/* Location Header */}
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '20px' }}>
                    <LocationIcon color={wColors.textDim} size={42} />
                    <span style={{ fontSize: '36px', fontWeight: 'bold', marginLeft: '12px' }}>{data.city}, {data.country}</span>
                </div>

                {/* Weather Info Row */}
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '10px' }}>
                    {/* Icon */}
                    <div style={{ display: 'flex', marginRight: '30px' }}>
                        <LargeWeatherIcon iconUrl={data.icon} />
                    </div>

                    {/* Details Col */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '96px', fontWeight: 'bold', lineHeight: '1' }}>{Math.round(data.temperature)}°{data.unit}</span>
                        <span style={{ fontSize: '28px', color: wColors.textDim, marginTop: '8px', maxWidth: '300px' }}>{data.condition}</span>
                    </div>
                </div>

                {/* High/Low */}
                <div style={{ display: 'flex', gap: '30px', fontSize: '24px', fontWeight: '500', color: wColors.textDim }}>
                    <span>High: <span style={{ color: wColors.textMain, fontWeight: 'bold' }}>{Math.round(data.details.high)}°{data.unit}</span></span>
                    <span>Low: <span style={{ color: wColors.textMain, fontWeight: 'bold' }}>{Math.round(data.details.low)}°{data.unit}</span></span>
                </div>
            </div>

            {/* 2. Hourly Forecast (Chart) */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: wColors.cardBg,
                borderRadius: '24px',
                padding: '30px',
                marginBottom: '30px',
                border: `1px solid ${wColors.border}`,
            }}>
                {/* Icons & Temps Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    {chartData.map((h, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <SmallWeatherIcon iconUrl={h.icon} />
                            <span style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '8px' }}>{Math.round(h.temp)}°</span>
                        </div>
                    ))}
                </div>

                {/* Chart Line Area */}
                <div style={{ display: 'flex', position: 'relative', width: '100%', height: '60px', marginBottom: '10px' }}>
                    <svg width="460" height="60" style={{ overflow: 'visible' }}>
                        {/* Fill */}
                        <path
                            d={drawTrendFill(chartData, 460, 60, minTemp, maxTemp)}
                            fill={wColors.chart}
                            fillOpacity="0.2"
                            stroke="none"
                        />
                        {/* Draw Trend Line */}
                        <path
                            d={drawTrendLine(chartData, 460, 60, minTemp, maxTemp)}
                            fill="none"
                            stroke={wColors.chart}
                            strokeWidth="4"
                            strokeLinecap="round"
                        />
                        {/* Draw Points */}
                        {chartData.map((d, i) => {
                            const width = 460;
                            const height = 60;
                            const x = (i / (chartData.length - 1)) * width;
                            const y = height - ((d.temp - minTemp) / (maxTemp - minTemp || 1)) * height;
                            return (
                                <circle key={i} cx={x} cy={y} r="5" fill={wColors.chart} stroke={wColors.bg} strokeWidth="2" />
                            );
                        })}
                    </svg>
                </div>

                {/* Times Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                    {chartData.map((h, i) => (
                        <span key={i} style={{ fontSize: '16px', color: wColors.textDim }}>
                            {formattedTime(h.time)}
                        </span>
                    ))}
                </div>
            </div>

            {/* 3. Details Grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
                {/* Feels Like */}
                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', backgroundColor: wColors.cardBg, borderRadius: '24px', padding: '24px', border: `1px solid ${wColors.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', marginRight: '8px' }}>
                            <ThermometerIcon color={wColors.textDim} />
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: wColors.textDim, textTransform: 'uppercase' }}>FEELS LIKE</span>
                    </div>
                    <span style={{ fontSize: '36px', fontWeight: 'bold' }}>{Math.round(data.details.feelsLike)}°{data.unit}</span>
                </div>

                {/* Wind */}
                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', backgroundColor: wColors.cardBg, borderRadius: '24px', padding: '24px', border: `1px solid ${wColors.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', marginRight: '8px' }}>
                            <WindIcon color={wColors.textDim} />
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: wColors.textDim, textTransform: 'uppercase' }}>WIND</span>
                    </div>
                    <span style={{ fontSize: '36px', fontWeight: 'bold' }}>{Math.round(data.details.windSpeed)} <span style={{ fontSize: '20px' }}>{data.details.windUnit}</span></span>
                </div>

                {/* Humidity */}
                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', backgroundColor: wColors.cardBg, borderRadius: '24px', padding: '24px', border: `1px solid ${wColors.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', marginRight: '8px' }}>
                            <HumidityIcon color={wColors.textDim} />
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: wColors.textDim, textTransform: 'uppercase' }}>HUMIDITY</span>
                    </div>
                    <span style={{ fontSize: '36px', fontWeight: 'bold' }}>{data.details.humidity}%</span>
                </div>

                {/* Visibility */}
                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', backgroundColor: wColors.cardBg, borderRadius: '24px', padding: '24px', border: `1px solid ${wColors.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', marginRight: '8px' }}>
                            <VisibilityIcon color={wColors.textDim} />
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: wColors.textDim, textTransform: 'uppercase' }}>VISIBILITY</span>
                    </div>
                    <span style={{ fontSize: '36px', fontWeight: 'bold' }}>{Math.round(data.details.visibility)} <span style={{ fontSize: '20px' }}>{data.details.visibilityUnit}</span></span>
                </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
                <span style={{ fontSize: '14px', color: wColors.textDim, letterSpacing: '2px' }}>IREDLOF INTELLIGENCE</span>
            </div>
        </div>
    );
};

export async function generateCard(props: CardProps): Promise<Buffer> {
    const { type, stockData, multiStockData, weatherData } = props;

    let element: React.ReactNode;
    let height = 600;

    if (type === 'multiStock' && multiStockData) {
        element = <MultiStockCard data={multiStockData} />;
        height = (40 * 2) + 30 + (multiStockData.length * 140); // (padding * 2) + header + rows
    } else if (type === 'stock' && stockData) {
        element = <StockCard data={stockData} />;
        height = 600;
    } else if (type === 'weather' && weatherData) {
        element = <WeatherCard data={weatherData} />;
        height = 1000;
    } else {
        throw new Error('Invalid card type or missing data');
    }

    const svg = await satori(element, {
        width: 600,
        height,
        fonts: [{ name: 'Roboto', data: fontData, weight: 400, style: 'normal' }],
    });

    const resvg = new Resvg(svg, { fitTo: { mode: 'original' } });
    const pngData = resvg.render();
    return pngData.asPng();
}
