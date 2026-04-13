/// <reference lib="dom" />

export const config = { runtime: "edge" };

const YAHOO_URL =
  "https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1d&range=8d&includePrePost=false";

export default async function handler(): Promise<Response> {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    "Content-Type": "application/json",
  };

  try {
    const res = await fetch(YAHOO_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0",
      },
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Yahoo returned ${res.status}` }), {
        status: 502,
        headers,
      });
    }
    const data = await res.json();
    return new Response(JSON.stringify(data), { status: 200, headers });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers,
    });
  }
}
