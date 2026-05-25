const BASE = process.env.AMADEUS_BASE_URL || "https://test.api.amadeus.com";

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.token;

  const id = process.env.AMADEUS_CLIENT_ID;
  const secret = process.env.AMADEUS_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Missing AMADEUS_CLIENT_ID or AMADEUS_CLIENT_SECRET");

  const res = await fetch(`${BASE}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: id,
      client_secret: secret,
    }),
  });
  if (!res.ok) throw new Error(`Amadeus auth failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

export async function lookupCityCode(query: string): Promise<{ iataCode: string; name: string } | null> {
  const token = await getToken();
  const url = `${BASE}/v1/reference-data/locations?subType=CITY,AIRPORT&keyword=${encodeURIComponent(query)}&page%5Blimit%5D=1`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const data = (await res.json()) as { data?: Array<{ iataCode: string; name: string }> };
  const first = data.data?.[0];
  return first ? { iataCode: first.iataCode, name: first.name } : null;
}

export type AmadeusFlight = {
  airline: string;
  price: string;
  currency: string;
  duration: string;
  stops: number;
  segments: number;
};

export async function searchFlights(params: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
}): Promise<AmadeusFlight[]> {
  const token = await getToken();
  const qs = new URLSearchParams({
    originLocationCode: params.origin,
    destinationLocationCode: params.destination,
    departureDate: params.departureDate,
    adults: String(params.adults),
    max: "5",
    currencyCode: "USD",
  });
  if (params.returnDate) qs.set("returnDate", params.returnDate);

  const res = await fetch(`${BASE}/v2/shopping/flight-offers?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    data?: Array<{
      price: { total: string; currency: string };
      validatingAirlineCodes?: string[];
      itineraries: Array<{
        duration: string;
        segments: Array<{ carrierCode: string }>;
      }>;
    }>;
  };
  return (data.data ?? []).slice(0, 3).map((offer) => {
    const firstItin = offer.itineraries[0];
    return {
      airline: offer.validatingAirlineCodes?.[0] ?? firstItin.segments[0]?.carrierCode ?? "?",
      price: offer.price.total,
      currency: offer.price.currency,
      duration: firstItin.duration,
      stops: Math.max(0, firstItin.segments.length - 1),
      segments: firstItin.segments.length,
    };
  });
}

export type AmadeusHotel = {
  name: string;
  hotelId: string;
};

export async function searchHotels(cityCode: string): Promise<AmadeusHotel[]> {
  const token = await getToken();
  const url = `${BASE}/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return [];
  const data = (await res.json()) as { data?: Array<{ name: string; hotelId: string }> };
  return (data.data ?? []).slice(0, 10).map((h) => ({ name: h.name, hotelId: h.hotelId }));
}
