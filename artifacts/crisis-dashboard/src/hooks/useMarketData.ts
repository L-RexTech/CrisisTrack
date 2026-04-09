import { useState, useEffect, useCallback } from "react";

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  market_cap: number;
  sparkline_in_7d?: { price: number[] };
}

export interface ExchangeRate {
  base: string;
  rates: Record<string, number>;
  date: string;
}

export interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  url: string;
}

export interface MarketData {
  crypto: CryptoPrice[];
  rates: ExchangeRate | null;
  earthquakes: Earthquake[];
  lastUpdated: Date | null;
  loading: boolean;
  error: string | null;
}

async function fetchCrypto(): Promise<CryptoPrice[]> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,gold&order=market_cap_desc&per_page=10&page=1&sparkline=true&price_change_percentage=7d",
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error("CoinGecko rate limited");
  return res.json();
}

async function fetchRates(): Promise<ExchangeRate> {
  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!res.ok) throw new Error("Rates fetch failed");
  const json = await res.json();
  return {
    base: "USD",
    rates: { EUR: json.rates.EUR, GBP: json.rates.GBP, JPY: json.rates.JPY, CHF: json.rates.CHF },
    date: json.time_last_update_utc ?? "",
  };
}

async function fetchEarthquakes(): Promise<Earthquake[]> {
  const res = await fetch(
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson"
  );
  if (!res.ok) throw new Error("USGS fetch failed");
  const data = await res.json();
  return (data.features || []).slice(0, 10).map((f: any) => ({
    id: f.id,
    magnitude: f.properties.mag,
    place: f.properties.place,
    time: f.properties.time,
    url: f.properties.url,
  }));
}

const CACHE_KEY = "crisis_market_cache_v3";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(): { data: Partial<MarketData>; ts: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setCache(data: Partial<MarketData>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

export function useMarketData() {
  const [state, setState] = useState<MarketData>({
    crypto: [],
    rates: null,
    earthquakes: [],
    lastUpdated: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async (forceRefresh = false) => {
    setState((s) => ({ ...s, loading: true, error: null }));

    const cached = getCached();
    const isFresh = cached && Date.now() - cached.ts < CACHE_TTL;

    if (isFresh && !forceRefresh && cached) {
      setState({
        crypto: cached.data.crypto ?? [],
        rates: cached.data.rates ?? null,
        earthquakes: cached.data.earthquakes ?? [],
        lastUpdated: new Date(cached.ts),
        loading: false,
        error: null,
      });
      return;
    }

    const results = await Promise.allSettled([fetchCrypto(), fetchRates(), fetchEarthquakes()]);

    const crypto = results[0].status === "fulfilled" ? (results[0].value as CryptoPrice[]) : (cached?.data.crypto ?? []);
    const rates = results[1].status === "fulfilled" ? (results[1].value as ExchangeRate) : (cached?.data.rates ?? null);
    const earthquakes = results[2].status === "fulfilled" ? (results[2].value as Earthquake[]) : (cached?.data.earthquakes ?? []);

    const anyError = results.filter((r) => r.status === "rejected");
    const errorMsg = anyError.length > 0 ? "Some data sources unavailable — showing cached data" : null;

    const newData = { crypto, rates, earthquakes };
    setCache(newData);

    setState({
      crypto,
      rates,
      earthquakes,
      lastUpdated: new Date(),
      loading: false,
      error: errorMsg,
    });
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(), CACHE_TTL);
    return () => clearInterval(interval);
  }, [load]);

  return { ...state, refresh: () => load(true) };
}
