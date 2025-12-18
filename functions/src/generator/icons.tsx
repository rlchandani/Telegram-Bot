import React from 'react';

export const ThermometerIcon = ({ color = '#34c759' }) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
);

export const WindIcon = ({ color = '#34c759' }) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
    </svg>
);

export const HumidityIcon = ({ color = '#34c759' }) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
);

export const VisibilityIcon = ({ color = '#34c759' }) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

export const LocationIcon = ({ color = '#8b949e', size = 20 }: { color?: string, size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

export const LargeWeatherIcon = ({ iconUrl }: { iconUrl?: string | null }): React.ReactElement | null => {
    if (iconUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconUrl} width={160} height={160} style={{ objectFit: 'contain' }} alt="weather icon" />
        );
    }
    return null;
};

export const SmallWeatherIcon = ({ iconUrl }: { iconUrl?: string | null }): React.ReactElement | null => {
    if (iconUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconUrl} width={48} height={48} style={{ objectFit: 'contain' }} alt="weather icon" />
        );
    }
    return null;
};
