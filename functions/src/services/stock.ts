import yahooFinance from 'yahoo-finance2';

// Suppress notices if possible, or ignore if method missing
// yahooFinance.setGlobalConfig({ suppressNotices: ['yahooSurvey'] });

interface YahooQuote {
    regularMarketPrice?: number;
    symbol: string;
    currency?: string;
    regularMarketChange?: number;
    regularMarketChangePercent?: number;
    longName?: string;
}

interface YahooChart {
    quotes?: { close?: number }[];
    meta?: { regularMarketPrice?: number; chartPreviousClose?: number };
}

export interface StockData {
    symbol: string;
    price: number;
    currency: string;
    change: number; // Absolute change
    changePercent: number;
    ytdChangePercent: number;
    ytdChangeAbsolute: number;
    spyYtdChangePercent: number;
    ytdVsSpy: number;
    longName?: string;
}

export async function getStockData(input: string): Promise<StockData> {
    const symbol = input.toUpperCase().replace('$', '');
    const startOfYear = new Date('2025-01-01');

    try {
        // Fetch individually avoids tuple inference issues, and we cast to custom interfaces
        // because the library types are resolving to 'never' in this environment.
        const quote = await yahooFinance.quote(symbol) as unknown as YahooQuote;
        const tickerChart = await yahooFinance.chart(symbol, { period1: startOfYear }) as unknown as YahooChart;
        const spyChart = await yahooFinance.chart('SPY', { period1: startOfYear }) as unknown as YahooChart;

        const price = quote.regularMarketPrice || 0;

        // YTD Calculation - Use CLOSE price of first trading day of the year
        // Yahoo Finance uses the closing price of Jan 2nd (first trading day) for YTD
        const tickerQuotes = tickerChart.quotes || [];
        const tickerMeta = tickerChart.meta || {};
        const firstTickerQuote = tickerQuotes[0];
        const tickerYearStartPrice = firstTickerQuote?.close || tickerMeta.chartPreviousClose || price;
        const ytdChangeAbsolute = price - tickerYearStartPrice;
        const ytdChangePercent = (ytdChangeAbsolute / tickerYearStartPrice) * 100;

        // SPY Comparison - Same methodology
        const spyQuotes = spyChart.quotes || [];
        const spyMeta = spyChart.meta || {};
        const firstSpyQuote = spyQuotes[0];
        // spyMeta.regularMarketPrice is optional in interface, handled by fallback to spyPrice which needs to be defined?
        // Wait, logic: spyPrice = spyMeta.regularMarketPrice
        const spyPrice = spyMeta.regularMarketPrice || 0;

        const spyYearStartPrice = firstSpyQuote?.close || spyMeta.chartPreviousClose || spyPrice;
        const spyYtdChangePercent = ((spyPrice - spyYearStartPrice) / spyYearStartPrice) * 100;
        const ytdVsSpy = ytdChangePercent - spyYtdChangePercent;

        return {
            symbol: quote.symbol,
            price: price,
            currency: quote.currency || 'USD',
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0, // Quote already returns percentage in this version
            ytdChangePercent,
            ytdChangeAbsolute,
            spyYtdChangePercent,
            ytdVsSpy,
            longName: quote.longName,
        };
    } catch (error) {
        console.error('Error fetching stock data:', error);
        throw new Error(`Could not find stock data for ${symbol}`);
    }
}
