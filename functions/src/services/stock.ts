import YahooFinance from 'yahoo-finance2';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yahooFinance = new (YahooFinance as any)({
    suppressNotices: ['yahooSurvey']
});

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
        // Fetch quote and charts in parallel
        const [quoteResult, tickerChart, spyChart] = await Promise.all([
            yahooFinance.quote(symbol),
            yahooFinance.chart(symbol, { period1: startOfYear }),
            yahooFinance.chart('SPY', { period1: startOfYear })
        ]);

        const quote = quoteResult;
        const price = quote.regularMarketPrice || 0;

        // YTD Calculation - Use CLOSE price of first trading day of the year
        // Yahoo Finance uses the closing price of Jan 2nd (first trading day) for YTD
        const tickerQuotes = tickerChart.quotes || [];
        const tickerYearStartPrice = tickerQuotes[0]?.close || tickerChart.meta.chartPreviousClose || price;
        const ytdChangeAbsolute = price - tickerYearStartPrice;
        const ytdChangePercent = (ytdChangeAbsolute / tickerYearStartPrice) * 100;

        // SPY Comparison - Same methodology
        const spyQuotes = spyChart.quotes || [];
        const spyPrice = spyChart.meta.regularMarketPrice;
        const spyYearStartPrice = spyQuotes[0]?.close || spyChart.meta.chartPreviousClose || spyPrice;
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
