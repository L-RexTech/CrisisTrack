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

export interface Disaster {
  id: string;
  name: string;
  type: string;
  country: string;
  date: string;
  status: string;
}

export interface CrudeOilData {
  price: number;
  change24h: number;
  change7d: number;
  sparkline: number[];
  source: string;
}

export interface MarketData {
  crypto: CryptoPrice[];
  rates: ExchangeRate | null;
  earthquakes: Earthquake[];
  disasters: Disaster[];
  crudeOil: CrudeOilData | null;
  lastUpdated: Date | null;
  loading: boolean;
  error: string | null;
}

async function fetchCrypto(): Promise<CryptoPrice[]> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,pax-gold&order=market_cap_desc&per_page=10&page=1&sparkline=true&price_change_percentage=7d",
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

const FALLBACK_DISASTERS: Disaster[] = [
  { id: "f1", name: "Earthquake — 7.6M, Mindanao, Philippines", type: "Earthquake", country: "Philippines", date: "2025-12-02", status: "ongoing" },
  { id: "f2", name: "Floods — South Asia Monsoon Season", type: "Flood", country: "Bangladesh", date: "2025-08-15", status: "ongoing" },
  { id: "f3", name: "Cyclone Chido — Mozambique Channel", type: "Cyclone", country: "Mozambique", date: "2025-12-14", status: "past" },
  { id: "f4", name: "Epidemic — Mpox Outbreak, DRC", type: "Epidemic", country: "DRC", date: "2024-09-01", status: "ongoing" },
  { id: "f5", name: "Drought — East Africa (5th consecutive)", type: "Drought", country: "Somalia", date: "2024-03-01", status: "ongoing" },
  { id: "f6", name: "Volcano Eruption — Ruang Volcano", type: "Volcano", country: "Indonesia", date: "2024-04-17", status: "past" },
  { id: "f7", name: "Landslide — Enga Province", type: "Landslide", country: "Papua New Guinea", date: "2024-05-24", status: "past" },
  { id: "f8", name: "Wildfire — Chile Valparaíso Region", type: "Technological Disaster", country: "Chile", date: "2024-02-02", status: "past" },
];

async function fetchDisasters(): Promise<Disaster[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(
      "https://api.reliefweb.int/v1/disasters?appname=crisistrack&limit=10&sort[]=date:desc&fields[include][]=name&fields[include][]=date&fields[include][]=type&fields[include][]=country&fields[include][]=status",
      { headers: { Accept: "application/json" }, signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!res.ok) throw new Error("ReliefWeb fetch failed");
    const json = await res.json();
    const live = (json.data || []).map((d: any) => ({
      id: String(d.id),
      name: d.fields.name ?? "Unknown",
      type: d.fields.type?.[0]?.name ?? "Disaster",
      country: d.fields.country?.[0]?.name ?? "Unknown",
      date: d.fields.date?.event ?? d.fields.date?.created ?? "",
      status: d.fields.status ?? "ongoing",
    }));
    return live.length ? live : FALLBACK_DISASTERS;
  } catch {
    clearTimeout(timeout);
    return FALLBACK_DISASTERS;
  }
}

// WTI Crude Oil — Yahoo Finance chart data.
// Yahoo Finance blocks direct browser CORS requests, so we route through
// Yahoo Finance via free CORS proxies (no key, no registration required).
const YAHOO_OIL_URL = "https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1d&range=8d&includePrePost=false";

function parseOilJson(json: any): CrudeOilData {
  const result = json.chart?.result?.[0];
  if (!result) throw new Error("No result data");
  const rawCloses: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
  const closes = rawCloses.filter((v): v is number => v != null);
  if (closes.length < 2) throw new Error("Insufficient data");
  const current = closes[closes.length - 1];
  const prev    = closes[closes.length - 2];
  const weekAgo = closes[0];
  return {
    price:     current,
    change24h: ((current - prev)    / prev)    * 100,
    change7d:  ((current - weekAgo) / weekAgo) * 100,
    sparkline: closes,
    source:    "Yahoo Finance · free, no key",
  };
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    return res;
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

// Free CORS proxies — tried in order.  corsproxy.io allows all browser
// origins (HTTPS) for free with no API key.  allorigins.win is the backup.
const CORS_PROXIES = [
  (url: string) => "https://corsproxy.io/?url=" + encodeURIComponent(url),
  (url: string) => "https://api.allorigins.win/raw?url=" + encodeURIComponent(url),
];

async function fetchCrudeOil(): Promise<CrudeOilData> {
  for (const makeProxy of CORS_PROXIES) {
    const proxyUrl = makeProxy(YAHOO_OIL_URL);
    try {
      const res = await fetchWithTimeout(proxyUrl, 6000);
      if (!res.ok) {
        console.warn("[CrudeOil] proxy returned", res.status, proxyUrl);
        continue;
      }
      const json = await res.json();
      return parseOilJson(json);
    } catch (err) {
      console.warn("[CrudeOil] proxy failed:", proxyUrl, err);
    }
  }

  // Direct request as absolute last resort (blocked in most browsers by CORS)
  try {
    const res = await fetchWithTimeout(YAHOO_OIL_URL, 5000);
    if (res.ok) return parseOilJson(await res.json());
  } catch (err) {
    console.warn("[CrudeOil] direct request also failed:", err);
  }

  return { price: 0, change24h: 0, change7d: 0, sparkline: [], source: "Yahoo Finance · unavailable" };
}

// Curated list of major active conflicts — updated periodically
export const ACTIVE_CONFLICTS = [
  { name: "Russia–Ukraine War", region: "Europe", intensity: 95, since: "Feb 2022", casualties: "~600K+", color: "#e05050" },
  { name: "Gaza / Israel War", region: "Middle East", intensity: 93, since: "Oct 2023", casualties: "~47K+", color: "#e05050" },
  { name: "Sudan Civil War", region: "Africa", intensity: 82, since: "Apr 2023", casualties: "~150K+", color: "#dca028" },
  { name: "Myanmar Civil War", region: "SE Asia", intensity: 74, since: "Feb 2021", casualties: "~50K+", color: "#dca028" },
  { name: "DRC–M23 Conflict", region: "Africa", intensity: 70, since: "2012/2022", casualties: "~10M displaced", color: "#dca028" },
  { name: "Haiti Gang Crisis", region: "Caribbean", intensity: 60, since: "2021", casualties: "~5K+", color: "#00c8ff" },
  { name: "Ethiopia–Amhara", region: "Africa", intensity: 55, since: "2023", casualties: "~10K+", color: "#00c8ff" },
  { name: "Mexico Cartel Wars", region: "N. America", intensity: 48, since: "ongoing", casualties: "~30K/yr", color: "#a07ae0" },
] as const;

const CACHE_KEY = "crisis_market_cache_v9";
const CACHE_TTL = 5 * 60 * 1000;

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
    disasters: [],
    crudeOil: null,
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
        crypto:      cached.data.crypto      ?? [],
        rates:       cached.data.rates       ?? null,
        earthquakes: cached.data.earthquakes ?? [],
        disasters:   cached.data.disasters   ?? [],
        crudeOil:    cached.data.crudeOil    ?? null,
        lastUpdated: new Date(cached.ts),
        loading: false,
        error: null,
      });
      return;
    }

    // Fetch the 4 fast sources first — render them immediately
    const [r0, r1, r2, r3] = await Promise.allSettled([
      fetchCrypto(),
      fetchRates(),
      fetchEarthquakes(),
      fetchDisasters(),
    ]);

    const crypto      = r0.status === "fulfilled" ? (r0.value as CryptoPrice[])  : (cached?.data.crypto      ?? []);
    const rates       = r1.status === "fulfilled" ? (r1.value as ExchangeRate)   : (cached?.data.rates       ?? null);
    const earthquakes = r2.status === "fulfilled" ? (r2.value as Earthquake[])   : (cached?.data.earthquakes ?? []);
    const disasters   = r3.status === "fulfilled" ? (r3.value as Disaster[])     : (cached?.data.disasters   ?? []);
    const cachedOil   = cached?.data.crudeOil ?? null;

    const failed = [r0, r1, r2, r3].filter((r) => r.status === "rejected").length;

    // Paint the page now with the fast data; crude oil card shows cached/dash until ready
    setState((s) => ({
      ...s,
      crypto, rates, earthquakes, disasters,
      crudeOil: cachedOil,
      lastUpdated: new Date(),
      loading: false,
      error: failed > 0 ? "Some data sources unavailable — showing cached data" : null,
    }));

    // Fetch crude oil in the background — update card when it resolves
    fetchCrudeOil().then((crudeOil) => {
      setState((s) => {
        const newData = { crypto: s.crypto, rates: s.rates, earthquakes: s.earthquakes, disasters: s.disasters, crudeOil };
        setCache(newData);
        return { ...s, crudeOil };
      });
    });
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(), CACHE_TTL);
    return () => clearInterval(interval);
  }, [load]);

  return { ...state, refresh: () => load(true) };
}
