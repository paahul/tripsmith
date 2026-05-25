export type WeatherSummary = {
  city: string;
  country?: string;
  tempMinC: number;
  tempMaxC: number;
  rainyDays: number;
  description: string;
};

export async function getWeather(city: string): Promise<WeatherSummary | null> {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return null;

  const geoRes = await fetch(
    `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${key}`,
  );
  if (!geoRes.ok) return null;
  const geo = (await geoRes.json()) as Array<{ lat: number; lon: number; name: string; country: string }>;
  if (!geo[0]) return null;

  const { lat, lon, name, country } = geo[0];
  const fcRes = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}&units=metric`,
  );
  if (!fcRes.ok) return null;
  const fc = (await fcRes.json()) as {
    list: Array<{
      main: { temp_min: number; temp_max: number };
      weather: Array<{ main: string; description: string }>;
      dt_txt: string;
    }>;
  };

  let min = Infinity;
  let max = -Infinity;
  const rainyDays = new Set<string>();
  const descriptions: Record<string, number> = {};
  for (const item of fc.list) {
    min = Math.min(min, item.main.temp_min);
    max = Math.max(max, item.main.temp_max);
    const w = item.weather[0];
    if (w) {
      descriptions[w.main] = (descriptions[w.main] || 0) + 1;
      if (/rain|drizzle|thunderstorm/i.test(w.main)) {
        rainyDays.add(item.dt_txt.split(" ")[0]);
      }
    }
  }
  const topDesc =
    Object.entries(descriptions).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Mixed conditions";

  return {
    city: name,
    country,
    tempMinC: Math.round(min),
    tempMaxC: Math.round(max),
    rainyDays: rainyDays.size,
    description: topDesc,
  };
}
